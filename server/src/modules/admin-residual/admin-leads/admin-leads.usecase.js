// admin-residual/admin-leads usecase — orchestration only. Prisma appears ONLY for the
// admin `/new-lead` create (which had its logic INLINE in the legacy route — no service
// fn to wrap), driven through a single `$transaction` over the repo; every other operation
// is a side-effecting legacy SERVICE fn invoked via a lazy import adapter (behavior-
// preserving, no duplication). The lead-scoped object check is run by the route's
// requireSpecialChecker (reusing the leads-module keystone checker) BEFORE these methods.
//
// FLAGGED LEGACY DEVIATIONS (admin `/new-lead`) — see report; all are latent crashes in the
// legacy admin route that the IDENTICAL public `/new-lead` handler does NOT have:
//   1. `consultationLeadPrices` was referenced but NEVER defined in `routes/admin/admin.js`
//      → admin CONSULTATION leads threw ReferenceError (500). We define it to match the
//      public handler's table (the clear intent) so the route works.
//   2. The legacy admin route called `uploadFiles(body, clientLead.id)` — the wrong fn
//      (utility's multer `uploadFiles(req,res)`) with the wrong signature. The public
//      handler uses `uploadFile(body, clientLeadId)`. We wrap the CORRECT `uploadFile`.
//   3. The admin route emitted English/Arabic prose as the success message; the v2
//      envelope carries a language-neutral CODE instead (sanctioned contract change).
import XLSX from "xlsx";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  adminResidualMessagesCodes,
  authMessagesCodes,
  leadsMessagesCodes,
} from "@dms/shared";
import { adminLeadsRepository } from "./admin-leads.repo.js";
import { leadRepository } from "../../leads/lead/lead.repo.js";
import { newLeadNotification } from "../../../infra/notifications/index.js";
import {
  addUsersToATeleChannelUsingQueue,
  createChannelAndAddUsers,
} from "../../../infra/telegram/telegram-functions.js";

// FIX 3 (mass-assignment hardening): keys that must NEVER be written through the generic
// single-field update path (ownership, workflow status, money/system-managed). The frozen
// updateLeadField/updateClientField spread ALL non-field/inputType body keys into the prisma
// update, and the route schema is `.passthrough()`, so without this the caller could set
// userId/status/averagePrice/etc. in one "field update" call. The FE only ever edits ONE
// field per call (`EditFieldButton`: { [field]: value, inputType, field }), so we forward
// ONLY the named field and reject the protected ones outright.
const PROTECTED_FIELD_UPDATE_KEYS = new Set([
  "id",
  "userId",
  "assignedTo",
  "status",
  "clientId",
  "averagePrice",
  "price",
  "priceWithOutDiscount",
  "discount",
  "code",
  "createdAt",
  "updatedAt",
]);

// Price table for the priceOption funnel (verbatim from the legacy admin route).
const priceRangeValues = {
  "300,000 AED or less": 200000,
  "300,000 to 400,000 AED": 350000,
  "400,000 to 600,000 AED": 500000,
  "600,000 to 800,000 AED": 700000,
  "800,000 AED and above": 900000,
  "25,000 AED or less": 12500,
  "25,000 to 45,000 AED": 35000,
  "45,000 to 65,000 AED": 55000,
  "65,000 to 85,000 AED": 75000,
  "85,000 AED and above": 100000,
};

// Consultation price table — MISSING in the legacy admin route (deviation #1); ported
// from the identical public `routes/client/leads.js` handler where it IS defined.
const consultationLeadPrices = {
  ROOM: "800",
  BLUEPRINT: "1200",
  CITY_VISIT: "1800",
};

// Telegram operations (relocated from the god-file). The Prisma read goes through the repo;
// the telegram infra calls stay here in the usecase layer. Behavior ported 1:1.
export async function createNewTelegramLink({ leadId }) {
  const newChannel = await createChannelAndAddUsers({
    clientLeadId: Number(leadId),
  });
  return newChannel.inviteLink;
}

export async function addAllProjectUsersToChannel({ clientLeadId }) {
  clientLeadId = Number(clientLeadId);
  const clientLead = await adminLeadsRepository.findLeadForTelegram({ clientLeadId });

  if (!clientLead) {
    console.warn("? ClientLead not found");
    return;
  }

  const usersSet = new Map();

  if (clientLead.assignedTo?.telegramUsername) {
    usersSet.set(clientLead.assignedTo.telegramUsername, clientLead.assignedTo);
  }

  for (const project of clientLead.projects) {
    for (const assignment of project.assignments) {
      const user = assignment.user;
      if (user?.telegramUsername) {
        usersSet.set(user.telegramUsername, user);
      }
    }
  }

  if (!clientLead.telegramChannel) {
    throw new AppError({ code: adminResidualMessagesCodes.TELEGRAM_CHANNEL_NOT_FOUND, statusCode: 404 });
  }

  return await addUsersToATeleChannelUsingQueue({
    clientLeadId,
    usersList: Array.from(usersSet.values()),
  });
}

// new-lead side effects use the CORRECT fns the public handler uses (deviation #2):
// leadRepository.generateCodeForNewLead / leadRepository.uploadFile (imported at top).

class AdminLeadsUsecase {
  // ── bulk excel import ─────────────────────────────────────────────────────────────
  // Orchestration ported VERBATIM from the legacy createLeadFromExcelData (XLSX parse +
  // per-row client/lead/note writes through the repo). The controller owns req/res (the
  // no-file 400, the success 200, and the 500 envelope).
  async importLeadsFromExcel({ file }) {
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const fileData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Header row
    const headers = fileData[0];
    // Rows of data (excluding the header)
    const rows = fileData.slice(1);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Extract client fields
      const phone = row[0] ? String(row[0]) : "unknown";
      const name = row[2] || "unknown";

      // Generate fake email based on last client ID
      const lastClient = await adminLeadsRepository.findLastClient();
      const newClientId = lastClient ? lastClient.id + 1 : 1;
      const email = `fakeEmail${newClientId}@example.com`;

      // Create client
      const client = await adminLeadsRepository.createClient({
        data: {
          phone,
          name,
          email,
        },
      });
      const price = row[4]?.toString() || "0";
      const priceWithoutDiscount = !isNaN(parseFloat(row[4]))
        ? parseFloat(row[4])
        : 0;
      const averagePrice = !isNaN(parseFloat(row[4])) ? parseFloat(row[4]) : 0;
      const modifiedDate = row[9]
        ? XLSX.SSF.format("yyyy-mm-dd", row[9])
        : new Date().toISOString();

      const clientLead = await adminLeadsRepository.createClientLead({
        data: {
          clientId: client.id,
          selectedCategory: "OLDLEAD",
          type: "NONE",
          description: row[3] || null,
          price,
          priceWithOutDiscount: priceWithoutDiscount,
          averagePrice,
          createdAt: new Date(modifiedDate),
        },
      });

      // Extract notes
      const notes = [];
      if (row[5] && row[5].toString().trim()) {
        notes.push({
          content: `${headers[5]}: ${row[5]}`,
        });
      }
      if (row[6] && row[6].toString().trim()) {
        notes.push({
          content: `${headers[6]}: ${row[6]}`,
        });
      }
      if (row[8] && row[8].toString().trim()) {
        notes.push({
          content: `${headers[8]}: ${row[8]}`,
        });
      }

      for (const note of notes) {
        await adminLeadsRepository.createNote({
          data: {
            content: note.content,
            clientLeadId: clientLead.id,
            userId: 1, // Default user ID (adjust as needed)
          },
        });
      }
    }
  }

  // FIX 1 (BLOCKING): the destructive lead DELETE is base-role-ADMIN ONLY — exactly as the
  // legacy admin route narrowed it (`if (token.role !== "ADMIN") throw "Not allowed"`), on
  // TOP of the wider isAdmin gate. The route's requirePermissions([LEAD_DELETE]) + the lead
  // mutate-scope checker stay (defense in depth); this is the extra narrowing so that
  // SUPER_ADMIN / isSuperSales / an ADMIN-sub-role user is 403'd from deleting leads.
  assertCanDeleteLead({ authUser }) {
    if (!authUser?.isAdminTier) {
      throw new AppError({ code: authMessagesCodes.FORBIDDEN, statusCode: 403 });
    }
  }

  // FIX 3: build the minimal, safe update payload for the frozen single-field updaters.
  // Forward ONLY { field, inputType, [field]: value } — never the whole passthrough body —
  // and reject ownership/workflow/money/system fields so userId/status/etc. cannot be
  // mass-assigned through this generic path.
  #buildSingleFieldUpdate(body) {
    const { field, inputType } = body;
    if (PROTECTED_FIELD_UPDATE_KEYS.has(field)) {
      throw new AppError({ code: authMessagesCodes.FORBIDDEN, statusCode: 403 });
    }
    const data = { field, inputType };
    // carry only the value keyed by the named field (the frozen updater applies date
    // coercion to data[field] and spreads the rest — which is now just this one value).
    data[field] = body[field];
    return data;
  }

  // ── admin lead field update (lead-scoped; checker ran at the route) ──────────────
  updateLeadField({ id, body }) {
    return adminLeadsRepository.updateLeadField({ data: this.#buildSingleFieldUpdate(body), leadId: id });
  }

  // ── admin client field update (client-keyed; no single lead to scope) ────────────
  updateClientField({ clientId, body }) {
    if (body.field === "email") {
      throw new AppError({ code: adminResidualMessagesCodes.CLIENT_EMAIL_IMMUTABLE, statusCode: 400 });
    }
    return adminLeadsRepository.updateClientField({ data: this.#buildSingleFieldUpdate(body), clientId });
  }

  // ── admin delete lead (base-role-ADMIN only — FIX 1; lead-scope checker ran at the
  //    route too). The guard runs before the destructive cascading delete. ──────────
  async deleteLead({ id, authUser }) {
    this.assertCanDeleteLead({ authUser });
    const deleted = await adminLeadsRepository.deleteALead(id);
    if (!deleted) throw new AppError({ code: leadsMessagesCodes.LEAD_NOT_FOUND, statusCode: 404 });
    return deleted;
  }

  // ── telegram (lead-scoped; checker ran at the route) ─────────────────────────────
  createTelegramLink({ leadId }) {
    return createNewTelegramLink({ leadId });
  }

  assignTelegramUsers({ clientLeadId }) {
    return addAllProjectUsersToChannel({ clientLeadId });
  }

  // ── admin create new lead (inline-in-legacy logic, faithfully ported) ────────────
  async createNewLead({ body }) {
    const created = await adminLeadsRepository.runInTransaction(async (tx) => {
      let client = await adminLeadsRepository.findClientByEmail({ email: body.email, client: tx });

      if (!client) {
        client = await adminLeadsRepository.createClient({
          data: {
            name: body.name,
            phone: body.phone.replace(/\s+/g, ""),
            email: body.email,
          },
          client: tx,
        });
      } else {
        await adminLeadsRepository.updateClientPhone({ id: client.id, phone: body.phone, client: tx });
      }

      const data = {
        client: { connect: { id: client.id } },
        selectedCategory: body.category,
        type: body.item,
        status: "NEW",
        description: `${body.category} ${body.item} ${
          body.category === "DESIGN" ? (body.emirate ? body.emirate : "OUTSIDE UAE") : ""
        }`,
      };

      data.code = await leadRepository.generateCodeForNewLead(client.id);

      if (body.clientDescription) data.clientDescription = body.clientDescription;
      if (body.emirate) data.emirate = body.emirate;
      if (body.location === "OUTSIDE_UAE") data.emirate = "OUTSIDE";

      if (body.timeToContact) {
        const date = new Date(body.timeToContact);
        if (!isNaN(date)) data.timeToContact = date.toISOString();
      }

      if (body.country) data.country = body.country;

      if (body.priceRange) {
        data.price = `${body.priceRange[0]} - ${body.priceRange[1]}`;
        const averagePrice = (body.priceRange[0] + body.priceRange[1]) / 2;
        data.averagePrice = averagePrice;
        data.priceWithOutDiscount = averagePrice;
      }

      if (body.priceOption) {
        data.price = body.priceOption;
        data.averagePrice = priceRangeValues[body.priceOption];
        data.priceWithOutDiscount = priceRangeValues[body.priceOption];
      }

      if (body.category === "CONSULTATION") {
        data.price = consultationLeadPrices[body.item];
        data.averagePrice = Number(consultationLeadPrices[body.item]);
        data.priceWithOutDiscount = Number(consultationLeadPrices[body.item]);
      }

      data.initialConsult = false;

      const clientLead = await adminLeadsRepository.createClientLead({ data, client: tx });
      return { clientLead, client };
    });

    // Side effects AFTER the transaction commits (file upload + notification), matching
    // the legacy ordering. `uploadFile` is the correct fn (deviation #2).
    if (body.url) await leadRepository.uploadFile(body, created.clientLead.id);
    await newLeadNotification(created.clientLead.id, created.client, true);

    return created.clientLead;
  }
}

export const adminLeadsUsecase = new AdminLeadsUsecase();
export { AdminLeadsUsecase };

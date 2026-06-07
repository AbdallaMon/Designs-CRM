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
import prisma from "../../../infra/prisma/prisma.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { authMessagesCodes } from "@dms/shared";
import { adminLeadsRepository } from "./admin-leads.repository.js";

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

const legacyDefaults = {
  // bulk excel import — owns its own (req,res) response stream
  createLeadFromExcelData: (req, res) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.createLeadFromExcelData(req, res)),
  // admin lead field update (also wrapped by the leads module — reused here)
  updateLeadField: (a) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.updateLeadField(a)),
  // admin client field update
  updateClientField: (a) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.updateClientField(a)),
  // admin delete lead (FK-aware transactional delete)
  deleteALead: (leadId) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.deleteALead(leadId)),
  // telegram — create channel + queue project users (lead-scoped)
  createNewTelegramLink: (a) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.createNewTelegramLink(a)),
  addAllProjectUsersToChannel: (a) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.addAllProjectUsersToChannel(a)),
  // new-lead side effects (the CORRECT fns the public handler uses — deviation #2)
  generateCodeForNewLead: (clientId) =>
    import("../../../../services/main/client/leads.js").then((m) => m.generateCodeForNewLead(clientId)),
  uploadFile: (body, clientLeadId) =>
    import("../../../../services/main/client/leads.js").then((m) => m.uploadFile(body, clientLeadId)),
  newLeadNotification: (leadId, client, isAdmin) =>
    import("../../../../services/notification.js").then((m) => m.newLeadNotification(leadId, client, isAdmin)),
};

export class AdminLeadsUsecase {
  constructor(repository, legacy = {}) {
    this.repo = repository;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // ── bulk excel import (the frozen service owns the response) ─────────────────────
  importLeadsFromExcel({ req, res }) {
    return this.legacy.createLeadFromExcelData(req, res);
  }

  // FIX 1 (BLOCKING): the destructive lead DELETE is base-role-ADMIN ONLY — exactly as the
  // legacy admin route narrowed it (`if (token.role !== "ADMIN") throw "Not allowed"`), on
  // TOP of the wider isAdmin gate. The route's requirePermissions([LEAD_DELETE]) + the lead
  // mutate-scope checker stay (defense in depth); this is the extra narrowing so that
  // SUPER_ADMIN / isSuperSales / an ADMIN-sub-role user is 403'd from deleting leads.
  assertCanDeleteLead({ authUser }) {
    if (authUser?.role !== "ADMIN") {
      throw new AppError(authMessagesCodes.FORBIDDEN, 403);
    }
  }

  // FIX 3: build the minimal, safe update payload for the frozen single-field updaters.
  // Forward ONLY { field, inputType, [field]: value } — never the whole passthrough body —
  // and reject ownership/workflow/money/system fields so userId/status/etc. cannot be
  // mass-assigned through this generic path.
  #buildSingleFieldUpdate(body) {
    const { field, inputType } = body;
    if (PROTECTED_FIELD_UPDATE_KEYS.has(field)) {
      throw new AppError(authMessagesCodes.FORBIDDEN, 403);
    }
    const data = { field, inputType };
    // carry only the value keyed by the named field (the frozen updater applies date
    // coercion to data[field] and spreads the rest — which is now just this one value).
    data[field] = body[field];
    return data;
  }

  // ── admin lead field update (lead-scoped; checker ran at the route) ──────────────
  updateLeadField({ id, body }) {
    return this.legacy.updateLeadField({ data: this.#buildSingleFieldUpdate(body), leadId: id });
  }

  // ── admin client field update (client-keyed; no single lead to scope) ────────────
  updateClientField({ clientId, body }) {
    return this.legacy.updateClientField({ data: this.#buildSingleFieldUpdate(body), clientId });
  }

  // ── admin delete lead (base-role-ADMIN only — FIX 1; lead-scope checker ran at the
  //    route too). The guard runs before the destructive cascading delete. ──────────
  deleteLead({ id, authUser }) {
    this.assertCanDeleteLead({ authUser });
    return this.legacy.deleteALead(id);
  }

  // ── telegram (lead-scoped; checker ran at the route) ─────────────────────────────
  createTelegramLink({ leadId }) {
    return this.legacy.createNewTelegramLink({ leadId });
  }

  assignTelegramUsers({ clientLeadId }) {
    return this.legacy.addAllProjectUsersToChannel({ clientLeadId });
  }

  // ── admin create new lead (inline-in-legacy logic, faithfully ported) ────────────
  async createNewLead({ body }) {
    const created = await prisma.$transaction(async (tx) => {
      let client = await this.repo.findClientByEmail({ email: body.email, client: tx });

      if (!client) {
        client = await this.repo.createClient({
          data: {
            name: body.name,
            phone: body.phone.replace(/\s+/g, ""),
            email: body.email,
          },
          client: tx,
        });
      } else {
        await this.repo.updateClientPhone({ id: client.id, phone: body.phone, client: tx });
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

      data.code = await this.legacy.generateCodeForNewLead(client.id);

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

      const clientLead = await this.repo.createClientLead({ data, client: tx });
      return { clientLead, client };
    });

    // Side effects AFTER the transaction commits (file upload + notification), matching
    // the legacy ordering. `uploadFile` is the correct fn (deviation #2).
    if (body.url) await this.legacy.uploadFile(body, created.clientLead.id);
    await this.legacy.newLeadNotification(created.clientLead.id, created.client, true);

    return created.clientLead;
  }
}

export const adminLeadsUsecase = new AdminLeadsUsecase(adminLeadsRepository);

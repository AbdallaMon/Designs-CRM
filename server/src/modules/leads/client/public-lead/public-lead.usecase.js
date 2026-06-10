// leads/client/public-lead usecase — the PUBLIC website lead funnel (legacy
// `routes/client/leads.js`, mounted PATHLESS under `/client`, NO auth). Four endpoints:
//   POST /new-lead                              → createLead
//   POST /new-lead/register                     → registerLead
//   POST /new-lead/complete-register/:leadId    → completeRegister
//   POST /cooperation-requests                  → cooperationRequest
//
// PUBLIC BY DESIGN — a prospective client has no session. The only "identity" is the
// email/phone in the body, exactly like the booking funnel. The DISTINCT booking funnel
// (`/v2/client/booking-leads`, step-based `bookingRequestStatus` draft) does NOT cover these
// category/item/price website submissions — separate surfaces (see report).
//
// Heavy/side-effecting legacy logic is invoked via LAZY ADAPTERS (never duplicated): the lead
// code generator + file attach (`services/main/client/leads.js`), the notifications
// (`services/notification.js`), and the cooperation email (`services/sendMail.js`). The
// price-mapping tables and the data-shape assembly are PURE and moved here verbatim.
//
// All Arabic/English PROSE responses are REPLACED with language-neutral CODES (AppError for
// the guard failures, success codes via the controller). `lng` is still accepted for parity
// but is no longer used to pick a string.
import { AppError } from "../../../../shared/errors/AppError.js";
import { leadsMessagesCodes } from "@dms/shared";
import { buildCooperationRequestEmail } from "./public-lead.email.js";
import { publicLeadRepository } from "./public-lead.repository.js";

const C = leadsMessagesCodes;

// Verbatim from legacy.
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

const consultationLeadPrices = {
  ROOM: "800",
  BLUEPRINT: "1200",
  CITY_VISIT: "1800",
};

// Lazy adapters — frozen legacy services, imported on demand, never duplicated.
const legacyDefaults = {
  generateCodeForNewLead: (clientId) =>
    import("../../../../../services/main/client/leads.js").then((m) =>
      m.generateCodeForNewLead(clientId),
    ),
  uploadFile: (body, leadId) =>
    import("../../../../../services/main/client/leads.js").then((m) =>
      m.uploadFile(body, leadId),
    ),
  newLeadNotification: (leadId, client, isAdmin) =>
    import("../../../../../services/notification.js").then((m) =>
      m.newLeadNotification(leadId, client, isAdmin),
    ),
  newClientLeadNotification: (leadId, client, isAdmin) =>
    import("../../../../../services/notification.js").then((m) =>
      m.newClientLeadNotification(leadId, client, isAdmin),
    ),
  newLeadCompletedNotification: (leadId, client, isAdmin) =>
    import("../../../../../services/notification.js").then((m) =>
      m.newLeadCompletedNotification(leadId, client, isAdmin),
    ),
  sendEmail: (to, subject, html) =>
    import("../../../../../services/sendMail.js").then((m) =>
      m.sendEmail(to, subject, html),
    ),
};

// Build the optional lead fields from the (already validated/stripped) body — verbatim
// mapping from legacy, only the known keys are read.
function applyOptionalLeadFields(data, body) {
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
  return data;
}

export class PublicLeadUsecase {
  constructor(repository, legacy = {}) {
    this.repository = repository;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // POST /new-lead
  async createLead(body) {
    const client = await this.#resolveClientOrThrow(body);

    const data = {
      client: { connect: { id: client.id } },
      selectedCategory: body.category,
      type: body.item,
      status: "NEW",
      description: `${body.category} ${body.item} ${
        body.category === "DESIGN"
          ? body.emirate
            ? body.emirate
            : "OUTSIDE UAE"
          : ""
      }`,
    };

    data.code = await this.legacy.generateCodeForNewLead(client.id);
    applyOptionalLeadFields(data, body);

    if (body.category === "CONSULTATION") {
      data.price = consultationLeadPrices[body.item];
      data.averagePrice = Number(consultationLeadPrices[body.item]);
      data.priceWithOutDiscount = Number(consultationLeadPrices[body.item]);
    }

    data.initialConsult = false;

    const clientLead = await this.repository.createLead(data);
    if (body.url) await this.legacy.uploadFile(body, clientLead.id);
    await this.legacy.newLeadNotification(clientLead.id, client, true);

    return clientLead;
  }

  // POST /new-lead/register
  async registerLead(body) {
    // master fdefbbf: register tolerates a missing name/phone (draft placeholders).
    const client = await this.#resolveClientOrThrow(body, {
      registerDefaults: true,
    });

    const data = {
      client: { connect: { id: client.id } },
      selectedCategory: "DESIGN",
      status: "NEW",
      description: `Didn't complete register yet`,
    };
    data.code = await this.legacy.generateCodeForNewLead(client.id);
    data.initialConsult = false;
    if (body.stateOfTheProject) data.stateOfTheProject = body.stateOfTheProject;

    const clientLead = await this.repository.createLead(data);
    await this.legacy.newClientLeadNotification(clientLead.id, client, true);

    return clientLead;
  }

  // POST /new-lead/complete-register/:leadId
  async completeRegister(leadId, body) {
    const lead = await this.repository.findLeadById(leadId);
    if (!lead) {
      throw new AppError(C.LEAD_NOT_FOUND, 404);
    }

    // Legacy guard: a lead that already moved past the draft AND has a price cannot be
    // re-submitted.
    if (lead.description !== "Didn't complete register yet") {
      if (lead.price && lead.averagePrice) {
        throw new AppError(C.CLIENT_LEAD_ALREADY_COMPLETED, 400);
      }
    }

    const data = {
      type: body.item,
      status: "NEW",
      description: `${body.category} ${body.item} ${
        body.category === "DESIGN"
          ? body.emirate
            ? body.emirate
            : "OUTSIDE UAE"
          : ""
      }`,
    };
    applyOptionalLeadFields(data, body);
    if (body.discoverySource) data.discoverySource = body.discoverySource;
    // master fdefbbf: completing the registration also fixes up the client's real
    // name/phone (replacing the draft placeholders written at the register step).
    if (body.phone)
      data.client = { update: { phone: body.phone.replace(/\s+/g, "") } };
    if (body.name)
      data.client = {
        update: {
          name: body.name,
          ...(data.client?.update && data.client.update),
        },
      };

    const clientLead = await this.repository.updateLead(leadId, data);
    if (body.url) await this.legacy.uploadFile(body, clientLead.id);

    const client = await this.repository.findClientById(lead.clientId);
    await this.legacy.newLeadCompletedNotification(clientLead.id, client, true);

    return clientLead;
  }

  // POST /cooperation-requests — partner contact form → email only (no DB write).
  async cooperationRequest(body) {
    const to =
      process.env.ISLOCAL === "true"
        ? "info@abdallaabdelsabour.com"
        : "info@ahmadmobayed.com";
    const html = buildCooperationRequestEmail(body);
    await this.legacy.sendEmail(to, "New Cooperation Request", html);
  }

  // Find-or-create the Client, and block a second submission on the same day (legacy).
  // `registerDefaults` (master fdefbbf): the register step may arrive without name/phone —
  // create with draft placeholders, and only push a (space-stripped) phone update if given.
  async #resolveClientOrThrow(body, { registerDefaults = false } = {}) {
    let client = await this.repository.findClientByEmail(body.email);

    if (!client) {
      client = await this.repository.createClient(
        registerDefaults
          ? {
              name: body.name || "draft",
              phone: body.phone || "+0123456789",
              email: body.email,
            }
          : {
              name: body.name,
              phone: body.phone,
              email: body.email,
            },
      );
      return client;
    }

    const existingLead = await this.repository.findTodaysLeadByEmail(body.email);
    if (existingLead) {
      throw new AppError(C.CLIENT_LEAD_ALREADY_TODAY, 422);
    }

    await this.repository.updateClientPhone(
      client.id,
      registerDefaults ? body.phone?.replace(/\s+/g, "") : body.phone,
    );
    return client;
  }
}

export const publicLeadUsecase = new PublicLeadUsecase(publicLeadRepository);

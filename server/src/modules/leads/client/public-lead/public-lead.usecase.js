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
// (`src/infra/notifications/index.js`), and the cooperation email (`src/infra/mail/send-mail.js`). The
// price-mapping tables and the data-shape assembly are PURE and moved here verbatim.
//
// All Arabic/English PROSE responses are REPLACED with language-neutral CODES (AppError for
// the guard failures, success codes via the controller). `lng` is still accepted for parity
// but is no longer used to pick a string.
import { AppError } from "../../../../shared/errors/AppError.js";
import { EMIRATES, LEAD_CATEGORIES, LEAD_LOCATIONS, LEAD_STATUSES, leadsMessagesCodes, AUDIT_MODULES, AUDIT_ACTIONS } from "@dms/shared";
import { recordAction } from "../../../../infra/audit/record-action.js";
import { buildCooperationRequestEmail } from "./public-lead.email.js";
import { publicLeadRepository } from "./public-lead.repo.js";
import { leadRepository } from "../../lead/lead.repo.js";
import {
  newLeadNotification,
  newClientLeadNotification,
  newLeadCompletedNotification,
} from "../../../../infra/notifications/index.js";
import { sendEmail } from "../../../../infra/mail/send-mail.js";
import {
  issuePublicFunnelCapability,
  PUBLIC_FUNNEL_PURPOSES,
  verifyPublicFunnelCapability,
} from "../../../../infra/upload/public-funnel-capability.js";

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

function mapPublicLeadResponse(lead) {
  return {
    id: lead.id,
    code: lead.code ?? null,
    clientId: lead.clientId,
    status: lead.status,
    selectedCategory: lead.selectedCategory,
    type: lead.type ?? null,
    source: lead.source ?? null,
  };
}

function assertLeadBoundUploadUrl(leadId, url) {
  if (!url) return;
  const expectedPrefix = `/uploads/public/public-lead/${Number(leadId)}/`;
  if (!url.startsWith(expectedPrefix)) {
    throw new AppError({
      code: leadsMessagesCodes.LEAD_ACCESS_DENIED,
      statusCode: 403,
    });
  }
}

// Side-effecting legacy collaborators — the lead code generator + file attach (lead repo),
// the funnel notifications, and the cooperation email — are now imported statically at the
// top and called directly (no lazy-import deps bag). Behavior is unchanged.

// Build the optional lead fields from the (already validated/stripped) body — verbatim
// mapping from legacy, only the known keys are read.
function applyOptionalLeadFields(data, body) {
  if (body.clientDescription) data.clientDescription = body.clientDescription;
  if (body.emirate) data.emirate = body.emirate;
  if (body.location === LEAD_LOCATIONS.OUTSIDE_UAE) data.emirate = EMIRATES.OUTSIDE;

  if (body.timeToContact) {
    const date = new Date(body.timeToContact);
    if (!isNaN(date)) data.timeToContact = date.toISOString();
  }

  if (body.country) data.country = body.country;
  if (body.source) data.source = body.source;

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

class PublicLeadUsecase {
  // POST /new-lead
  async createLead(body, auditCtx) {
    const client = await this.#resolveClientOrThrow(body);

    const data = {
      client: { connect: { id: client.id } },
      selectedCategory: body.category,
      type: body.item,
      status: LEAD_STATUSES.NEW,
      description: `${body.category} ${body.item} ${
        body.category === "DESIGN"
          ? body.emirate
            ? body.emirate
            : "OUTSIDE UAE"
          : ""
      }`,
    };

    data.code = await leadRepository.generateCodeForNewLead(client.id);
    applyOptionalLeadFields(data, body);

    if (body.category === LEAD_CATEGORIES.CONSULTATION) {
      data.price = consultationLeadPrices[body.item];
      data.averagePrice = Number(consultationLeadPrices[body.item]);
      data.priceWithOutDiscount = Number(consultationLeadPrices[body.item]);
    }

    data.initialConsult = false;

    const clientLead = await publicLeadRepository.createLead(data);
    if (body.url) await leadRepository.uploadFile(body, clientLead.id);
    await newLeadNotification(clientLead.id, client, true);

    // Semantic audit: a new lead entered the funnel (actor is null for the public form).
    await recordAction(auditCtx, {
      module: AUDIT_MODULES.LEAD,
      action: AUDIT_ACTIONS.LEAD_CREATED,
      entityType: "ClientLead",
      entityId: clientLead.id,
      clientLeadId: clientLead.id,
      summary: `Lead #${clientLead.id} created`,
      after: {
        status: clientLead.status,
        selectedCategory: clientLead.selectedCategory,
        type: clientLead.type,
        clientId: clientLead.clientId,
      },
    });

    return mapPublicLeadResponse(clientLead);
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
      status: LEAD_STATUSES.NEW,
      description: `Didn't complete register yet`,
    };
    data.code = await leadRepository.generateCodeForNewLead(client.id);
    data.initialConsult = false;
    if (body.stateOfTheProject) data.stateOfTheProject = body.stateOfTheProject;
    if (body.source) data.source = body.source;

    const clientLead = await publicLeadRepository.createLead(data);
    await newClientLeadNotification(clientLead.id, client, true);

    const capability = issuePublicFunnelCapability({
      purpose: PUBLIC_FUNNEL_PURPOSES.PUBLIC_REGISTER,
      leadId: clientLead.id,
    });

    return {
      ...mapPublicLeadResponse(clientLead),
      capabilityToken: capability.token,
      capabilityExpiresIn: capability.expiresIn,
    };
  }

  authorizeCompleteRegister(leadId, token) {
    return verifyPublicFunnelCapability(token, {
      purpose: PUBLIC_FUNNEL_PURPOSES.PUBLIC_REGISTER,
      leadId,
    });
  }

  async getRegistrationStatus(leadId) {
    const lead = await publicLeadRepository.findRegistrationStatusById(leadId);
    if (!lead) {
      throw new AppError({ code: leadsMessagesCodes.LEAD_NOT_FOUND, statusCode: 404 });
    }

    return {
      id: lead.id,
      completed: lead.description !== "Didn't complete register yet",
      item: lead.type ?? null,
    };
  }

  // POST /new-lead/complete-register/:leadId
  async completeRegister(leadId, body) {
    const lead = await publicLeadRepository.findLeadById(leadId);
    if (!lead) {
      throw new AppError({ code: leadsMessagesCodes.LEAD_NOT_FOUND, statusCode: 404 });
    }

    // A registration capability may be replayed until it expires, so the workflow state
    // must independently guarantee that completion happens only once.
    if (lead.description !== "Didn't complete register yet") {
      throw new AppError({
        code: leadsMessagesCodes.CLIENT_LEAD_ALREADY_COMPLETED,
        statusCode: 400,
      });
    }

    assertLeadBoundUploadUrl(leadId, body.url);

    const data = {
      type: body.item,
      status: LEAD_STATUSES.NEW,
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
    const clientData = {};
    if (body.phone) clientData.phone = body.phone.replace(/\s+/g, "");
    if (body.name) clientData.name = body.name;

    const clientLead = await publicLeadRepository.completeRegistrationDraft({
      id: leadId,
      clientId: lead.clientId,
      leadData: data,
      clientData,
    });
    if (!clientLead) {
      throw new AppError({
        code: leadsMessagesCodes.CLIENT_LEAD_ALREADY_COMPLETED,
        statusCode: 409,
      });
    }
    if (body.url) await leadRepository.uploadFile(body, clientLead.id);

    const client = await publicLeadRepository.findClientById(lead.clientId);
    await newLeadCompletedNotification(clientLead.id, client, true);

    return mapPublicLeadResponse(clientLead);
  }

  // POST /cooperation-requests — partner contact form → email only (no DB write).
  async createCooperationRequest(body) {
    const to =
      process.env.ISLOCAL === "true"
        ? "info@abdallaabdelsabour.com"
        : "info@ahmadmobayed.com";
    const html = buildCooperationRequestEmail(body);
    await sendEmail(to, "New Cooperation Request", html);
  }

  // Find-or-create the Client, and block a second submission on the same day (legacy).
  // `registerDefaults` (master fdefbbf): the register step may arrive without name/phone —
  // create with draft placeholders, and only push a (space-stripped) phone update if given.
  async #resolveClientOrThrow(body, { registerDefaults = false } = {}) {
    let client = await publicLeadRepository.findClientByEmail(body.email);

    if (!client) {
      client = await publicLeadRepository.createClient(
        registerDefaults
          ? {
              name: body.name || "draft",
              // master fdefbbf: space-strip the real phone, else draft placeholder.
              phone: body.phone ? body.phone.replace(/\s+/g, "") : "+0123456789",
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

    const existingLead = await publicLeadRepository.findTodaysLeadByEmail(body.email);
    if (existingLead) {
      throw new AppError({ code: leadsMessagesCodes.CLIENT_LEAD_ALREADY_TODAY, statusCode: 422 });
    }

    await publicLeadRepository.updateClientPhone(
      client.id,
      registerDefaults ? body.phone?.replace(/\s+/g, "") : body.phone,
    );
    return client;
  }
}

export const publicLeadUsecase = new PublicLeadUsecase();
export { PublicLeadUsecase };

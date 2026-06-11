import { isClientField, isLeadField } from "./booking-leads.validation.js";
import {
  notifyLeadCreated,
  notifyLeadSubmitted,
} from "./booking-leads.notification.js";
import { bookingLeadsEmails } from "./booking-leads.emails.js";
import { AppError } from "../../../../shared/errors/AppError.js";

// master 03ca4d3: after a successful booking submit, send the client a "thanks" email.
// Routed through the FROZEN services/sendMail.js so the client-facing from-name/address
// (isClient=true → engineer's identity) is preserved exactly; the frozen service swallows
// its own send errors, so a mail failure never breaks the submit.
const legacyMailer = {
  sendEmail: (to, subject, html, isClient) =>
    import("../../../../../services/sendMail.js").then((m) =>
      m.sendEmail(to, subject, html, isClient),
    ),
};

const DRAFT_EMAIL_DOMAIN = "draft.local";

function buildDraftEmail() {
  const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `booking+${token}@${DRAFT_EMAIL_DOMAIN}`;
}

function normalizeDraftString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue || null;
}

function normalizeDraftEmail(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue || normalizedValue.endsWith(`@${DRAFT_EMAIL_DOMAIN}`)) {
    return null;
  }

  return normalizedValue;
}

function mapBookingLeadResponse(lead) {
  const client = lead.client ?? {};

  return {
    id: lead.id,
    status: lead.bookingRequestStatus,
    submittedAt: lead.bookingSubmittedAt,
    location: lead.location ?? null,
    projectType: lead.projectType ?? null,
    projectStage: lead.projectStage ?? null,
    previousWork: lead.previousWork ?? null,
    hasArchitecturalPlan: lead.hasArchitecturalPlan ?? null,
    serviceType: lead.serviceType ?? null,
    decisionMaker: lead.decisionMaker ?? null,
    name: normalizeDraftString(client.name),
    phone: normalizeDraftString(client.phone),
    email: normalizeDraftEmail(client.email),
    contactAgreement:
      typeof client.contactAgreement === "boolean"
        ? client.contactAgreement
        : null,
    contactInitialPriceAgreement:
      typeof client.contactInitialPriceAgreement === "boolean"
        ? client.contactInitialPriceAgreement
        : null,
  };
}

export class BookingLeadsUsecase {
  constructor(repository) {
    this.repository = repository;
  }

  async createBookingLead({ name, phone }) {
    const lead = await this.repository.createDraft({
      clientDraft: {
        name,
        phone,
        email: buildDraftEmail(),
      },
    });

    await notifyLeadCreated(lead);

    return mapBookingLeadResponse(lead);
  }

  async getBookingLead(leadId) {
    const lead = await this.#getExistingOrThrow(leadId);
    return mapBookingLeadResponse(lead);
  }

  async updateBookingLeadStep(leadId, { field, value }) {
    const existingLead = await this.#getExistingOrThrow(leadId);

    if (existingLead.bookingRequestStatus === "SUBMITTED") {
      throw new AppError("booking.alreadySubmitted", 409);
    }

    const leadData = isLeadField(field)
      ? {
          [field]: value,
          bookingRequestStatus: "IN_PROGRESS",
        }
      : {};

    const clientData = isClientField(field)
      ? {
          [field]: value,
        }
      : {};

    const updatedLead = await this.repository.updateStep({
      leadId,
      clientId: existingLead.client.id,
      leadData,
      clientData,
    });

    return mapBookingLeadResponse(updatedLead);
  }

  async submitBookingLead(leadId, payload) {
    const existingLead = await this.#getExistingOrThrow(leadId);

    if (existingLead.bookingRequestStatus === "SUBMITTED") {
      throw new AppError(
        "This lead has already been submitted and cannot be submitted again",
        409,
      );
    }

    const leadData = {};
    const clientData = {};

    for (const [field, value] of Object.entries(payload)) {
      if (isLeadField(field)) {
        leadData[field] = value;
      }

      if (isClientField(field)) {
        clientData[field] = value;
      }
    }

    leadData.bookingRequestStatus = "SUBMITTED";
    leadData.bookingSubmittedAt = new Date();

    const updatedLead = await this.repository.submit({
      leadId,
      clientId: existingLead.client.id,
      leadData,
      clientData,
    });

    // master 03ca4d3: thank the client by email after a successful booking submit.
    const clientEmail = updatedLead.client?.email;
    if (clientEmail) {
      const thanksEmail = bookingLeadsEmails.leadThanksEmail({
        email: clientEmail,
        clientName: updatedLead.client?.name,
      });
      await legacyMailer.sendEmail(
        clientEmail,
        thanksEmail.subject,
        thanksEmail.html,
        true,
      );
    }

    await notifyLeadSubmitted(updatedLead);

    return mapBookingLeadResponse(updatedLead);
  }

  async #getExistingOrThrow(leadId) {
    const lead = await this.repository.findById(leadId);

    if (!lead) {
      throw new AppError("Booking lead not found", 404);
    }

    return lead;
  }
}

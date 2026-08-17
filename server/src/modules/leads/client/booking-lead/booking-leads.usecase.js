import { isClientField, isLeadField } from "./booking-leads.validation.js";
import {
  notifyLeadCreated,
  notifyLeadSubmitted,
} from "./booking-leads.notification.js";
import { bookingLeadsEmails } from "./booking-leads.emails.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { bookingLeadsRepository } from "./booking-leads.repo.js";
import { sendEmail } from "../../../../infra/mail/send-mail.js";
import { BOOKING_LEAD_REQUEST_STATUSES, leadsMessagesCodes, messagesNames } from "@dms/shared";
import {
  issuePublicFunnelCapability,
  PUBLIC_FUNNEL_PURPOSES,
  verifyPublicFunnelCapability,
} from "../../../../infra/upload/public-funnel-capability.js";

const TK = messagesNames.leadsMessages;

// master 03ca4d3: after a successful booking submit, send the client a "thanks" email.
// Routed through src/infra/mail/send-mail.js so the client-facing from-name/address
// (isClient=true → engineer's identity) is preserved exactly; the frozen service swallows
// its own send errors, so a mail failure never breaks the submit.

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
    source: lead.source ?? null,
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

class BookingLeadsUsecase {
  async createBookingLead({ name, phone, source }) {
    const lead = await bookingLeadsRepository.createDraft({
      clientDraft: {
        name,
        phone,
        email: buildDraftEmail(),
      },
      source,
    });

    await notifyLeadCreated(lead);

    const capability = issuePublicFunnelCapability({
      purpose: PUBLIC_FUNNEL_PURPOSES.BOOKING_LEAD,
      leadId: lead.id,
    });

    return {
      ...mapBookingLeadResponse(lead),
      capabilityToken: capability.token,
      capabilityExpiresIn: capability.expiresIn,
    };
  }

  authorizeBookingLead(leadId, token) {
    return verifyPublicFunnelCapability(token, {
      purpose: PUBLIC_FUNNEL_PURPOSES.BOOKING_LEAD,
      leadId,
    });
  }

  async getBookingLead(leadId) {
    const lead = await this.#getExistingOrThrow(leadId);
    return mapBookingLeadResponse(lead);
  }

  async updateBookingLeadStep(leadId, { field, value }) {
    const existingLead = await this.#getExistingOrThrow(leadId);

    if (existingLead.bookingRequestStatus === BOOKING_LEAD_REQUEST_STATUSES.SUBMITTED) {
      throw new AppError({
        code: leadsMessagesCodes.BOOKING_LEAD_ALREADY_SUBMITTED,
        statusCode: 409,
        translationKey: TK,
      });
    }

    const leadData = isLeadField(field)
      ? {
          [field]: value,
          bookingRequestStatus: BOOKING_LEAD_REQUEST_STATUSES.IN_PROGRESS,
        }
      : {};

    const clientData = isClientField(field)
      ? {
          [field]: value,
        }
      : {};

    const updatedLead = await bookingLeadsRepository.updateStep({
      leadId,
      clientId: existingLead.client.id,
      leadData,
      clientData,
    });

    return mapBookingLeadResponse(updatedLead);
  }

  async submitBookingLead(leadId, payload) {
    const existingLead = await this.#getExistingOrThrow(leadId);

    if (existingLead.bookingRequestStatus === BOOKING_LEAD_REQUEST_STATUSES.SUBMITTED) {
      throw new AppError({
        code: leadsMessagesCodes.BOOKING_LEAD_ALREADY_SUBMITTED,
        statusCode: 409,
        translationKey: TK,
      });
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

    leadData.bookingRequestStatus = BOOKING_LEAD_REQUEST_STATUSES.SUBMITTED;
    leadData.bookingSubmittedAt = new Date();

    const updatedLead = await bookingLeadsRepository.submit({
      leadId,
      clientId: existingLead.client.id,
      leadData,
      clientData,
    });
    if (!updatedLead) {
      throw new AppError({
        code: leadsMessagesCodes.BOOKING_LEAD_ALREADY_SUBMITTED,
        statusCode: 409,
        translationKey: TK,
      });
    }

    // master 03ca4d3: thank the client by email after a successful booking submit.
    const clientEmail = updatedLead.client?.email;
    if (clientEmail) {
      const thanksEmail = bookingLeadsEmails.leadThanksEmail({
        email: clientEmail,
        clientName: updatedLead.client?.name,
      });
      await sendEmail(
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
    const lead = await bookingLeadsRepository.findById(leadId);

    if (!lead) {
      throw new AppError({
        code: leadsMessagesCodes.BOOKING_LEAD_NOT_FOUND,
        statusCode: 404,
        translationKey: TK,
      });
    }

    return lead;
  }
}

export const bookingLeadsUsecase = new BookingLeadsUsecase();
export { BookingLeadsUsecase };

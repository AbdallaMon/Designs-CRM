import { isClientField, isLeadField } from "./booking-leads.validation.js";
import {
  notifyLeadCreated,
  notifyLeadSubmitted,
} from "./booking-leads.notification.js";

const DRAFT_EMAIL_DOMAIN = "draft.local";

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

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
      throw createHttpError(409, "booking.alreadySubmitted");
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
      throw createHttpError(
        409,
        "This lead has already been submitted and cannot be submitted again",
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

    await notifyLeadSubmitted(updatedLead);

    return mapBookingLeadResponse(updatedLead);
  }

  async #getExistingOrThrow(leadId) {
    const lead = await this.repository.findById(leadId);

    if (!lead) {
      throw createHttpError(404, "Booking lead not found");
    }

    return lead;
  }
}

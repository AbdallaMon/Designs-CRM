import {
  createBookingLeadDraft,
  findBookingLeadById,
  submitBookingLead as submitBookingLeadRecord,
  updateBookingLeadStep as updateBookingLeadStepRecord,
} from "./booking-leads.repository.js";
import { isClientField, isLeadField } from "./booking-leads.validation.js";
import {
  sendToAdmins,
  NOTIFICATION_TYPES,
  CONTENT_TYPES,
} from "../../../shared/notifications/index.js";

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

async function getExistingBookingLeadOrThrow(leadId) {
  const lead = await findBookingLeadById(leadId);

  if (!lead) {
    throw createHttpError(404, "Booking lead not found");
  }

  return lead;
}

export async function createBookingLead({ location }) {
  const lead = await createBookingLeadDraft({
    location,
    clientDraft: {
      name: "",
      phone: "",
      email: buildDraftEmail(),
    },
  });

  try {
    await sendToAdmins({
      content: buildLeadCreatedContent(lead),
      type: NOTIFICATION_TYPES.LEAD_CREATED,
      options: {
        contentType: CONTENT_TYPES.HTML,
        emailSubject: `New Booking Lead Started — #${lead.id}`,
        clientLeadId: lead.id,
      },
    });
  } catch (error) {
    console.error("Failed to send lead created notification:", error);
  }

  return mapBookingLeadResponse(lead);
}

export async function getBookingLead(leadId) {
  const lead = await getExistingBookingLeadOrThrow(leadId);
  return mapBookingLeadResponse(lead);
}

export async function updateBookingLeadStep(leadId, { field, value }) {
  const existingLead = await getExistingBookingLeadOrThrow(leadId);

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

  const updatedLead = await updateBookingLeadStepRecord({
    leadId,
    clientId: existingLead.client.id,
    leadData,
    clientData,
  });

  return mapBookingLeadResponse(updatedLead);
}

export async function submitBookingLead(leadId, payload) {
  const existingLead = await getExistingBookingLeadOrThrow(leadId);

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

  const updatedLead = await submitBookingLeadRecord({
    leadId,
    clientId: existingLead.client.id,
    leadData,
    clientData,
  });

  try {
    await sendToAdmins({
      content: buildLeadSubmittedContent(updatedLead),
      type: NOTIFICATION_TYPES.LEAD_SUBMITTED,
      options: {
        contentType: CONTENT_TYPES.HTML,
        emailSubject: `Booking Lead Submitted — #${updatedLead.id}`,
        clientLeadId: updatedLead.id,
      },
    });
  } catch (error) {
    console.error("Failed to send lead submitted notification:", error);
  }

  return mapBookingLeadResponse(updatedLead);
}

function leadLink(id) {
  return `${process.env.DREAMSTSUIIO_ORIGIN}/dashboard/deals/${id}`;
}

function buildLeadCreatedContent(lead) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h3 style="color: #1a73e8; margin-bottom: 12px;">New Booking Lead Started</h3>
      <p style="margin: 6px 0;"><strong>Lead:</strong> <a href="${leadLink(lead.id)}" style="color: #1a73e8;">#${lead.id}</a></p>
      ${lead.location ? `<p style="margin: 6px 0;"><strong>Location:</strong> ${escapeHtml(lead.location)}</p>` : ""}
    </div>
  `;
}

function buildLeadUpdatedContent(lead, field, value) {
  const clientName = lead.client?.name || "";
  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h3 style="color: #1a73e8; margin-bottom: 12px;">Booking Lead Updated</h3>
      <p style="margin: 6px 0;"><strong>Lead:</strong> <a href="${leadLink(lead.id)}" style="color: #1a73e8;">#${lead.id}</a></p>
      ${clientName ? `<p style="margin: 6px 0;"><strong>Client:</strong> ${escapeHtml(clientName)}</p>` : ""}
      <p style="margin: 6px 0;">
        <strong>Updated Field:</strong> ${escapeHtml(String(field))}
        &rarr; <em>${escapeHtml(String(value ?? ""))}</em>
      </p>
    </div>
  `;
}

function buildLeadSubmittedContent(lead) {
  const clientName = lead.client?.name || "Unknown";
  const location = lead.location || "Not specified";
  const projectType = lead.projectType || "Not specified";

  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h3 style="color: #1a73e8; margin-bottom: 12px;">Booking Lead Submitted</h3>
      <div style="background-color: #f9f9f9; padding: 12px; border-left: 4px solid #1a73e8; margin-bottom: 12px;">
        <p style="margin: 6px 0;"><strong>Lead:</strong> <a href="${leadLink(lead.id)}" style="color: #1a73e8;">#${lead.id}</a></p>
        <p style="margin: 6px 0;"><strong>Client:</strong> ${escapeHtml(clientName)}</p>
        <p style="margin: 6px 0;"><strong>Location:</strong> ${escapeHtml(location)}</p>
        <p style="margin: 6px 0;"><strong>Project Type:</strong> ${escapeHtml(projectType)}</p>
        ${lead.client?.phone ? `<p style="margin: 6px 0;"><strong>Phone:</strong> ${escapeHtml(lead.client.phone)}</p>` : ""}
        ${lead.client?.email ? `<p style="margin: 6px 0;"><strong>Email:</strong> ${escapeHtml(lead.client.email)}</p>` : ""}
      </div>
    </div>
  `;
}

/**
 * Escape HTML special characters to prevent injection
 * @private
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

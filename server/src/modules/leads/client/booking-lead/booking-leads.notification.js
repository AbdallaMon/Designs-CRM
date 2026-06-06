import {
  sendToAdmins,
  NOTIFICATION_TYPES,
  CONTENT_TYPES,
} from "../../../../shared/notifications/index.js";

function leadLink(id) {
  return `${process.env.DREAMSTSUIIO_ORIGIN}/dashboard/deals/${id}`;
}

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

function buildLeadCreatedContent(lead) {
  const clientName = lead.client?.name || "";
  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h3 style="color: #1a73e8; margin-bottom: 12px;">New Booking Lead Started</h3>
      <p style="margin: 6px 0;"><strong>Lead:</strong> <a href="${leadLink(lead.id)}" style="color: #1a73e8;">#${lead.id}</a></p>
      ${clientName ? `<p style="margin: 6px 0;"><strong>Client:</strong> ${escapeHtml(clientName)}</p>` : ""}
      ${lead.client?.phone ? `<p style="margin: 6px 0;"><strong>Phone:</strong> ${escapeHtml(lead.client.phone)}</p>` : ""}
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

export async function notifyLeadCreated(lead) {
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
}

export async function notifyLeadSubmitted(lead) {
  try {
    await sendToAdmins({
      content: buildLeadSubmittedContent(lead),
      type: NOTIFICATION_TYPES.LEAD_SUBMITTED,
      options: {
        contentType: CONTENT_TYPES.HTML,
        emailSubject: `Booking Lead Submitted — #${lead.id}`,
        clientLeadId: lead.id,
      },
    });
  } catch (error) {
    console.error("Failed to send lead submitted notification:", error);
  }
}

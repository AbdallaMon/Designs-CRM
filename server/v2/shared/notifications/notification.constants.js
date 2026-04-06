/**
 * Notification Types and Constants
 *
 * This file defines all notification types used in the system
 * Each type corresponds to a NotificationType in the database (Prisma schema)
 */

export const NOTIFICATION_TYPES = {
  LEAD_CREATED: "LEAD_CREATED",
  LEAD_SUBMITTED: "LEAD_SUBMITTED",
  LEAD_STATUS_CHANGED: "LEAD_STATUS_CHANGED",
  LEAD_ASSIGNED: "LEAD_ASSIGNED",
  LEAD_TRANSFERRED: "LEAD_TRANSFERRED",
};

export const CONTENT_TYPES = {
  TEXT: "TEXT",
  HTML: "HTML",
};

export const USER_ROLES = {
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  STAFF: "STAFF",
  CLIENT: "CLIENT",
  THREE_D_DESIGNER: "THREE_D_DESIGNER",
  TWO_D_DESIGNER: "TWO_D_DESIGNER",
};

/**
 * EMAIL TEMPLATES
 * Define email subjects and templates for different notification types
 */
export const EMAIL_TEMPLATES = {
  LEAD_CREATED: {
    subject: "New Lead Created",
    template: (leadData) => `
      <div style="color: #333; direction: ltr; text-align: left;">
        <h2 style="color: #444; margin-bottom: 16px;">New Lead Created</h2>
        <p>A new lead has been created in the system.</p>
        <p><strong>Lead ID:</strong> #${leadData.leadId || "N/A"}</p>
        ${leadData.clientName ? `<p><strong>Client Name:</strong> ${leadData.clientName}</p>` : ""}
        ${leadData.location ? `<p><strong>Location:</strong> ${leadData.location}</p>` : ""}
        ${leadData.projectType ? `<p><strong>Project Type:</strong> ${leadData.projectType}</p>` : ""}
      </div>
    `,
  },
  LEAD_SUBMITTED: {
    subject: "Lead Submitted for Review",
    template: (leadData) => `
      <div style="color: #333; direction: ltr; text-align: left;">
        <h2 style="color: #444; margin-bottom: 16px;">Lead Submitted</h2>
        <p>A new lead has been submitted and is ready for review.</p>
        <p><strong>Lead ID:</strong> #${leadData.leadId || "N/A"}</p>
        ${leadData.clientName ? `<p><strong>Client Name:</strong> ${leadData.clientName}</p>` : ""}
      </div>
    `,
  },
};

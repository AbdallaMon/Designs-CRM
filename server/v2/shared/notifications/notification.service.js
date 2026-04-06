/**
 * Notification Service - Core notification handling
 *
 * This service handles sending notifications to users based on different criteria:
 * - Send to specific user
 * - Send to all admins and super admins
 * - Send to users with specific roles
 * - Send to all active staff
 *
 * Features:
 * - Database persistence (Prisma)
 * - Real-time delivery via Socket.IO
 * - Optional email notification
 * - Clean separation of concerns
 *
 * @module notification.service
 */

import prisma from "../../infra/prisma.js";
import { getIo } from "../../infra/socket.js";
import { sendEmail } from "../../infra/mailer.js";
import { CONTENT_TYPES, EMAIL_TEMPLATES } from "./notification.constants.js";

/**
 * Internal function: Send a notification to a single user.
 * Persists to DB, emits via Socket.IO, and optionally sends an email.
 *
 * @private
 * @param {Object} params
 * @param {number} params.userId
 * @param {string} params.userEmail
 * @param {boolean} params.allowEmailing
 * @param {string} params.content
 * @param {string} params.type
 * @param {string} [params.link]
 * @param {string} [params.contentType]
 * @param {string} [params.emailSubject]
 * @param {number} [params.clientLeadId]
 * @param {number} [params.staffId]
 * @returns {Promise<Object>} Created notification object
 */
async function sendNotificationToUser({
  userId,
  userEmail,
  allowEmailing,
  content,
  type,
  link,
  contentType = CONTENT_TYPES.TEXT,
  emailSubject,
  clientLeadId,
  staffId,
}) {
  // 1. Persist to database
  const notification = await prisma.notification.create({
    data: {
      userId,
      content,
      type,
      link,
      contentType,
      clientLeadId: clientLeadId ? Number(clientLeadId) : null,
      staffId: staffId ? Number(staffId) : null,
    },
  });

  // 2. Emit real-time via Socket.IO
  try {
    const io = getIo();
    io.to(`user:${userId}`).emit("notification", notification);
  } catch {
    // Socket.IO may not be available in all contexts — DB notification still saved
  }

  // 3. Send email if user allows it
  if (allowEmailing && userEmail && emailSubject) {
    try {
      await sendEmail(userEmail, emailSubject, content);
    } catch (error) {
      console.error(`Failed to email user ${userId} (${userEmail}):`, error);
    }
  }

  return notification;
}

/**
 * Send notification to a specific user (DB + Socket.IO + email)
 *
 * @param {Object} params
 * @param {number} params.userId
 * @param {string} params.content
 * @param {string} params.type
 * @param {Object} [params.options]
 * @param {string} [params.options.link]
 * @param {string} [params.options.contentType] - "TEXT" or "HTML"
 * @param {string} [params.options.emailSubject] - Required to trigger email
 * @param {number} [params.options.clientLeadId]
 * @param {number} [params.options.staffId]
 *
 * @example
 * await sendToUser({
 *   userId: 123,
 *   content: "Your lead has been updated",
 *   type: NOTIFICATION_TYPES.LEAD_STATUS_CHANGED,
 *   options: { link: "/leads/456", emailSubject: "Lead Updated" }
 * });
 */
export async function sendToUser({ userId, content, type, options = {} }) {
  if (!userId) throw new Error("userId is required");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, allowEmailing: true },
  });

  return sendNotificationToUser({
    userId,
    userEmail: user?.email,
    allowEmailing: user?.allowEmailing ?? false,
    content,
    type,
    link: options.link,
    contentType: options.contentType || CONTENT_TYPES.TEXT,
    emailSubject: options.emailSubject,
    clientLeadId: options.clientLeadId,
    staffId: options.staffId,
  });
}

/**
 * Send notification to all ADMIN and SUPER_ADMIN users (DB + Socket.IO + email)
 *
 * @param {Object} params
 * @param {string} params.content
 * @param {string} params.type
 * @param {Object} [params.options]
 * @param {string} [params.options.link]
 * @param {string} [params.options.contentType]
 * @param {string} [params.options.emailSubject] - Required to trigger email
 * @param {number} [params.options.clientLeadId]
 * @param {number} [params.options.staffId]
 *
 * @example
 * await sendToAdmins({
 *   content: "<div>New booking lead submitted!</div>",
 *   type: NOTIFICATION_TYPES.LEAD_SUBMITTED,
 *   options: { contentType: CONTENT_TYPES.HTML, emailSubject: "New Booking Lead" }
 * });
 */
export async function sendToAdmins({ content, type, options = {} }) {
  const adminUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["ADMIN", "SUPER_ADMIN"] },
    },
    select: { id: true, email: true, allowEmailing: true },
  });

  if (adminUsers.length === 0) {
    console.log("No admin users found to notify");
    return [];
  }

  return Promise.all(
    adminUsers.map((admin) =>
      sendNotificationToUser({
        userId: admin.id,
        userEmail: admin.email,
        allowEmailing: admin.allowEmailing,
        content,
        type,
        link: options.link,
        contentType: options.contentType || CONTENT_TYPES.TEXT,
        emailSubject: options.emailSubject,
        clientLeadId: options.clientLeadId,
        staffId: options.staffId,
      }),
    ),
  );
}

/**
 * Send notification to users with specific roles (DB + Socket.IO + email)
 *
 * @param {Object} params
 * @param {Array<string>} params.roles - e.g. ["STAFF", "THREE_D_DESIGNER"]
 * @param {string} params.content
 * @param {string} params.type
 * @param {Object} [params.options]
 * @param {string} [params.options.link]
 * @param {string} [params.options.contentType]
 * @param {string} [params.options.emailSubject] - Required to trigger email
 * @param {number} [params.options.clientLeadId]
 * @param {number} [params.options.staffId]
 *
 * @example
 * await sendToRoles({
 *   roles: ["STAFF"],
 *   content: "New lead available",
 *   type: NOTIFICATION_TYPES.LEAD_CREATED,
 *   options: { emailSubject: "New Lead Alert" }
 * });
 */
export async function sendToRoles({ roles, content, type, options = {} }) {
  if (!Array.isArray(roles) || roles.length === 0) {
    throw new Error("roles must be a non-empty array");
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { role: { in: roles } },
        { subRoles: { some: { subRole: { in: roles } } } },
      ],
    },
    select: { id: true, email: true, allowEmailing: true },
  });

  if (users.length === 0) {
    console.log(`No users found with roles: ${roles.join(", ")}`);
    return [];
  }

  return Promise.all(
    users.map((user) =>
      sendNotificationToUser({
        userId: user.id,
        userEmail: user.email,
        allowEmailing: user.allowEmailing,
        content,
        type,
        link: options.link,
        contentType: options.contentType || CONTENT_TYPES.TEXT,
        emailSubject: options.emailSubject,
        clientLeadId: options.clientLeadId,
        staffId: options.staffId,
      }),
    ),
  );
}

/**
 * Send notification to all active STAFF + ADMIN + SUPER_ADMIN (DB + Socket.IO + email)
 *
 * @param {Object} params
 * @param {string} params.content
 * @param {string} params.type
 * @param {Object} [params.options]
 * @param {string} [params.options.link]
 * @param {string} [params.options.contentType]
 * @param {string} [params.options.emailSubject] - Required to trigger email
 * @param {number} [params.options.clientLeadId]
 * @param {number} [params.options.staffId]
 */
export async function sendToAll({ content, type, options = {} }) {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] },
    },
    select: { id: true, email: true, allowEmailing: true },
  });

  if (users.length === 0) {
    console.log("No active staff/admin users found to notify");
    return [];
  }

  return Promise.all(
    users.map((user) =>
      sendNotificationToUser({
        userId: user.id,
        userEmail: user.email,
        allowEmailing: user.allowEmailing,
        content,
        type,
        link: options.link,
        contentType: options.contentType || CONTENT_TYPES.TEXT,
        emailSubject: options.emailSubject,
        clientLeadId: options.clientLeadId,
        staffId: options.staffId,
      }),
    ),
  );
}

/**
 * Builder pattern for complex notification scenarios
 * Allows combining multiple recipient types in one notification batch
 *
 * @returns {Object} Notification builder object
 *
 * @example
 * const builder = notificationService.builder();
 * await builder
 *   .withContent("New booking lead submitted")
 *   .withType(NOTIFICATION_TYPES.LEAD_SUBMITTED)
 *   .toAdmins()
 *   .toRoles(["STAFF"])
 *   .toUser(123)
 *   .send();
 */
export function builder() {
  let content = "";
  let type = "";
  let options = {};
  let recipients = []; // Array of { type: "admin"|"roles"|"user"|"all", data: ... }

  return {
    /**
     * Set notification content
     */
    withContent(text) {
      content = text;
      return this;
    },

    /**
     * Set notification type
     */
    withType(notificationType) {
      type = notificationType;
      return this;
    },

    /**
     * Set additional options (link, contentType, etc.)
     */
    withOptions(opts) {
      options = { ...options, ...opts };
      return this;
    },

    /**
     * Add all admins as recipients
     */
    toAdmins() {
      recipients.push({ type: "admin" });
      return this;
    },

    /**
     * Add specific roles as recipients
     */
    toRoles(roles) {
      recipients.push({ type: "roles", data: roles });
      return this;
    },

    /**
     * Add specific user as recipient
     */
    toUser(userId) {
      recipients.push({ type: "user", data: userId });
      return this;
    },

    /**
     * Add all staff/admin as recipients
     */
    toAll() {
      recipients.push({ type: "all" });
      return this;
    },

    /**
     * Send all queued notifications
     */
    async send() {
      if (!content || !type) {
        throw new Error("Content and type are required");
      }

      if (recipients.length === 0) {
        throw new Error("At least one recipient type must be specified");
      }

      const results = [];

      for (const recipient of recipients) {
        if (recipient.type === "admin") {
          const result = await sendToAdmins({ content, type, options });
          results.push(...result);
        } else if (recipient.type === "roles") {
          const result = await sendToRoles({
            roles: recipient.data,
            content,
            type,
            options,
          });
          results.push(...result);
        } else if (recipient.type === "user") {
          const result = await sendToUser({
            userId: recipient.data,
            content,
            type,
            options,
          });
          results.push(result);
        } else if (recipient.type === "all") {
          const result = await sendToAll({ content, type, options });
          results.push(...result);
        }
      }

      return results;
    },
  };
}

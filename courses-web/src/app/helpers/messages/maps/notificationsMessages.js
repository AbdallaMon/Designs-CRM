// Single-language (Arabic) resolution for backend message CODES emitted by the notifications
// domain API ({ success, message: CODE, translationKey: "notificationsMessages" }). The
// backend stays language-neutral (packages/shared/messages-codes/notifications/notifications.js);
// this is the FE lookup. Every code the notifications surface can emit has an entry here;
// unknown codes fall back to a generic string. Mirrors features/calendar/config/calendarMessages.js.

export const notificationsMessages = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  NOTIFICATIONS_FETCHED: "Notifications fetched",
  UNREAD_NOTIFICATIONS_FETCHED: "Unread notifications fetched",

  // ── action ───────────────────────────────────────────────────────────────────────
  NOTIFICATIONS_MARKED_READ: "Notifications marked as read",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "Operation completed successfully",
  FORBIDDEN: "You do not have permission to perform this action",
  ACCESS_DENIED: "You do not have access",
  VALIDATION_ERROR: "Invalid data",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveNotificationsMessage(code, { fallback } = {}) {
  if (code && notificationsMessages[code]) return notificationsMessages[code];
  return fallback ?? "Operation completed";
}

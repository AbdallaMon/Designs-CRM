// Single-language (Arabic) resolution for backend message CODES emitted by the notifications
// domain API ({ success, message: CODE, translationKey: "notificationsMessages" }). The
// backend stays language-neutral (packages/shared/messages-codes/notifications/notifications.js);
// this is the FE lookup. Every code the notifications surface can emit has an entry here;
// unknown codes fall back to a generic string. Mirrors features/calendar/config/calendarMessages.js.

export const notificationsMessages = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  NOTIFICATIONS_FETCHED: "تم جلب الإشعارات",
  UNREAD_NOTIFICATIONS_FETCHED: "تم جلب الإشعارات غير المقروءة",

  // ── action ───────────────────────────────────────────────────────────────────────
  NOTIFICATIONS_MARKED_READ: "تم تعليم الإشعارات كمقروءة",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "تمت العملية بنجاح",
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  ACCESS_DENIED: "لا تملك صلاحية الوصول",
  VALIDATION_ERROR: "بيانات غير صحيحة",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveNotificationsMessage(code, { fallback } = {}) {
  if (code && notificationsMessages[code]) return notificationsMessages[code];
  return fallback ?? "تمت العملية";
}

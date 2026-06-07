// Single-language (Arabic) resolution for backend message CODES emitted by the calendar
// domain API ({ success, message: CODE, translationKey: "calendarMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/calendar/calendar.js); this is the
// FE lookup. Every code the calendar surface can emit has an entry here; unknown codes fall
// back to a generic string. Mirrors features/accounting/config/accountingMessages.js.

export const calendarMessages = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  AVAILABLE_DAYS_FETCHED: "تم جلب الأيام المتاحة",
  SLOTS_FETCHED: "تم جلب المواعيد",
  SLOT_DETAILS_FETCHED: "تم جلب تفاصيل الموعد",
  CALENDAR_MONTH_FETCHED: "تم جلب التقويم",
  REMINDERS_FETCHED: "تم جلب المواعيد والمكالمات",
  MEETING_DATA_FETCHED: "تم جلب بيانات الحجز",
  TIMEZONES_FETCHED: "تم جلب المناطق الزمنية",

  // ── availability mutations ───────────────────────────────────────────────────────
  AVAILABLE_DAY_SAVED: "تم حفظ اليوم المتاح",
  AVAILABLE_DAYS_SAVED: "تم حفظ الأيام المتاحة",
  AVAILABLE_DAY_DELETED: "تم حذف اليوم",
  SLOT_DELETED: "تم حذف الموعد",

  // ── client booking ───────────────────────────────────────────────────────────────
  MEETING_BOOKED: "تم تأكيد الحجز بنجاح",

  // ── google integration ───────────────────────────────────────────────────────────
  GOOGLE_AUTH_URL_GENERATED: "تم إنشاء رابط الربط",
  GOOGLE_STATUS_FETCHED: "تم جلب حالة الربط",
  GOOGLE_DISCONNECTED: "تم إلغاء ربط حساب جوجل",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  GOOGLE_ALREADY_CONNECTED: "حساب جوجل مرتبط بالفعل",
  GOOGLE_CALLBACK_INVALID: "رابط الربط غير صالح",
  CALENDAR_ACCESS_DENIED: "لا تملك صلاحية الوصول إلى التقويم",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "تمت العملية بنجاح",
  CREATED: "تم الإنشاء بنجاح",
  UPDATED: "تم التحديث بنجاح",
  DELETED: "تم الحذف بنجاح",
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  ACCESS_DENIED: "لا تملك صلاحية الوصول",
  VALIDATION_ERROR: "بيانات غير صحيحة",
};

/**
 * Resolve a backend message CODE to an Arabic display string.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveCalendarMessage(code, { fallback } = {}) {
  if (code && calendarMessages[code]) return calendarMessages[code];
  return fallback ?? "تمت العملية";
}

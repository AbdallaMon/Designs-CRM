// Single-language (Arabic) resolution for backend message CODES emitted by the leads
// API ({ success, message: CODE, translationKey: "leadsMessages" }). The backend stays
// language-neutral (packages/shared/messages-codes/leads/leads.js); this is the FE
// lookup. Every code the leads module can emit has an entry here; unknown codes fall
// back to a generic string rather than leaking the raw code to end users.

export const leadsMessages = {
  // ── reads / generic ──────────────────────────────────────────────────────────
  LEADS_FETCHED: "تم جلب العملاء المحتملين",
  LEAD_FETCHED: "تم جلب بيانات العميل",
  DEALS_FETCHED: "تم جلب الصفقات",
  COLUMNS_FETCHED: "تم جلب الأعمدة",
  CALLS_FETCHED: "تم جلب المكالمات",
  MEETINGS_FETCHED: "تم جلب الاجتماعات",
  MEETING_REMINDERS_FETCHED: "تم جلب تذكيرات الاجتماعات",
  MEETING_REMINDER_FETCHED: "تم جلب تذكير الاجتماع",
  COUNTRY_CHECK_DONE: "تم التحقق من الدولة",

  // ── success / mutations ────────────────────────────────────────────────────────
  LEAD_UPDATED: "تم تحديث العميل",
  LEAD_ASSIGNED: "تم إسناد العميل إليك",
  LEAD_CONVERTED: "تم تحويل العميل",
  LEADS_BULK_CONVERTED: "تم تحويل العملاء المحددين",
  LEAD_MOVED_TO_CONVERTED: "تم نقل العميل إلى المحوّلين",
  LEAD_STATUS_CHANGED: "تم تغيير حالة العميل",
  LEAD_PRICE_UPDATED: "تم تحديث السعر",
  CALL_REMINDER_CREATED: "تم إنشاء تذكير المكالمة",
  CALL_REMINDER_UPDATED: "تم تحديث نتيجة المكالمة",
  MEETING_REMINDER_CREATED: "تم إنشاء تذكير الاجتماع",
  MEETING_REMINDER_UPDATED: "تم تحديث نتيجة الاجتماع",
  PRICE_OFFER_CREATED: "تم إنشاء عرض السعر",
  PRICE_OFFER_STATUS_CHANGED: "تم تحديث حالة عرض السعر",
  PAYMENTS_ADDED: "تمت إضافة الدفعات",
  FILE_SAVED: "تم حفظ الملف",
  NOTE_ADDED: "تمت إضافة الملاحظة",
  REMINDER_SENT: "تم إرسال التذكير",

  // ── errors / scope / guards ────────────────────────────────────────────────────
  LEAD_NOT_FOUND: "العميل غير موجود",
  LEAD_ACCESS_DENIED: "لا تملك صلاحية الوصول إلى هذا العميل",
  LEAD_MUTATE_DENIED: "لا تملك صلاحية تعديل هذا العميل",
  CALL_REMINDER_NOT_FOUND: "تذكير المكالمة غير موجود",
  MEETING_REMINDER_NOT_FOUND: "تذكير الاجتماع غير موجود",
  PRICE_OFFER_NOT_FOUND: "عرض السعر غير موجود",
  LEAD_STATUS_TRANSITION_FORBIDDEN: "لا يمكن تغيير الحالة من الحالة الحالية",
  LEAD_ALREADY_ASSIGNED: "تم إسناد هذا العميل بالفعل",
  LEAD_COUNTRY_NOT_ALLOWED: "هذه الدولة غير مسموح بها لك",
  LEAD_MAX_ACTIVE_REACHED: "وصلت إلى الحد الأقصى من العملاء النشطين",
  LEAD_MAX_PER_DAY_REACHED: "وصلت إلى الحد الأقصى اليومي من العملاء",
  MEETING_NOT_ALLOWED_FOR_ROLE: "لا يمكن لهذا الدور إنشاء/تعديل الاجتماعات",
  REMINDER_TIME_IN_PAST: "وقت التذكير في الماضي",
  NO_AVAILABLE_SLOT: "لا يوجد موعد متاح",
  PRICE_OFFER_RANGE_INVALID: "نطاق السعر غير صحيح",
  NOTE_CONTENT_EMPTY: "محتوى الملاحظة فارغ",
  FILE_FIELDS_REQUIRED: "حقول الملف مطلوبة",
  BULK_CONVERT_FORBIDDEN: "لا تملك صلاحية التحويل الجماعي",
  LEAD_CONVERT_REQUIRES_OWNER: "لا يمكن التحويل إلى صفقة قبل إسناد العميل لموظف",

  // ── generic envelope codes (shared) ────────────────────────────────────────────
  OK: "تمت العملية بنجاح",
  CREATED: "تم الإنشاء بنجاح",
  UPDATED: "تم التحديث بنجاح",
  DELETED: "تم الحذف بنجاح",
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  ACCESS_DENIED: "لا تملك صلاحية الوصول",
  VALIDATION_ERROR: "بيانات غير صحيحة",
};

import { resolveMessageCode } from "@/app/v2/data/resolveMessageCode.js";

/**
 * Resolve a backend message CODE to an Arabic display string. Feature-specific Arabic wins
 * first; anything unknown delegates to the CENTRAL resolver (so cross-cutting core/auth/
 * validation/prisma codes — or another module's code — still render as Arabic instead of
 * leaking the raw code). `translationKey` (from the envelope) routes the central lookup.
 * @param {string} code
 * @param {{ fallback?: string, translationKey?: string }} [opts]
 */
export function resolveLeadMessage(code, { fallback, translationKey } = {}) {
  if (code && leadsMessages[code]) return leadsMessages[code];
  return resolveMessageCode(code, { translationKey, fallback });
}

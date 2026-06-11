// Single-language (Arabic) resolution for backend message CODES emitted by the utilities
// domain API ({ success, message: CODE, translationKey: "utilitiesMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/utilities/utilities.js); this is the
// FE lookup. Every code the utilities surface can emit has an entry here; unknown codes fall
// back to a generic string. Mirrors features/calendar/config/calendarMessages.js.

export const utilitiesMessages = {
  // ── reads ──────────────────────────────────────────────────────────────────────
  FIXED_DATA_FETCHED: "تم جلب البيانات الثابتة",
  USER_LOG_FETCHED: "تم جلب سجل العمل",
  USER_ROLE_FETCHED: "تم جلب صلاحية المستخدم",
  ROLES_FETCHED: "تم جلب الأدوار",
  ADMINS_FETCHED: "تم جلب المسؤولين",
  IMAGES_FETCHED: "تم جلب الصور",
  MODEL_FETCHED: "تم جلب البيانات",
  MODEL_IDS_FETCHED: "تم جلب القائمة",
  SEARCH_RESULTS_FETCHED: "تم جلب نتائج البحث",

  // ── writes ─────────────────────────────────────────────────────────────────────
  USER_LOG_SUBMITTED: "تم تسجيل سجل العمل",

  // ── errors / domain rules ─────────────────────────────────────────────────────────
  MODEL_NOT_ALLOWED: "النموذج المطلوب غير مسموح به",
  SEARCH_FAILED: "تعذّر تنفيذ البحث، حاول مرة أخرى",
  USER_LOG_CHECK_FAILED: "تعذّر التحقق من سجل اليوم، حاول مرة أخرى",

  // ── generic envelope codes (shared) ──────────────────────────────────────────────
  OK: "تمت العملية بنجاح",
  CREATED: "تم الإنشاء بنجاح",
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  ACCESS_DENIED: "لا تملك صلاحية الوصول",
  VALIDATION_ERROR: "بيانات غير صحيحة",
};

import { resolveMessageCode } from "@/app/v2/data/resolveMessageCode.js";

/**
 * Resolve a backend message CODE to an Arabic display string. Feature Arabic wins first;
 * unknown codes delegate to the CENTRAL resolver. `translationKey` routes the central lookup.
 * @param {string} code
 * @param {{ fallback?: string, translationKey?: string }} [opts]
 */
export function resolveUtilitiesMessage(code, { fallback, translationKey } = {}) {
  if (code && utilitiesMessages[code]) return utilitiesMessages[code];
  return resolveMessageCode(code, { translationKey, fallback });
}

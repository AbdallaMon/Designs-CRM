// Single-language (Arabic) resolution for backend message CODES emitted by the contracts
// domain API ({ success, message: CODE, translationKey: "contractsMessages" }). The backend
// stays language-neutral (packages/shared/messages-codes/contracts/contracts.js); this is the
// FE lookup. Every code the contracts surface (authed + public e-sign) can emit has an entry
// here; unknown codes fall back to a generic string. Mirrors features/calendar/config/
// calendarMessages.js. The BE REPLACED the legacy Arabic prose ("تم حفظ الاستجابة بنجاح" etc.)
// with these codes — resolved back to Arabic here.

export const contractsMessages = {
  // ── authed reads ────────────────────────────────────────────────────────────────
  CONTRACTS_FETCHED: "تم جلب العقود",
  CONTRACT_FETCHED: "تم جلب العقد",
  CONTRACT_PAYMENTS_FETCHED: "تم جلب الدفعات",

  // ── authed writes (contract lifecycle) ─────────────────────────────────────────────
  CONTRACT_CREATED: "تم إنشاء العقد",
  CONTRACT_UPDATED: "تم تحديث العقد",
  CONTRACT_CANCELLED: "تم إلغاء العقد",
  CONTRACT_PDF_TOKEN_GENERATED: "تم إنشاء رابط التوقيع",

  // ── authed writes (stages) ─────────────────────────────────────────────────────────
  CONTRACT_STAGE_CREATED: "تمت إضافة المرحلة",
  CONTRACT_STAGE_UPDATED: "تم تحديث المرحلة",
  CONTRACT_STAGE_DELETED: "تم حذف المرحلة",

  // ── authed writes (payments) ───────────────────────────────────────────────────────
  CONTRACT_PAYMENT_CREATED: "تمت إضافة الدفعة",
  CONTRACT_PAYMENT_UPDATED: "تم تحديث الدفعة",
  CONTRACT_PAYMENT_DELETED: "تم حذف الدفعة",
  CONTRACT_PAYMENT_STATUS_UPDATED: "تم تحديث حالة الدفعة",
  CONTRACT_PAYMENT_AMOUNTS_UPDATED: "تم تحديث مبالغ الدفعة",

  // ── authed writes (drawings) ───────────────────────────────────────────────────────
  CONTRACT_DRAWING_CREATED: "تمت إضافة المخطط",
  CONTRACT_DRAWING_UPDATED: "تم تحديث المخطط",
  CONTRACT_DRAWING_DELETED: "تم حذف المخطط",

  // ── authed writes (special items) ──────────────────────────────────────────────────
  CONTRACT_SPECIAL_ITEM_CREATED: "تمت إضافة البند الخاص",
  CONTRACT_SPECIAL_ITEM_UPDATED: "تم تحديث البند الخاص",
  CONTRACT_SPECIAL_ITEM_DELETED: "تم حذف البند الخاص",

  // ── public client e-sign surface ───────────────────────────────────────────────────
  CONTRACT_SESSION_FETCHED: "تم جلب بيانات العقد",
  CONTRACT_SESSION_STATUS_UPDATED: "تم حفظ الاستجابة بنجاح",
  CONTRACT_PDF_GENERATED: "تم توقيع العقد بنجاح",

  // ── errors / domain rules ──────────────────────────────────────────────────────────
  CONTRACT_NOT_FOUND: "العقد غير موجود",
  CONTRACT_SESSION_INVALID: "رابط التوقيع غير صالح",
  CONTRACT_PDF_GENERATION_FAILED: "فشل إنشاء ملف العقد",

  // ── generic envelope codes (shared) ────────────────────────────────────────────────
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
 * Resolve a backend message CODE to an Arabic display string. Feature Arabic wins first;
 * unknown codes delegate to the CENTRAL resolver. `translationKey` routes the central lookup.
 * @param {string} code
 * @param {{ fallback?: string, translationKey?: string }} [opts]
 */
export function resolveContractMessage(code, { fallback, translationKey } = {}) {
  if (code && contractsMessages[code]) return contractsMessages[code];
  return resolveMessageCode(code, { translationKey, fallback });
}

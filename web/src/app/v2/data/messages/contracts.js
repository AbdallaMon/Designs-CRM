// Central Arabic map for the CONTRACTS message CODES
// (packages/shared/messages-codes/contracts/contracts.js → contractsMessagesCodes).
// translationKey namespace: "contractsMessages". Harvested from
// features/contracts/config/contractsMessages.js. CODE → عربي.

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
};

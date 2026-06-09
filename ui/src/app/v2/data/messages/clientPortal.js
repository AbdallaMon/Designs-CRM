// Central Arabic map for the CLIENT-PORTAL message CODES
// (packages/shared/messages-codes/client-portal/client-portal.js → clientPortalMessagesCodes).
// translationKey namespace: "clientPortalMessages". There is NO feature resolver for this
// public/token surface, so this central map is the ONLY Arabic source for these codes — it
// previously fell through and leaked the raw code. CODE → عربي.

export const clientPortalMessages = {
  // ── payments (client Stripe checkout) ──────────────────────────────────────────
  PAYMENT_CHECKOUT_CREATED: "تم إنشاء جلسة الدفع",
  PAYMENT_VERIFIED: "تم تأكيد الدفع بنجاح",
  PAYMENT_NOT_COMPLETED: "لم يكتمل الدفع بعد",
  PAYMENT_BACKFILL_DONE: "تم تحديث بيانات الدفع",
  PAYMENT_CHECKOUT_FAILED: "تعذّر إنشاء جلسة الدفع، حاول مرة أخرى",
  PAYMENT_VERIFY_FAILED: "تعذّر التحقق من الدفع، حاول مرة أخرى",
  PAYMENT_LEAD_NOT_FOUND: "بيانات الدفع غير موجودة",
  PAYMENT_NOT_ALLOWED: "لا يمكن تنفيذ هذا الدفع",

  // ── uploads (client file upload) ───────────────────────────────────────────────
  UPLOAD_FAILED: "تعذّر رفع الملف، حاول مرة أخرى",

  // ── notes (client note on a lead) ──────────────────────────────────────────────
  NOTES_FETCHED: "تم جلب الملاحظات",
  NOTE_CREATED: "تمت إضافة الملاحظة بنجاح",
  NOTE_TARGET_INVALID: "وجهة الملاحظة غير صالحة",
  NOTE_CONTENT_TOO_LONG: "محتوى الملاحظة طويل جداً",

  // ── languages (public lookup) ──────────────────────────────────────────────────
  LANGUAGES_FETCHED: "تم جلب اللغات",
};

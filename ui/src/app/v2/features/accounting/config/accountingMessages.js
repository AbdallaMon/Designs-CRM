// Single-language (Arabic) resolution for backend message CODES emitted by the accounting
// domain API ({ success, message: CODE, translationKey: "accountingMessages" }). The
// backend stays language-neutral (packages/shared/messages-codes/accounting/accounting.js);
// this is the FE lookup. Every code the accounting surface can emit has an entry here;
// unknown codes fall back to a generic string. Mirrors features/projects/config/projectsMessages.js.

export const accountingMessages = {
  // ── reads / generic ────────────────────────────────────────────────────────────
  PAYMENTS_FETCHED: "تم جلب الدفعات",
  PAYMENT_INVOICES_FETCHED: "تم جلب الفواتير",
  NOTES_FETCHED: "تم جلب الملاحظات",
  OPERATIONAL_EXPENSES_FETCHED: "تم جلب المصروفات التشغيلية",
  RENTS_FETCHED: "تم جلب الإيجارات",
  OUTCOMES_FETCHED: "تم جلب المصروفات",
  SUMMARY_FETCHED: "تم جلب الملخص المالي",
  USERS_FETCHED: "تم جلب المستخدمين",
  USER_LAST_SEEN_FETCHED: "تم جلب سجل النشاط",
  SALARY_DATA_FETCHED: "تم جلب بيانات الراتب",

  // ── success / mutations ──────────────────────────────────────────────────────────
  PAYMENT_PROCESSED: "تم تسجيل الدفعة",
  PAYMENT_MARKED_OVERDUE: "تم تعليم الدفعة كمتأخرة",
  PAYMENT_LEVEL_CHANGED: "تم تغيير مستوى الدفعة",
  NOTE_CREATED: "تمت إضافة الملاحظة",
  OPERATIONAL_EXPENSE_CREATED: "تمت إضافة المصروف التشغيلي",
  RENT_CREATED: "تمت إضافة الإيجار",
  RENT_RENEWED: "تم تجديد الإيجار",
  SALARY_CREATED: "تم إنشاء الراتب الأساسي",
  SALARY_UPDATED: "تم تحديث الراتب الأساسي",
  MONTHLY_SALARY_PAID: "تم دفع الراتب الشهري",

  // ── errors / scope / domain rules (preserved from legacy services) ───────────────
  PAYMENT_NOT_FOUND: "الدفعة غير موجودة",
  PAYMENT_ALREADY_FULLY_PAID: "تم دفع هذه الدفعة بالكامل بالفعل",
  PAYMENT_AMOUNT_EXCEEDS_PENDING: "المبلغ المدخل يتجاوز المبلغ المتبقي",
  PAYMENT_AMOUNT_INVALID: "المبلغ غير صحيح",
  PAYMENT_DATE_REQUIRED: "تاريخ الدفع مطلوب",
  RENT_NOT_FOUND: "الإيجار غير موجود",
  MONTHLY_SALARY_ALREADY_EXISTS: "تم دفع راتب هذا الشهر بالفعل",
  REQUIRED_FIELDS_MISSING: "يرجى تعبئة جميع الحقول المطلوبة",
  ACCOUNTING_ACCESS_DENIED: "لا تملك صلاحية الوصول إلى هذا القسم",

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
export function resolveAccountingMessage(code, { fallback } = {}) {
  if (code && accountingMessages[code]) return accountingMessages[code];
  return fallback ?? "تمت العملية";
}

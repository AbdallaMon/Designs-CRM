// Arabic display labels for domain status enum values, keyed by domain. <StatusChip> uses
// these so it ALWAYS renders a text label (never color-only — UX plan §2 / a11y 1.4.1).
// VALUES are the Prisma enum keys (the data contract). Unknown values fall back to the raw
// value so nothing renders blank. Single-language Arabic / RTL.

export const STATUS_LABELS = {
  lead: {
    NEW: "جديد",
    IN_PROGRESS: "قيد التنفيذ",
    INTERESTED: "مهتم",
    NEEDS_IDENTIFIED: "تحديد الاحتياجات",
    NEGOTIATING: "تفاوض",
    LEADEXCHANGE: "تبادل العملاء",
    REJECTED: "مرفوض",
    FINALIZED: "منتهي",
    CONVERTED: "محوّل",
    ON_HOLD: "معلّق",
    ARCHIVED: "مؤرشف",
  },
  contract: {
    IN_PROGRESS: "قيد التنفيذ",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغى",
    INITIAL: "مبدئي",
    SIGNING: "قيد التوقيع",
    REGISTERED: "موثّق",
  },
  payment: {
    PENDING: "قيد الانتظار",
    PARTIALLY_PAID: "مدفوع جزئياً",
    FULLY_PAID: "مدفوع بالكامل",
    OVERDUE: "متأخر",
    RECEIVED: "تم الاستلام",
    TRANSFERRED: "تم التحويل",
    DUE: "مستحقة",
    NOT_DUE: "غير مستحقة",
  },
  task: {
    TODO: "بانتظار البدء",
    IN_PROGRESS: "قيد التنفيذ",
    DONE: "منجزة",
    CANCELLED: "ملغاة",
  },
  // reminder: CallReminderStatus (call + meeting reminders).
  reminder: {
    IN_PROGRESS: "مجدول",
    DONE: "تم",
    MISSED: "فائت",
  },
  session: {
    INITIAL: "مبدئية",
    PREVIEW_COLOR_PATTERN: "معاينة الألوان",
    SELECTED_COLOR_PATTERN: "تم اختيار الألوان",
    PREVIEW_MATERIAL: "معاينة الخامات",
    SELECTED_MATERIAL: "تم اختيار الخامات",
    PREVIEW_STYLE: "معاينة الطرز",
    SELECTED_STYLE: "تم اختيار الطرز",
    PREVIEW_IMAGES: "معاينة الصور",
    SELECTED_IMAGES: "تم اختيار الصور",
    PDF_GENERATED: "تم إنشاء الملف",
    SUBMITTED: "تم الإرسال",
  },
};

/** Resolve a (domain, value) pair to its Arabic label; falls back to the raw value. */
export function resolveStatusLabel(domain, value) {
  const map = STATUS_LABELS[domain] ?? {};
  return map[value] ?? value ?? "—";
}

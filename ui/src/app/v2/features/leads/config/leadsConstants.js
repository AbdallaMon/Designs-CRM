// Leads feature display constants — single language (Arabic / RTL). Mirrors the legacy
// enum label maps (helpers/constants.js: ClientLeadStatus, PaymentStatus, LeadCategory,
// KanbanLeadsStatus, KanbanBeginerLeadsStatus) so the migrated screens read identically.
// Status/category VALUES are the Prisma enum keys (the contract); labels are Arabic.

// Full lead status set (ClientLeadStatus).
export const LEAD_STATUS_LABELS = {
  NEW: "جديد",
  IN_PROGRESS: "قيد التنفيذ",
  INTERESTED: "مهتم",
  NEEDS_IDENTIFIED: "تحديد الاحتياجات",
  LEADEXCHANGE: "تبادل العملاء",
  NEGOTIATING: "تفاوض",
  REJECTED: "مرفوض",
  FINALIZED: "منتهي",
  CONVERTED: "محوّل",
  ON_HOLD: "معلّق",
  ARCHIVED: "مؤرشف",
};

// Statuses offered in the status-change menu for a privileged / primary user
// (legacy KanbanLeadsStatus).
export const LEAD_STATUS_CHANGE_FULL = [
  "IN_PROGRESS",
  "INTERESTED",
  "NEEDS_IDENTIFIED",
  "NEGOTIATING",
  "LEADEXCHANGE",
  "FINALIZED",
  "REJECTED",
  "ARCHIVED",
  "ON_HOLD",
];

// Statuses offered to a non-primary staff user (legacy KanbanBeginerLeadsStatus).
export const LEAD_STATUS_CHANGE_BEGINNER = [
  "IN_PROGRESS",
  "INTERESTED",
  "NEEDS_IDENTIFIED",
  "NEGOTIATING",
  "LEADEXCHANGE",
];

export const PAYMENT_STATUS_LABELS = {
  PENDING: "قيد الانتظار",
  PARTIALLY_PAID: "مدفوع جزئياً",
  FULLY_PAID: "مدفوع بالكامل",
  OVERDUE: "متأخر",
};

export const LEAD_CATEGORY_LABELS = {
  CONSULTATION: "استشارة",
  DESIGN: "تصميم",
  OLDLEAD: "عميل عبر ملف Excel",
};

export const statusLabel = (status) => LEAD_STATUS_LABELS[status] ?? status ?? "—";
export const paymentStatusLabel = (status) =>
  PAYMENT_STATUS_LABELS[status] ?? status ?? "—";
export const categoryLabel = (category) =>
  LEAD_CATEGORY_LABELS[category] ?? category ?? "—";

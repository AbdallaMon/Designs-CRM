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

// ── Lead create-form option sets (restored from master's AddNewLead → FinalSelectionForm) ──
// The admin create-lead endpoint REQUIRES `category` (LeadCategory) and `item` (LeadType); the
// values are the Prisma enum keys. OLDLEAD is excel-import-only, so the manual form offers only
// CONSULTATION + DESIGN. `item` is constrained by category (mirrors master's two-step flow):
//   CONSULTATION → ROOM / BLUEPRINT / CITY_VISIT (the consultation price keys the BE reads)
//   DESIGN       → APARTMENT / CONSTRUCTION_VILLA / UNDER_CONSTRUCTION_VILLA / PART_OF_HOME / COMMERCIAL
// Labels live in the leads dictionary (leads.create.*) and resolve with t() at render time.
export const LEAD_CREATE_CATEGORY_OPTIONS = [
  { value: "CONSULTATION", labelKey: "leads.create.category.CONSULTATION" },
  { value: "DESIGN", labelKey: "leads.create.category.DESIGN" },
];

export const LEAD_TYPE_LABELS = {
  ROOM: "ROOM",
  BLUEPRINT: "BLUEPRINT",
  CITY_VISIT: "CITY_VISIT",
  APARTMENT: "APARTMENT",
  CONSTRUCTION_VILLA: "CONSTRUCTION_VILLA",
  UNDER_CONSTRUCTION_VILLA: "UNDER_CONSTRUCTION_VILLA",
  PART_OF_HOME: "PART_OF_HOME",
  COMMERCIAL: "COMMERCIAL",
};

export const LEAD_ITEM_OPTIONS_BY_CATEGORY = {
  CONSULTATION: [
    { value: "ROOM", labelKey: "leads.create.item.ROOM" },
    { value: "BLUEPRINT", labelKey: "leads.create.item.BLUEPRINT" },
    { value: "CITY_VISIT", labelKey: "leads.create.item.CITY_VISIT" },
  ],
  DESIGN: [
    { value: "APARTMENT", labelKey: "leads.create.item.APARTMENT" },
    { value: "CONSTRUCTION_VILLA", labelKey: "leads.create.item.CONSTRUCTION_VILLA" },
    { value: "UNDER_CONSTRUCTION_VILLA", labelKey: "leads.create.item.UNDER_CONSTRUCTION_VILLA" },
    { value: "PART_OF_HOME", labelKey: "leads.create.item.PART_OF_HOME" },
    { value: "COMMERCIAL", labelKey: "leads.create.item.COMMERCIAL" },
  ],
};

// Inside/outside UAE — master's first-step Location select. The BE maps OUTSIDE_UAE → emirate
// "OUTSIDE"; INSIDE_UAE keeps the chosen emirate.
export const LEAD_LOCATION_OPTIONS = [
  { value: "INSIDE_UAE", labelKey: "leads.create.location.INSIDE_UAE" },
  { value: "OUTSIDE_UAE", labelKey: "leads.create.location.OUTSIDE_UAE" },
];

export const statusLabel = (status) => LEAD_STATUS_LABELS[status] ?? status ?? "—";
export const paymentStatusLabel = (status) =>
  PAYMENT_STATUS_LABELS[status] ?? status ?? "—";
export const categoryLabel = (category) =>
  LEAD_CATEGORY_LABELS[category] ?? category ?? "—";

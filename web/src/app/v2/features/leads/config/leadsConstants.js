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

// ── admin create-lead option sets ───────────────────────────────────────────────────
// The admin create endpoint (POST /v2/admin/new-lead) REQUIRES `category` (→ selectedCategory)
// AND `item` (→ lead.type). `item` is DEPENDENT on `category`. For CONSULTATION the `item` value
// MUST be one of the price-tabled tokens (ROOM/BLUEPRINT/CITY_VISIT) or the BE computes a NaN
// averagePrice; for DESIGN the `item` is a design-line token. Values are the language-neutral
// tokens the BE stores verbatim; `labelKey` is resolved with t() at render (NEVER call a hook at
// module scope). Mirrors the EMIRATES_OPTIONS factory pattern.

export const LEAD_CATEGORY_OPTIONS = [
  { value: "DESIGN", labelKey: "leads.create.category.DESIGN" },
  { value: "CONSULTATION", labelKey: "leads.create.category.CONSULTATION" },
];

// item options keyed by category (dependent select). Picking a new category resets the item.
export const LEAD_ITEM_OPTIONS_BY_CATEGORY = {
  DESIGN: [
    { value: "RESIDENTIAL", labelKey: "leads.create.item.RESIDENTIAL" },
    { value: "COMMERCIAL", labelKey: "leads.create.item.COMMERCIAL" },
  ],
  CONSULTATION: [
    { value: "ROOM", labelKey: "leads.create.item.ROOM" },
    { value: "BLUEPRINT", labelKey: "leads.create.item.BLUEPRINT" },
    { value: "CITY_VISIT", labelKey: "leads.create.item.CITY_VISIT" },
  ],
};

// UAE emirates — the create-lead `emirate` select (values stored verbatim; BE maps OUTSIDE_UAE
// separately via `location`). `labelKey` resolved with t() at render.
export const EMIRATES_OPTIONS = [
  { value: "DUBAI", labelKey: "leads.emirate.DUBAI" },
  { value: "ABU_DHABI", labelKey: "leads.emirate.ABU_DHABI" },
  { value: "SHARJAH", labelKey: "leads.emirate.SHARJAH" },
  { value: "AJMAN", labelKey: "leads.emirate.AJMAN" },
  { value: "UMM_AL_QUWAIN", labelKey: "leads.emirate.UMM_AL_QUWAIN" },
  { value: "RAS_AL_KHAIMAH", labelKey: "leads.emirate.RAS_AL_KHAIMAH" },
  { value: "FUJAIRAH", labelKey: "leads.emirate.FUJAIRAH" },
];

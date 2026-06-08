// Static config for the admin-residual surfaces — Arabic labels, the sub-surface tab set (gated
// per ADMIN_RESIDUAL.* code), and the lead-report filter enums. No raw visible strings live in
// component logic; they all originate here (or in adminResidualMessages.js for envelope CODEs).
// Single-language Arabic / RTL.

import { PERMISSIONS } from "@/app/v2/config/permissions";

const P = PERMISSIONS.ADMIN_RESIDUAL;

// ── sub-surface tab set (UrlTabs + the matching /v2/admin/* sub-routes) ──────────────────────
// `key` doubles as the route segment (/v2/admin/<key>) and the AdminShell tab id. Each tab is
// shown iff the user holds `permission` — the SAME predicate gates the page content + actions.
export const ADMIN_SURFACES = [
  { key: "projects", label: "المشاريع", href: "/v2/admin/projects", permission: P.PROJECT_VIEW },
  { key: "commissions", label: "العمولات", href: "/v2/admin/commissions", permission: P.COMMISSION_VIEW },
  { key: "reports", label: "التقارير", href: "/v2/admin/reports", permission: P.REPORT_GENERATE },
  { key: "leads", label: "عمليات العملاء", href: "/v2/admin/leads", permission: P.LEAD_IMPORT },
  { key: "fixed-data", label: "البيانات الثابتة", href: "/v2/admin/fixed-data", permission: P.FIXED_DATA_MANAGE },
];

// The breadcrumb group label shared by all admin surfaces.
export const ADMIN_GROUP_LABEL = "الإدارة";

// ── report builders ──────────────────────────────────────────────────────────────────────────
export const REPORT_TYPES = {
  lead: "تقرير العملاء المحتملين",
  staff: "تقرير الموظفين",
};

// UAE emirates — the lead-report `emirates[]` filter (values forwarded verbatim to the frozen
// generator, which reads the legacy enum tokens).
export const EMIRATES_OPTIONS = [
  { value: "DUBAI", label: "دبي" },
  { value: "ABU_DHABI", label: "أبوظبي" },
  { value: "SHARJAH", label: "الشارقة" },
  { value: "AJMAN", label: "عجمان" },
  { value: "UMM_AL_QUWAIN", label: "أم القيوين" },
  { value: "RAS_AL_KHAIMAH", label: "رأس الخيمة" },
  { value: "FUJAIRAH", label: "الفجيرة" },
];

// Lead status tokens for the `statuses[]` filter (legacy enum tokens, forwarded verbatim).
export const LEAD_STATUS_OPTIONS = [
  { value: "NEW", label: "جديد" },
  { value: "IN_PROGRESS", label: "قيد العمل" },
  { value: "INTERESTED", label: "مهتم" },
  { value: "NEEDS_IDENTIFIED", label: "تم تحديد الاحتياج" },
  { value: "NEGOTIATING", label: "تفاوض" },
  { value: "FINALIZED", label: "مكتمل" },
  { value: "REJECTED", label: "مرفوض" },
  { value: "ON_HOLD", label: "معلّق" },
  { value: "CONVERTED", label: "تم التحويل" },
];

// Archive-able models (the generic model-archive toggle; the BE allow-lists `model`).
export const ARCHIVE_MODEL_OPTIONS = [
  { value: "clientLead", label: "عميل محتمل" },
  { value: "client", label: "عميل" },
  { value: "project", label: "مشروع" },
];

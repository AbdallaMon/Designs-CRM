// Static config for the admin-residual surfaces — i18n label KEYS, the sub-surface tab set (gated
// per ADMIN_RESIDUAL.* code), and the lead-report filter enums. No raw visible strings live in
// component logic; the labels are resolved via t("adminResidual.*", fallback) at RENDER time in the
// consuming components (NEVER call useT/t at module scope). Envelope CODEs live in
// adminResidualMessages.js. Single-language default Arabic / RTL (bilingual ar/en at the edge).

import { PERMISSIONS } from "@/app/v2/config/permissions";

const P = PERMISSIONS.ADMIN_RESIDUAL;

// ── sub-surface tab set (UrlTabs + the matching /v2/admin/* sub-routes) ──────────────────────
// `key` doubles as the route segment (/v2/admin/<key>) and the AdminShell tab id. Each tab is
// shown iff the user holds `permission` — the SAME predicate gates the page content + actions.
// `labelKey` is resolved with t() in AdminShell at render time.
export const ADMIN_SURFACES = [
  { key: "projects", labelKey: "adminResidual.surface.projects.tab", labelFallback: "المشاريع", href: "/v2/admin/projects", permission: P.PROJECT_VIEW },
  { key: "commissions", labelKey: "adminResidual.surface.commissions.tab", labelFallback: "العمولات", href: "/v2/admin/commissions", permission: P.COMMISSION_VIEW },
  { key: "reports", labelKey: "adminResidual.surface.reports.tab", labelFallback: "التقارير", href: "/v2/admin/reports", permission: P.REPORT_GENERATE },
  { key: "leads", labelKey: "adminResidual.surface.leads.tab", labelFallback: "عمليات العملاء", href: "/v2/admin/leads", permission: P.LEAD_IMPORT },
  { key: "fixed-data", labelKey: "adminResidual.surface.fixedData.tab", labelFallback: "البيانات الثابتة", href: "/v2/admin/fixed-data", permission: P.FIXED_DATA_MANAGE },
];

// The breadcrumb group label shared by all admin surfaces (resolved with t() at render time).
export const ADMIN_GROUP_LABEL_KEY = "adminResidual.group.label";
export const ADMIN_GROUP_LABEL_FALLBACK = "الإدارة";

// ── report builders ──────────────────────────────────────────────────────────────────────────
// reportType value → { labelKey, labelFallback }, resolved with t() in ReportsBuilder.
export const REPORT_TYPES = {
  lead: { labelKey: "adminResidual.reports.type.lead", labelFallback: "تقرير العملاء المحتملين" },
  staff: { labelKey: "adminResidual.reports.type.staff", labelFallback: "تقرير الموظفين" },
};

// UAE emirates — the lead-report `emirates[]` filter (values forwarded verbatim to the frozen
// generator, which reads the legacy enum tokens). `labelKey` resolved with t() at render.
export const EMIRATES_OPTIONS = [
  { value: "DUBAI", labelKey: "adminResidual.emirate.DUBAI", labelFallback: "دبي" },
  { value: "ABU_DHABI", labelKey: "adminResidual.emirate.ABU_DHABI", labelFallback: "أبوظبي" },
  { value: "SHARJAH", labelKey: "adminResidual.emirate.SHARJAH", labelFallback: "الشارقة" },
  { value: "AJMAN", labelKey: "adminResidual.emirate.AJMAN", labelFallback: "عجمان" },
  { value: "UMM_AL_QUWAIN", labelKey: "adminResidual.emirate.UMM_AL_QUWAIN", labelFallback: "أم القيوين" },
  { value: "RAS_AL_KHAIMAH", labelKey: "adminResidual.emirate.RAS_AL_KHAIMAH", labelFallback: "رأس الخيمة" },
  { value: "FUJAIRAH", labelKey: "adminResidual.emirate.FUJAIRAH", labelFallback: "الفجيرة" },
];

// Lead status tokens for the `statuses[]` filter (legacy enum tokens, forwarded verbatim).
export const LEAD_STATUS_OPTIONS = [
  { value: "NEW", labelKey: "adminResidual.leadStatus.NEW", labelFallback: "جديد" },
  { value: "IN_PROGRESS", labelKey: "adminResidual.leadStatus.IN_PROGRESS", labelFallback: "قيد العمل" },
  { value: "INTERESTED", labelKey: "adminResidual.leadStatus.INTERESTED", labelFallback: "مهتم" },
  { value: "NEEDS_IDENTIFIED", labelKey: "adminResidual.leadStatus.NEEDS_IDENTIFIED", labelFallback: "تم تحديد الاحتياج" },
  { value: "NEGOTIATING", labelKey: "adminResidual.leadStatus.NEGOTIATING", labelFallback: "تفاوض" },
  { value: "FINALIZED", labelKey: "adminResidual.leadStatus.FINALIZED", labelFallback: "مكتمل" },
  { value: "REJECTED", labelKey: "adminResidual.leadStatus.REJECTED", labelFallback: "مرفوض" },
  { value: "ON_HOLD", labelKey: "adminResidual.leadStatus.ON_HOLD", labelFallback: "معلّق" },
  { value: "CONVERTED", labelKey: "adminResidual.leadStatus.CONVERTED", labelFallback: "تم التحويل" },
];

// Archive-able models (the generic model-archive toggle; the BE allow-lists `model`).
export const ARCHIVE_MODEL_OPTIONS = [
  { value: "clientLead", labelKey: "adminResidual.archiveModel.clientLead", labelFallback: "عميل محتمل" },
  { value: "client", labelKey: "adminResidual.archiveModel.client", labelFallback: "عميل" },
  { value: "project", labelKey: "adminResidual.archiveModel.project", labelFallback: "مشروع" },
];

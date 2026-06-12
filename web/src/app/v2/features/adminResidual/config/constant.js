// admin-residual domain — API contract surface. All paths are RELATIVE to the v2 API base
// (apiFetch is configured with config.apiUrl === /v2). One place to edit if a backend path
// changes (reconciliation point vs server/src/modules/admin-residual/**/*.routes.js).
//
// The aggregate admin-residual router is mounted at /v2/admin (server/src/shared/routes.js
// → `router.use("/admin", adminResidualRouter)`). Authentication is mounted ONCE at that
// aggregate; every route declares its own ADMIN_RESIDUAL.* permission code, granted to
// ADMIN/SUPER_ADMIN base + isSuperSales (the legacy `isAdmin` union). A plain STAFF/sales/
// designer/accountant role is 403'd on EVERY route here.
//
// Backend contract (confirmed against the v2 route files — paths 1:1 with legacy `/admin/*`):
//
//   ── reports (🔒 pdfkit/excel generation FROZEN; the FE just POSTs the filter/data payload
//      and the frozen generator owns the response body) — /v2/admin/reports ──────────────────
//     POST /reports/lead-report         → lead-report DATA            [admin_residual.report.generate]
//     POST /reports/lead-report/excel   → lead-report EXCEL (binary)  [admin_residual.report.generate]
//     POST /reports/lead-report/pdf     → lead-report PDF (binary)    [admin_residual.report.generate]
//     POST /reports/staff-report        → staff-report DATA           [admin_residual.report.generate]
//     POST /reports/staff-report/excel  → staff-report EXCEL (binary) [admin_residual.report.generate]
//     POST /reports/staff-report/pdf    → staff-report PDF (binary)   [admin_residual.report.generate]
//     body (.passthrough — FROZEN reads it verbatim): DATA endpoints read filter keys
//       { startDate, endDate, emirates[], statuses[], userIds[], clientIds[], reportType, ... };
//       EXCEL/PDF endpoints read a prepared `data` object (e.g. data.leads/summary/staffStats).
//     NOTE: excel/pdf return a FILE, not the JSON envelope. The current v2 ApiFetch parses
//     JSON only, so binary download wiring is a UX-phase concern; the foundation service fns
//     POST the payload and return what the client yields.
//
//   ── admin leads / client (legacy `/admin/*`, paths 1:1) ──────────────────────────────────
//     POST   /leads/excel                                 → bulk import (multipart "file")  [admin_residual.lead.import]
//     POST   /new-lead                                    → admin create lead               [admin_residual.lead.create]
//     POST   /leads/update/:id                            → admin lead field update         [admin_residual.lead.edit] (+ lead-scope)
//     DELETE /client-leads/:id                            → admin delete lead               [admin_residual.lead.delete] (+ lead-scope; base-role ADMIN-only on the BE — DO NOT widen)
//     PUT    /client/update/:clientId                     → admin client field update       [admin_residual.client.edit] (client-keyed; no single lead to scope)
//
//   ── telegram (lead-scoped) — /v2/admin/client-leads/:leadId/telegram/* ────────────────────
//     POST /client-leads/:leadId/telegram/new             → create telegram channel/link    [admin_residual.telegram.manage] (+ lead-scope)
//     POST /client-leads/:leadId/telegram/assign-users    → queue assign telegram users     [admin_residual.telegram.manage] (+ lead-scope)
//
//   ── fixed-data WRITES (the GET read lives in the utilities module) — /v2/admin/fixed-data ─
//     POST   /fixed-data            → create   body (.strict): { title, description? }       [admin_residual.fixed_data.manage]
//     PUT    /fixed-data/:id        → update   body (.strict, >=1 field): { title?, description? } [admin_residual.fixed_data.manage]
//     DELETE /fixed-data/:id        → delete                                                 [admin_residual.fixed_data.manage]
//
//   ── commissions — /v2/admin/commissions ───────────────────────────────────────────────────
//     GET  /commissions?userId=     → list commissions for a user                            [admin_residual.commission.view]
//     POST /commissions             → create  body (.strict): { userId, leadId, amount, commissionReason } [admin_residual.commission.manage]
//     PUT  /commissions/:id         → update  body (.strict): { amount }                      [admin_residual.commission.manage]
//
//   ── admin projects (global leads-with-projects aggregation; NOT in the projects module) ───
//      — /v2/admin/projects ─────────────────────────────────────────────────────────────────
//     GET  /projects               → aggregation (passthrough filters/page/limit query)      [admin_residual.project.view]
//     POST /projects/create-group  → create project group  body (.strict): { clientLeadId, title } [admin_residual.project.group_create] (+ lead-scope on body.clientLeadId)
//
//   ── model archive (generic; `model` query ALLOW-LISTED on the BE) — /v2/admin/model ───────
//     PATCH /model/archived/:id?model=<x>  → archive/unarchive  body (.strict): { isArchived } [admin_residual.model.archive]

// ── base segments ──────────────────────────────────────────────────────────────────────────
export const ADMIN_BASE = "admin";

// ── reports (🔒 frozen generators) ──────────────────────────────────────────────────────────
export const REPORTS_BASE = `${ADMIN_BASE}/reports`;
export const LEAD_REPORT_URL = `${REPORTS_BASE}/lead-report`;
export const LEAD_REPORT_EXCEL_URL = `${REPORTS_BASE}/lead-report/excel`;
export const LEAD_REPORT_PDF_URL = `${REPORTS_BASE}/lead-report/pdf`;
export const STAFF_REPORT_URL = `${REPORTS_BASE}/staff-report`;
export const STAFF_REPORT_EXCEL_URL = `${REPORTS_BASE}/staff-report/excel`;
export const STAFF_REPORT_PDF_URL = `${REPORTS_BASE}/staff-report/pdf`;

// ── admin leads / client / telegram ──────────────────────────────────────────────────────────
export const LEADS_EXCEL_IMPORT_URL = `${ADMIN_BASE}/leads/excel`;
export const NEW_LEAD_URL = `${ADMIN_BASE}/new-lead`;
export const leadUpdateUrl = (id) => `${ADMIN_BASE}/leads/update/${id}`;
export const clientLeadDeleteUrl = (id) => `${ADMIN_BASE}/client-leads/${id}`;
export const clientUpdateUrl = (clientId) => `${ADMIN_BASE}/client/update/${clientId}`;
export const telegramNewUrl = (leadId) => `${ADMIN_BASE}/client-leads/${leadId}/telegram/new`;
export const telegramAssignUsersUrl = (leadId) =>
  `${ADMIN_BASE}/client-leads/${leadId}/telegram/assign-users`;

// ── fixed-data writes ────────────────────────────────────────────────────────────────────────
export const FIXED_DATA_URL = `${ADMIN_BASE}/fixed-data`;
export const fixedDataItemUrl = (id) => `${ADMIN_BASE}/fixed-data/${id}`;

// ── commissions ──────────────────────────────────────────────────────────────────────────────
export const COMMISSIONS_URL = `${ADMIN_BASE}/commissions`;
export const commissionItemUrl = (id) => `${ADMIN_BASE}/commissions/${id}`;

// ── admin projects aggregation + project-group create ────────────────────────────────────────
export const ADMIN_PROJECTS_URL = `${ADMIN_BASE}/projects`;
export const ADMIN_PROJECTS_CREATE_GROUP_URL = `${ADMIN_BASE}/projects/create-group`;

// ── model archive (allow-listed) ─────────────────────────────────────────────────────────────
export const modelArchiveUrl = (id) => `${ADMIN_BASE}/model/archived/${id}`;

// The allow-listed `model` query values the BE accepts (ADMIN_ARCHIVE_MODEL_ALLOWLIST):
// GLOBAL image-session reference data, each with an `isArchived` column. There is NO list
// endpoint — only the per-id PATCH toggle — so the archive UI is a restore-by-id control.
// Keys are the lowercase values the BE validation expects (it resolves to the camelCase
// Prisma delegate); labels are Arabic for the picker.
export const ARCHIVE_MODELS = [
  { value: "style", labelAr: "الأنماط" },
  { value: "colorpattern", labelAr: "أنماط الألوان" },
  { value: "material", labelAr: "الخامات" },
  { value: "space", labelAr: "المساحات" },
  { value: "designimage", labelAr: "صور التصميم" },
];

// ── staff users pick-list (reused from the users surface for the report/commission pickers) ──
// GET /users/all-users → role-grouped pick list (gated by user.list). Relative to /v2.
export const USERS_ALL_URL = "users/all-users";

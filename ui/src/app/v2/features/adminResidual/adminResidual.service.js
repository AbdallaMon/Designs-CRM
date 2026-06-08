// admin-residual data-access service — the ONLY place that talks to the admin-residual API.
// Wraps the canonical apiFetch (config.apiUrl === /v2). Components/hooks call these helpers,
// NEVER fetch/apiFetch directly. All JSON responses share the { success, message, data,
// translationKey } envelope; helpers return the parsed envelope.
//
// AUTHED admin-tier surface only (apiFetch.* — credentialed, cookie auth). Every path targets
// /v2/admin/* and is gated on the BE by an ADMIN_RESIDUAL.* code (granted to ADMIN/SUPER_ADMIN
// base + isSuperSales — the legacy `isAdmin` union). There is NO public sub-surface here.
//
// Notes baked in here:
//  • Paths come from ./config/constant.js (single source of truth); they are RELATIVE to /v2.
//  • Mutating bodies are picked to match the BE .strict() schemas exactly (no extra keys),
//    EXCEPT the dynamic field-update + new-lead + report payloads, which the BE reads via
//    .passthrough() and the frozen logic consumes verbatim — those are forwarded as-is.
//  • 🔒 Reports: the excel/pdf generators are FROZEN and return a FILE (not the JSON envelope).
//    The current v2 ApiFetch parses JSON only, so binary download wiring is a UX-phase concern.
//    These foundation fns POST the payload exactly; the *data* variants return the envelope.
//  • The bulk import is multipart ("file"); we hand the FormData straight to apiFetch.post with
//    isMultipart=true so it is NOT JSON-serialized and the browser sets the boundary header.

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  // reports
  LEAD_REPORT_URL,
  LEAD_REPORT_EXCEL_URL,
  LEAD_REPORT_PDF_URL,
  STAFF_REPORT_URL,
  STAFF_REPORT_EXCEL_URL,
  STAFF_REPORT_PDF_URL,
  // admin leads / client / telegram
  LEADS_EXCEL_IMPORT_URL,
  NEW_LEAD_URL,
  leadUpdateUrl,
  clientLeadDeleteUrl,
  clientUpdateUrl,
  telegramNewUrl,
  telegramAssignUsersUrl,
  // fixed-data
  FIXED_DATA_URL,
  fixedDataItemUrl,
  // commissions
  COMMISSIONS_URL,
  commissionItemUrl,
  // admin projects
  ADMIN_PROJECTS_URL,
  ADMIN_PROJECTS_CREATE_GROUP_URL,
  // model archive
  modelArchiveUrl,
} from "./config/constant.js";

// Build a query string with top-level params (skips empty/null/undefined).
function buildQuery(base, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

// Pick only the whitelisted keys (the BE .strict() schemas reject extra keys).
function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => {
    if (obj != null && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") out[k] = obj[k];
  });
  return out;
}

export const adminResidualService = {
  // ── reports (🔒 FROZEN generators; permission: admin_residual.report.generate) ───────
  // The *data* variants return the JSON envelope; the *excel*/*pdf* variants return a FILE
  // (binary) — see the service-header note. Bodies are forwarded verbatim (BE .passthrough).
  // POST /reports/lead-report
  generateLeadReportData: (body = {}) => apiFetch.post(LEAD_REPORT_URL, body),
  // POST /reports/lead-report/excel
  generateLeadReportExcel: (body = {}) => apiFetch.post(LEAD_REPORT_EXCEL_URL, body),
  // POST /reports/lead-report/pdf
  generateLeadReportPdf: (body = {}) => apiFetch.post(LEAD_REPORT_PDF_URL, body),
  // POST /reports/staff-report
  generateStaffReportData: (body = {}) => apiFetch.post(STAFF_REPORT_URL, body),
  // POST /reports/staff-report/excel
  generateStaffReportExcel: (body = {}) => apiFetch.post(STAFF_REPORT_EXCEL_URL, body),
  // POST /reports/staff-report/pdf
  generateStaffReportPdf: (body = {}) => apiFetch.post(STAFF_REPORT_PDF_URL, body),

  // ── admin leads (permission per fn — see config header) ──────────────────────────────
  // POST /leads/excel — multipart "file" bulk import (admin_residual.lead.import)
  importLeads: (file) => {
    const fd = new FormData();
    if (file) fd.append("file", file);
    // apiFetch.post(path, body, isFileUpload, customHeader, isMultipart)
    return apiFetch.post(LEADS_EXCEL_IMPORT_URL, fd, false, undefined, true);
  },
  // POST /new-lead — rich client form; BE .passthrough() → forward verbatim (admin_residual.lead.create)
  createNewLead: (body = {}) => apiFetch.post(NEW_LEAD_URL, body),
  // POST /leads/update/:id — dynamic single-field update { field, inputType?, [field]: value }
  // (BE .passthrough(); lead-scoped) (admin_residual.lead.edit)
  updateLead: (id, body = {}) => apiFetch.post(leadUpdateUrl(id), body),
  // DELETE /client-leads/:id — lead-scoped; base-role ADMIN-ONLY on the BE — DO NOT widen
  // the FE gate (admin_residual.lead.delete)
  deleteLead: (id) => apiFetch.delete(clientLeadDeleteUrl(id)),
  // PUT /client/update/:clientId — client-keyed dynamic field update (admin_residual.client.edit)
  updateClient: (clientId, body = {}) => apiFetch.put(clientUpdateUrl(clientId), body),

  // ── telegram (lead-scoped; admin_residual.telegram.manage) ───────────────────────────
  // POST /client-leads/:leadId/telegram/new
  createTelegramChannel: (leadId, body = {}) => apiFetch.post(telegramNewUrl(leadId), body),
  // POST /client-leads/:leadId/telegram/assign-users
  assignTelegramUsers: (leadId, body = {}) => apiFetch.post(telegramAssignUsersUrl(leadId), body),

  // ── fixed-data writes (admin_residual.fixed_data.manage) ─────────────────────────────
  // POST /fixed-data — body (.strict): { title, description? }
  createFixedData: (body = {}) => apiFetch.post(FIXED_DATA_URL, pick(body, ["title", "description"])),
  // PUT /fixed-data/:id — body (.strict, >=1 field): { title?, description? }
  updateFixedData: (id, body = {}) => apiFetch.put(fixedDataItemUrl(id), pick(body, ["title", "description"])),
  // DELETE /fixed-data/:id
  deleteFixedData: (id) => apiFetch.delete(fixedDataItemUrl(id)),

  // ── commissions ──────────────────────────────────────────────────────────────────────
  // GET /commissions?userId= (admin_residual.commission.view)
  listCommissions: (params = {}) => apiFetch.get(buildQuery(COMMISSIONS_URL, params)),
  // POST /commissions — body (.strict): { userId, leadId, amount, commissionReason } (admin_residual.commission.manage)
  createCommission: (body = {}) =>
    apiFetch.post(COMMISSIONS_URL, pick(body, ["userId", "leadId", "amount", "commissionReason"])),
  // PUT /commissions/:id — body (.strict): { amount } (admin_residual.commission.manage)
  updateCommission: (id, body = {}) => apiFetch.put(commissionItemUrl(id), pick(body, ["amount"])),

  // ── admin projects (aggregation + project-group create) ──────────────────────────────
  // GET /projects?... — global leads-with-projects aggregation; BE reads filters/page/limit
  // via .passthrough() (admin_residual.project.view)
  listAdminProjects: (params = {}) => apiFetch.get(buildQuery(ADMIN_PROJECTS_URL, params)),
  // POST /projects/create-group — body (.strict): { clientLeadId, title } (lead-scoped on
  // body.clientLeadId) (admin_residual.project.group_create)
  createProjectGroup: (body = {}) =>
    apiFetch.post(ADMIN_PROJECTS_CREATE_GROUP_URL, pick(body, ["clientLeadId", "title"])),

  // ── model archive (generic; `model` query ALLOW-LISTED on the BE) ────────────────────
  // PATCH /model/archived/:id?model=<x> — body (.strict): { isArchived } (admin_residual.model.archive)
  archiveModel: (id, { model, isArchived } = {}) =>
    apiFetch.patch(buildQuery(modelArchiveUrl(id), { model }), { isArchived: Boolean(isArchived) }),
};

export default adminResidualService;

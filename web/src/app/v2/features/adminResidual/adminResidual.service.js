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
//  • 🔒 Reports: the excel/pdf generators are FROZEN and STREAM a FILE (not the JSON envelope).
//    apiFetch parses JSON only, so the binary read is confined to the dedicated download
//    helpers below (postForPdfBlob → Blob → save). We only CALL the frozen endpoint and save
//    its bytes — no PDF logic is touched. The *data* variants still return the JSON envelope.
//  • The bulk import is multipart ("file"); we hand the FormData straight to apiFetch.post with
//    isMultipart=true so it is NOT JSON-serialized and the browser sets the boundary header.

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import config from "@/app/v2/lib/config";
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
  // staff users pick-list (reused from the users surface for report/commission pickers)
  USERS_ALL_URL,
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

// ── binary (PDF) download helper ──────────────────────────────────────────────────────────
// 🔒 The report PDF generators are LOGIC-FROZEN: they stream `application/pdf` (Content-
// Disposition: attachment) and OWN the response body. We NEVER touch that logic — we only
// CALL the endpoint and save the bytes it returns. The canonical apiFetch parses JSON only
// and cannot yield a Blob, so the binary read is confined HERE in the data-access layer
// (components still never fetch directly). We POST the prepared `{ data }` payload exactly
// as the frozen generator expects, then turn the streamed PDF into a Blob the browser saves.
function buildAbsoluteUrl(path) {
  return `${config.apiUrl}/${String(path).replace(/^\//, "")}`;
}

async function postForPdfBlob(path, body, filename) {
  const response = await fetch(buildAbsoluteUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) {
    // The frozen generator may emit a JSON error on failure; surface its CODE so the
    // mutation runner can resolve it to Arabic (mirrors the apiFetch error shape).
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    const err = new Error(data?.message || response.statusText || "PDF_GENERATION_FAILED");
    err.status = response.status;
    err.data = data || { message: "PDF_GENERATION_FAILED" };
    throw err;
  }
  const blob = await response.blob();
  triggerBlobDownload(blob, filename);
  return { success: true, message: "OK", data: { downloaded: true } };
}

// Save a Blob to the user's machine via a transient object URL (no DOM library needed).
function triggerBlobDownload(blob, filename) {
  if (typeof window === "undefined") return;
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export const adminResidualService = {
  // ── reports (🔒 FROZEN generators; permission: admin_residual.report.generate) ───────
  // The *data* variants return the JSON envelope (filters → { leads, summary } /
  // { staffStats, summary, dateRange }); the *excel*/*pdf* variants STREAM a FILE — read as
  // a Blob and saved by the helper. Bodies are forwarded verbatim (BE .passthrough); the PDF/
  // excel generators read a prepared `{ data }` object built from the matching *data* call.
  // POST /reports/lead-report  → { leads, summary }
  generateLeadReportData: (body = {}) => apiFetch.post(LEAD_REPORT_URL, body),
  // POST /reports/lead-report/pdf  → streams lead-report.pdf (body: { data: { leads, summary } })
  downloadLeadReportPdf: (data) =>
    postForPdfBlob(LEAD_REPORT_PDF_URL, { data }, "lead-report.pdf"),
  // POST /reports/lead-report/excel → streams lead-report.xlsx (body: { data })
  downloadLeadReportExcel: (data) =>
    postForPdfBlob(LEAD_REPORT_EXCEL_URL, { data }, "lead-report.xlsx"),
  // POST /reports/staff-report  → { staffStats, summary, dateRange }
  generateStaffReportData: (body = {}) => apiFetch.post(STAFF_REPORT_URL, body),
  // POST /reports/staff-report/pdf  → streams staff-report.pdf (body: { data })
  downloadStaffReportPdf: (data) =>
    postForPdfBlob(STAFF_REPORT_PDF_URL, { data }, "staff-report.pdf"),
  // POST /reports/staff-report/excel → streams staff-report.xlsx (body: { data })
  downloadStaffReportExcel: (data) =>
    postForPdfBlob(STAFF_REPORT_EXCEL_URL, { data }, "staff-report.xlsx"),

  // ── staff users pick-list (reused read for the report/commission user pickers) ───────
  // GET /users/all-users?role=STAFF&exactRole=true → { items: [{ id, name, email, ... }] }
  // (gated by user.list on the BE). exactRole=true narrows to PRIMARY-role STAFF agents
  // only (the sales staff who earn lead commissions), excluding designers/executors who
  // merely carry a STAFF subRole.
  getStaffUsers: () =>
    apiFetch.get(buildQuery(USERS_ALL_URL, { role: "STAFF", exactRole: "true" })),

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

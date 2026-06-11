// Accounting data-access service — the ONLY place that talks to the accounting API. Wraps
// the canonical apiFetch (config.apiUrl === /v2). Components/hooks call these helpers,
// never fetch/apiFetch directly. All responses share the { success, message, data,
// translationKey } envelope; helpers return the parsed envelope.
//
// §5c deltas baked in here:
//  • All paths target /v2/accounting/* (NOT legacy /accountant).
//  • Lists consume `data: { items, total, page, pageSize }` (the controllers wrap the
//    legacy `{ data, total }` into this shape; notes/invoices return `{ items }`).
//  • Payment workflow actions are POST /:paymentId/actions/{pay,mark-overdue,change-status}
//    (renamed from POST .../pay, POST .../overdue, PUT .../status).
//  • change-status sends ONLY { newPaymentLevel } — the dropped client `oldPaymentLevel`
//    is NOT sent (the BE .strict() schema would 422 on it).
//  • Mutating bodies are built to match the BE .strict() schemas exactly (no extra keys).

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  PAYMENTS_URL,
  paymentInvoicesUrl,
  paymentPayUrl,
  paymentMarkOverdueUrl,
  paymentChangeStatusUrl,
  NOTES_URL,
  EXPENSES_URL,
  RENTS_URL,
  rentUrl,
  OUTCOME_URL,
  SUMMARY_URL,
  ACCOUNTING_USERS_URL,
  userLastSeenUrl,
  SALARY_DATA_URL,
  SALARY_MONTHLY_PAY_URL,
  salaryCreateUrl,
  salaryEditUrl,
} from "./config/constant.js";

// Build a query string with top-level params. The accounting list reads page/limit and a
// JSON `filters` string (payments/outcome) plus top-level keys (status/type/level/clientId
// /paymentId) off the query — all preserved from the legacy accountant routes.
function buildQuery(base, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  });
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

// ── §5c .strict() body whitelists (do NOT spread the whole object — the BE 422s) ──────
function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => {
    if (obj != null && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") out[k] = obj[k];
  });
  return out;
}

export const accountingService = {
  // ── payments ──────────────────────────────────────────────────────────────────────
  // GET /payments — top-level params (status/type/level/clientId/paymentId) + page/limit.
  listPayments: (params = {}) => apiFetch.get(buildQuery(PAYMENTS_URL, params)),
  // GET /:paymentId/invoices → { items }
  listInvoices: (paymentId) => apiFetch.get(paymentInvoicesUrl(paymentId)),
  // POST /:paymentId/actions/pay — strict body { amount, issuedDate, file? }.
  pay: (paymentId, body) =>
    apiFetch.post(paymentPayUrl(paymentId), pick(body, ["amount", "issuedDate", "file"])),
  // POST /:paymentId/actions/mark-overdue — no body.
  markOverdue: (paymentId) => apiFetch.post(paymentMarkOverdueUrl(paymentId)),
  // POST /:paymentId/actions/change-status — strict body { newPaymentLevel } (NO oldPaymentLevel).
  changeStatus: (paymentId, body) =>
    apiFetch.post(paymentChangeStatusUrl(paymentId), pick(body, ["newPaymentLevel"])),

  // ── notes (generic, owner-keyed) ───────────────────────────────────────────────────
  // GET /notes?idKey=&id= → { items }
  listNotes: (idKey, id) => apiFetch.get(buildQuery(NOTES_URL, { idKey, id })),
  // POST /notes — strict body { content?, attachment?, idKey?, id? } (userId server-set).
  addNote: (body) => apiFetch.post(NOTES_URL, pick(body, ["content", "attachment", "idKey", "id"])),

  // ── operational expenses ────────────────────────────────────────────────────────────
  listExpenses: (params = {}) => apiFetch.get(buildQuery(EXPENSES_URL, params)),
  // POST / — strict body { category, amount, description?, paymentDate }.
  createExpense: (body) =>
    apiFetch.post(EXPENSES_URL, pick(body, ["category", "amount", "description", "paymentDate"])),

  // ── rents ───────────────────────────────────────────────────────────────────────────
  listRents: (params = {}) => apiFetch.get(buildQuery(RENTS_URL, params)),
  // POST / — strict body { name, amount, description?, startDate, endDate, paymentDate }.
  createRent: (body) =>
    apiFetch.post(
      RENTS_URL,
      pick(body, ["name", "amount", "description", "startDate", "endDate", "paymentDate"]),
    ),
  // PUT /:rentId — strict body { name?, amount, startDate, endDate, paymentDate? }.
  renewRent: (rentId, body) =>
    apiFetch.put(
      rentUrl(rentId),
      pick(body, ["name", "amount", "startDate", "endDate", "paymentDate"]),
    ),

  // ── outcome / summary ───────────────────────────────────────────────────────────────
  // GET /outcome — supports a JSON `filters` carrying { range: { startDate, endDate } }.
  listOutcome: (params = {}) => apiFetch.get(buildQuery(OUTCOME_URL, params)),
  getSummary: () => apiFetch.get(SUMMARY_URL),

  // ── accountant-scoped user helper lists (for salaries) ─────────────────────────────
  // GET /users — JSON `filters` (status) + top-level staffId + page/limit.
  listUsers: (params = {}) => apiFetch.get(buildQuery(ACCOUNTING_USERS_URL, params)),
  // GET /users/:userId/last-seen?month=&year=
  getUserLastSeen: (userId, { month, year } = {}) =>
    apiFetch.get(buildQuery(userLastSeenUrl(userId), { month, year })),

  // ── salaries ─────────────────────────────────────────────────────────────────────
  // GET /salaries/data?userId=&startDate=&endDate=
  getSalaryData: ({ userId, startDate, endDate } = {}) =>
    apiFetch.get(buildQuery(SALARY_DATA_URL, { userId, startDate, endDate })),
  // POST /salaries/:userId — strict body { baseSalary, baseWorkHours, taxAmount? }.
  createBaseSalary: (userId, body) =>
    apiFetch.post(salaryCreateUrl(userId), pick(body, ["baseSalary", "baseWorkHours", "taxAmount"])),
  // PUT /salaries/:id — strict body { baseSalary, baseWorkHours, taxAmount } (all required).
  editBaseSalary: (id, body) =>
    apiFetch.put(salaryEditUrl(id), pick(body, ["baseSalary", "baseWorkHours", "taxAmount"])),
  // POST /salaries/monthly/pay — strict body
  //   { baseSalaryId, totalHoursWorked, netSalary, overtimeHours?, bonuses?, deductions?,
  //     isFulfilled?, paymentDate }.
  payMonthlySalary: (body) =>
    apiFetch.post(
      SALARY_MONTHLY_PAY_URL,
      pick(body, [
        "baseSalaryId",
        "totalHoursWorked",
        "netSalary",
        "overtimeHours",
        "bonuses",
        "deductions",
        "isFulfilled",
        "paymentDate",
      ]),
    ),
};

export default accountingService;

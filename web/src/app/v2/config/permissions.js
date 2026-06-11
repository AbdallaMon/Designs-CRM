// FE mirror of the backend permission codes (packages/shared/constants/access/
// permissions.constants.js). Single source of truth is the backend; this file mirrors
// the dot.case codes so the UI can gate actions. Keep in sync (migration plan §6,
// reconciliation point). Only the modules the FE consumes today are mirrored.

export const CHAT_PERMISSIONS = {
  ROOM_LIST: "chat.room.list",
  ROOM_VIEW: "chat.room.view",
  ROOM_CREATE: "chat.room.create",
  ROOM_EDIT: "chat.room.edit",
  ROOM_DELETE: "chat.room.delete",
  MEMBER_MANAGE: "chat.member.manage",
  MESSAGE_VIEW: "chat.message.view",
  MESSAGE_SEND: "chat.message.send",
};

export const AUTH_PERMISSIONS = {
  ME: "auth.me",
  LOGOUT: "auth.logout",
};

export const TELEGRAM_PERMISSIONS = {
  MANAGE: "telegram.manage",
};

export const UPLOAD_PERMISSIONS = {
  FILE_UPLOAD: "upload.file.upload",
};

// Site-utility module (admin/super-admin). Mirrors the backend @dms/shared codes.
export const SITE_UTILITY_PERMISSIONS = {
  PDF_CONFIG_VIEW: "site_utility.pdf_config.view",
  PDF_CONFIG_EDIT: "site_utility.pdf_config.edit",
  PAYMENT_CONDITION_LIST: "site_utility.payment_condition.list",
  PAYMENT_CONDITION_CREATE: "site_utility.payment_condition.create",
  PAYMENT_CONDITION_EDIT: "site_utility.payment_condition.edit",
  PAYMENT_CONDITION_DELETE: "site_utility.payment_condition.delete",
  // Contract utility editor (obligations + stage/special/level clause templates).
  CONTRACT_UTILITY_VIEW: "site_utility.contract_utility.view",
  CONTRACT_UTILITY_EDIT: "site_utility.contract_utility.edit",
};

// Leads / sales module. Byte-matches the backend @dms/shared LEAD_PERMISSIONS values
// (packages/shared/constants/access/permissions.constants.js). Reads/writes split; the
// backend ALSO emits per-record capabilities.* — gate object-level actions on BOTH.
export const LEAD_PERMISSIONS = {
  LIST: "lead.list",
  VIEW: "lead.view",
  ASSIGN_SELF: "lead.assign.self",
  ASSIGN_OTHER: "lead.assign.other",
  CONVERT: "lead.convert",
  EDIT: "lead.edit",
  CHANGE_STATUS: "lead.change_status",
  CALL_MANAGE: "lead.call.manage",
  MEETING_MANAGE: "lead.meeting.manage",
  PRICE_OFFER_MANAGE: "lead.price_offer.manage",
  PAYMENT_MANAGE: "lead.payment.manage",
  FILE_MANAGE: "lead.file.manage",
  NOTE_MANAGE: "lead.note.manage",
  REMINDER_SEND: "lead.reminder.send",
  COUNTRY_CHECK: "lead.country.check",
};

// Projects domain. Byte-matches the backend @dms/shared PROJECT/TASK/UPDATE/DELIVERY
// _PERMISSIONS values (packages/shared/constants/access/permissions.constants.js). The
// four sub-surfaces (project/task/update/delivery) form ONE coupled domain centered on
// the Project/ClientLead entity and share a single scope checker. The backend ALSO emits
// per-record capabilities.* — gate object-level actions on BOTH.
export const PROJECT_PERMISSIONS = {
  LIST: "project.list",
  VIEW: "project.view",
  EDIT: "project.edit",
  MANAGE: "project.manage",
};

export const TASK_PERMISSIONS = {
  LIST: "task.list",
  VIEW: "task.view",
  CREATE: "task.create",
  EDIT: "task.edit",
  DELETE: "task.delete",
  NOTE_MANAGE: "task.note.manage",
};

export const UPDATE_PERMISSIONS = {
  LIST: "update.list",
  CREATE: "update.create",
  AUTHORIZE: "update.authorize",
  ARCHIVE: "update.archive",
  MARK_DONE: "update.mark_done",
};

export const DELIVERY_PERMISSIONS = {
  LIST: "delivery.list",
  CREATE: "delivery.create",
  LINK_MEETING: "delivery.link_meeting",
  DELETE: "delivery.delete",
};

// Accounting module (ACCOUNTANT-only surface). Byte-matches the backend @dms/shared
// ACCOUNTING_PERMISSIONS values (packages/shared/constants/access/permissions.constants.js).
// The backend grants every one of these codes to the ACCOUNTANT role only; this whole FE
// feature is gated on these codes. The backend ALSO emits per-record capabilities.* on
// payment/rent rows — gate object-level actions on BOTH.
export const ACCOUNTING_PERMISSIONS = {
  // payments
  PAYMENT_LIST: "accounting.payment.list",
  PAYMENT_PROCESS: "accounting.payment.process",
  PAYMENT_MARK_OVERDUE: "accounting.payment.mark_overdue",
  PAYMENT_CHANGE_LEVEL: "accounting.payment.change_level",
  // notes
  NOTE_LIST: "accounting.note.list",
  NOTE_CREATE: "accounting.note.create",
  // operational expenses
  EXPENSE_LIST: "accounting.expense.list",
  EXPENSE_CREATE: "accounting.expense.create",
  // rents
  RENT_LIST: "accounting.rent.list",
  RENT_CREATE: "accounting.rent.create",
  RENT_RENEW: "accounting.rent.renew",
  // outcome / summary
  OUTCOME_LIST: "accounting.outcome.list",
  SUMMARY_VIEW: "accounting.summary.view",
  // accountant-scoped user helper lists (for salaries)
  USER_LIST: "accounting.user.list",
  USER_LAST_SEEN: "accounting.user.last_seen",
  // salaries
  SALARY_VIEW: "accounting.salary.view",
  SALARY_CREATE: "accounting.salary.create",
  SALARY_EDIT: "accounting.salary.edit",
  SALARY_PAY: "accounting.salary.pay",
};

// Calendar module (authed staff availability + month-views + Google integration).
// Byte-matches the backend @dms/shared CALENDAR_PERMISSIONS values
// (packages/shared/constants/access/permissions.constants.js). Every authed role holds
// these via CALENDAR_AUTHED (the legacy SHARED gate); the codes are the gate (availability
// rows/month-views have NO per-owner object scope by design — see BE route notes). The
// PUBLIC client booking surface is UNGATED (token-based) and has NO permission code.
export const CALENDAR_PERMISSIONS = {
  VIEW: "calendar.view", // GET available-days, slots, dates/month, dates/day
  MANAGE: "calendar.manage", // POST available-days(/multiple), DELETE days/:id, slots/:id
  GOOGLE_VIEW: "calendar.google.view", // GET google/connect (auth URL), google/status, google/callback
  GOOGLE_MANAGE: "calendar.google.manage", // POST google/connect, POST google/disconnect
};

// Contracts module (authed staff/admin CRUD surface — legacy SHARED gate = all 9 authed
// roles, granted via CONTRACT_AUTHED). Byte-matches the backend @dms/shared
// CONTRACT_PERMISSIONS values (packages/shared/constants/access/permissions.constants.js).
// Contracts are LEAD-SCOPED: the BE resolves the parent clientLead and runs the leads-module
// object-scope checker (access for reads, mutate for writes) before any read/write. The
// contract dto does NOT emit per-record capabilities.* — gate authed actions on these CODES
// only (the server enforces the lead scope). The PUBLIC client e-sign surface is UNGATED
// (token-based) and has NO permission code.
export const CONTRACT_PERMISSIONS = {
  // reads
  LIST: "contract.list", // GET /client-lead/:leadId (lead-scoped list)
  VIEW: "contract.view", // GET /:contractId (lead-scoped detail)
  PAYMENT_LIST: "contract.payment.list", // GET /payments/all (role-scoped grouped list)
  // writes — contract lifecycle
  CREATE: "contract.create", // POST /
  EDIT: "contract.edit", // PUT /:contractId/basics
  CANCEL: "contract.cancel", // POST /:contractId/actions/cancel (🔒 builds a cancelled PDF)
  GENERATE_PDF_TOKEN: "contract.generate_pdf_token", // POST /:contractId/actions/generate-pdf-token
  // writes — stages / payments / drawings / special-items (all lead-scoped via the contract)
  STAGE_MANAGE: "contract.stage.manage",
  PAYMENT_MANAGE: "contract.payment.manage",
  DRAWING_MANAGE: "contract.drawing.manage",
  SPECIAL_ITEM_MANAGE: "contract.special_item.manage",
};

// Image-sessions module. Byte-matches the backend @dms/shared IMAGE_SESSION_PERMISSIONS
// values (packages/shared/constants/access/permissions.constants.js). TWO authed surfaces:
//   • ADMIN reference-data CRUD (global studio config — admins see all; the ADMIN_* code is
//     the gate, NO per-record object scope by design).
//   • SHARED lead-scoped session management (every authed role holds SESSION_* via the legacy
//     SHARED gate; the BE enforces lead scope per record via the leads-module checker — the
//     session dto emits NO capabilities.*, so gate authed actions on these CODES only).
// The PUBLIC client image-selection surface is UNGATED (the per-session token IS the auth)
// and has NO permission code.
export const IMAGE_SESSION_PERMISSIONS = {
  ADMIN_VIEW: "image_session.admin.view", // GET space/templates/material/style/colors/images/page-info(/ids)
  ADMIN_MANAGE: "image_session.admin.manage", // create/update/delete/reorder reference data
  SESSION_VIEW: "image_session.session.view", // GET /:clientLeadId/sessions (lead-scoped read), GET /ids
  SESSION_MANAGE: "image_session.session.manage", // create/edit/regenerate/delete a lead's session (lead-scoped write)
};

// ── Foundation-phase mirrors (Option A): the data-layer permission codes for the
// remaining FE features. Screens land in the UX-redesign phase; these gate them when built.
// All values byte-match the backend @dms/shared blocks of the same name.

// Users / admin user-management. DIRECTORY is a broad authed pick-list; the rest are
// admin-tier. PROFILE_* are object-scope checked (self OR admin-tier) by the BE.
export const USER_PERMISSIONS = {
  DIRECTORY: "user.directory", // GET /directory , /related-chat-directory
  PROFILE_VIEW: "user.profile.view", // GET /:userId/profile
  PROFILE_EDIT: "user.profile.edit", // PUT /:userId/profile
  LIST: "user.list", // GET /users , /all-users , /:userId/profile (admin view)
  VIEW_LOGS: "user.view_logs", // GET /:userId/logs (today notifications)
  VIEW_LAST_SEEN: "user.view_last_seen", // GET /:userId/last-seen (monthly activity)
  CREATE: "user.create", // POST /users
  UPDATE: "user.update", // PUT /:userId , PATCH /:userId (status), staff-extra
  MANAGE_ROLES: "user.manage_roles", // PUT /:userId/roles
  MANAGE_RESTRICTED_COUNTRIES: "user.manage_restricted_countries", // GET|POST /:userId/restricted-countries
  MANAGE_AUTO_ASSIGNMENTS: "user.manage_auto_assignments", // GET|PUT /:userId/auto-assignments
  SET_MAX_LEADS: "user.set_max_leads", // PUT /max-leads/:userId , /max-leads-per-day/:userId
  MANAGE_STAFF_EXTRA: "user.manage_staff_extra", // PATCH /:userId/staff-extra
};

// Notifications — own notifications only (BE self-scopes to the caller).
export const NOTIFICATION_PERMISSIONS = {
  LIST: "notification.list", // GET own notifications (paginated, all + unread)
  MARK_READ: "notification.mark_read", // POST /v2/notifications/actions/mark-read (own latest)
};

// Utilities — cross-cutting helper reads (fixed-data, user-logs, role/admin pick-lists,
// image-session model pick-lists, global search). See §5c: model pick-list names changed.
export const UTILITY_PERMISSIONS = {
  FIXED_DATA_LIST: "utility.fixed_data.list", // GET /fixed-data
  USER_LOG_VIEW: "utility.user_log.view", // GET /user-logs (self-scoped — no userId param)
  USER_LOG_SUBMIT: "utility.user_log.submit", // POST /user-logs
  USER_ROLE_VIEW: "utility.user_role.view", // GET /users/role/:userId , GET /roles
  ADMIN_LIST: "utility.admin.list", // GET /users/admins
  IMAGE_LIST: "utility.image.list", // GET /images
  MODEL_READ: "utility.model.read", // GET / (image-session model) , GET /ids (model ids)
  SEARCH: "utility.search", // GET /utilities/search
};

// Dashboard — a single read code; the BE scopes each of the 9 aggregations per request.
export const DASHBOARD_PERMISSIONS = {
  VIEW: "dashboard.view",
};

// Questions (lead-scoped session questions + global question-type config).
export const QUESTION_PERMISSIONS = {
  CONFIG_VIEW: "question.config.view", // GET question-types (+ default seeding) — global config
  SESSION_VIEW: "question.session.view", // GET session-questions / versa (lead-scoped reads)
  ANSWER_SUBMIT: "question.answer.submit", // POST answer / answer/bulk (lead-scoped writes)
  CUSTOM_CREATE: "question.custom.create", // POST custom-question (lead-scoped write)
  VERSA_MANAGE: "question.versa.manage", // POST versa, PUT versa step (lead-scoped writes)
};

// Sales-stages (lead-scoped stage advance/rollback).
export const SALES_STAGE_PERMISSIONS = {
  VIEW: "sales_stage.view", // GET stages for a lead (lead-scoped read)
  MANAGE: "sales_stage.manage", // advance / roll back a lead's sales stage (lead-scoped write)
};

// Admin/staff residual (the ADMIN-tier residual sweep: reports, admin leads, commissions,
// fixed-data writes, admin-projects aggregation, model-archive). 🔒 pdfkit reports frozen.
export const ADMIN_RESIDUAL_PERMISSIONS = {
  REPORT_GENERATE: "admin_residual.report.generate", // POST /reports/lead-report(/excel|/pdf), /reports/staff-report(/excel|/pdf)
  LEAD_IMPORT: "admin_residual.lead.import", // POST /leads/excel (bulk import)
  LEAD_CREATE: "admin_residual.lead.create", // POST /new-lead
  LEAD_EDIT: "admin_residual.lead.edit", // POST /leads/update/:id
  LEAD_DELETE: "admin_residual.lead.delete", // DELETE /client-leads/:id (base-role ADMIN only — BE gate)
  CLIENT_EDIT: "admin_residual.client.edit", // PUT /client/update/:clientId (client-keyed)
  TELEGRAM_MANAGE: "admin_residual.telegram.manage", // POST /client-leads/:leadId/telegram/new , /assign-users
  FIXED_DATA_MANAGE: "admin_residual.fixed_data.manage", // POST/PUT/DELETE /fixed-data
  COMMISSION_VIEW: "admin_residual.commission.view", // GET /commissions
  COMMISSION_MANAGE: "admin_residual.commission.manage", // POST /commissions , PUT /commissions/:id
  PROJECT_VIEW: "admin_residual.project.view", // GET /projects (leads-with-projects aggregation)
  PROJECT_GROUP_CREATE: "admin_residual.project.group_create", // POST /projects/create-group
  MODEL_ARCHIVE: "admin_residual.model.archive", // PATCH /model/archived/:id
};

// Staff residual (the one staff-tier residual read).
export const STAFF_PERMISSIONS = {
  LATEST_CALLS_VIEW: "staff.latest_calls.view", // GET /dashboard/latest-calls
};

export const PERMISSIONS = {
  AUTH: AUTH_PERMISSIONS,
  CHAT: CHAT_PERMISSIONS,
  TELEGRAM: TELEGRAM_PERMISSIONS,
  UPLOAD: UPLOAD_PERMISSIONS,
  SITE_UTILITY: SITE_UTILITY_PERMISSIONS,
  LEAD: LEAD_PERMISSIONS,
  PROJECT: PROJECT_PERMISSIONS,
  TASK: TASK_PERMISSIONS,
  UPDATE: UPDATE_PERMISSIONS,
  DELIVERY: DELIVERY_PERMISSIONS,
  ACCOUNTING: ACCOUNTING_PERMISSIONS,
  CALENDAR: CALENDAR_PERMISSIONS,
  CONTRACT: CONTRACT_PERMISSIONS,
  IMAGE_SESSION: IMAGE_SESSION_PERMISSIONS,
  USER: USER_PERMISSIONS,
  NOTIFICATION: NOTIFICATION_PERMISSIONS,
  UTILITY: UTILITY_PERMISSIONS,
  DASHBOARD: DASHBOARD_PERMISSIONS,
  QUESTION: QUESTION_PERMISSIONS,
  SALES_STAGE: SALES_STAGE_PERMISSIONS,
  ADMIN_RESIDUAL: ADMIN_RESIDUAL_PERMISSIONS,
  STAFF: STAFF_PERMISSIONS,
};

export function splitPermissionCode(code) {
  const [module, ...rest] = String(code).split(".");
  return { module, action: rest.join(".") };
}

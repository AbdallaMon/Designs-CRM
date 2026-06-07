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
};

export function splitPermissionCode(code) {
  const [module, ...rest] = String(code).split(".");
  return { module, action: rest.join(".") };
}

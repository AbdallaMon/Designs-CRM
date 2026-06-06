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

export const PERMISSIONS = {
  AUTH: AUTH_PERMISSIONS,
  CHAT: CHAT_PERMISSIONS,
  TELEGRAM: TELEGRAM_PERMISSIONS,
  UPLOAD: UPLOAD_PERMISSIONS,
  SITE_UTILITY: SITE_UTILITY_PERMISSIONS,
};

export function splitPermissionCode(code) {
  const [module, ...rest] = String(code).split(".");
  return { module, action: rest.join(".") };
}

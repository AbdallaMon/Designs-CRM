// Permission codes — SINGLE SOURCE OF TRUTH (dot.case strings, e.g.
// "chat.room.view"). Authorization = authentication + permission code
// (`requirePermissions`) + object-scope checker + status/workflow guard.
// Never authorize on role alone; never use wildcard permissions.
//
// CONVENTION (read before adding codes)
// ─────────────────────────────────────────────────────────────────────────────
//  - Codes are `dot.case`: `<module>.<sub>.<action>` (lowercase). One code per
//    DISTINCT action. Reads (`view`, `list`) are ALWAYS separate from writes.
//  - Group every module's codes in its own `*_PERMISSIONS` object whose KEYS are
//    SCREAMING_SNAKE_CASE and whose VALUES are the dot.case string.
//  - Register the group under the nested `PERMISSIONS.<DOMAIN>` aggregate below.
//    App code (route gates, usecase checks, FE) ALWAYS references the nested
//    constant `PERMISSIONS.<DOMAIN>.<ACTION>` — never the raw string.
//  - A MIGRATING MODULE appends its own `*_PERMISSIONS` object + a `PERMISSIONS`
//    entry here, then grants the codes in `ROLE_PERMISSIONS`
//    (./role-permissions.js). It does NOT touch already-defined groups.
//  - Only seed codes for modules that EXIST TODAY. Do not invent codes for
//    unmigrated modules — they arrive with their own migration.
//
// Seeded modules (Stage 3): auth, chat, leads/booking-lead, telegram, upload.
// ─────────────────────────────────────────────────────────────────────────────

// ── auth ─────────────────────────────────────────────────────────────────────
// Self-service identity actions every authenticated user holds. (login / reset /
// refresh are PUBLIC or token-based — no permission code; they are never gated by
// `requirePermissions`.)
export const AUTH_PERMISSIONS = {
  ME: "auth.me", // GET /auth/me — read own session
  LOGOUT: "auth.logout", // POST /auth/logout — clear own session
};

// ── chat ─────────────────────────────────────────────────────────────────────
// Today every authenticated user can use chat (router only mounts requireAuth).
// Object-level visibility (which room) is enforced by the scope checker, not the
// code. Codes are split read vs write so future role tuning is possible without a
// schema change.
export const CHAT_PERMISSIONS = {
  ROOM_LIST: "chat.room.list", // list my rooms
  ROOM_VIEW: "chat.room.view", // view a single room (scope-checked)
  ROOM_CREATE: "chat.room.create", // create room / direct / lead room
  ROOM_EDIT: "chat.room.edit", // update room + settings, regenerate token
  ROOM_DELETE: "chat.room.delete", // delete room
  MEMBER_MANAGE: "chat.member.manage", // add / remove members, change roles, manage client
  MESSAGE_VIEW: "chat.message.view", // read messages, pages, pinned, files
  MESSAGE_SEND: "chat.message.send", // mark read, react (write-side message actions)
};

// ── leads / booking-lead ──────────────────────────────────────────────────────
// The booking-lead flow is PUBLIC (no auth, no permission code) — a prospective
// client fills it in. Intentionally NO codes here: gating it would break the
// public funnel. The staff-side `leads/lead` module (a future migration) will own
// the authenticated lead-management codes.

// ── telegram ──────────────────────────────────────────────────────────────────
// Today the telegram userbot routes are ADMIN-only (`requireRole(["ADMIN"])`).
// Encoded as a single management code granted only to ADMIN in ROLE_PERMISSIONS,
// preserving observable behavior.
export const TELEGRAM_PERMISSIONS = {
  MANAGE: "telegram.manage", // view current auth + run the login flow
};

// ── upload (files) ─────────────────────────────────────────────────────────────
// Authed upload endpoints (`/files/single`, `/files/chunks`) are available to any
// authenticated user today. The client endpoints (`/files/client/*`) are PUBLIC
// and stay ungated — no code.
export const UPLOAD_PERMISSIONS = {
  FILE_UPLOAD: "upload.file.upload",
};

// ── nested aggregate (canonical reference for app code) ───────────────────────
export const PERMISSIONS = {
  AUTH: AUTH_PERMISSIONS,
  CHAT: CHAT_PERMISSIONS,
  TELEGRAM: TELEGRAM_PERMISSIONS,
  UPLOAD: UPLOAD_PERMISSIONS,
};

/**
 * Split a dot.case code into its module + action parts.
 * `splitPermissionCode("chat.room.view")` → `{ module: "chat", action: "room.view" }`.
 * @param {string} code
 * @returns {{ module: string, action: string }}
 */
export function splitPermissionCode(code) {
  const [module, ...rest] = String(code).split(".");
  return { module, action: rest.join(".") };
}

/** Flat list of every defined permission code (for validation / tests). */
export const ALL_PERMISSIONS = Object.freeze(
  Object.values(PERMISSIONS).flatMap((group) => Object.values(group)),
);

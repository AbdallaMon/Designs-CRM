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
// Seeded modules (Stage 3): auth, chat, leads/booking-lead, telegram, upload,
// site-utility, courses, leads/lead.
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

// ── site-utility (PDF config + contract payment conditions) ────────────────────
// SECURITY FIX (migration): the legacy `/site-utilities` routes were only behind
// the SHARED authentication middleware — ANY authenticated role could read/mutate
// the PDF config and contract payment conditions. The FE pages are @admin /
// @super_admin only, so the v2 module gates these codes and ROLE_PERMISSIONS grants
// them to ADMIN + SUPER_ADMIN only. Reads and writes are split per convention.
export const SITE_UTILITY_PERMISSIONS = {
  PDF_CONFIG_VIEW: "site_utility.pdf_config.view", // GET /pdf-utility
  PDF_CONFIG_EDIT: "site_utility.pdf_config.edit", // POST /pdf-utility (upsert)
  PAYMENT_CONDITION_LIST: "site_utility.payment_condition.list", // GET /contract-payment-conditions
  PAYMENT_CONDITION_CREATE: "site_utility.payment_condition.create", // POST
  PAYMENT_CONDITION_EDIT: "site_utility.payment_condition.edit", // PUT /:id
  PAYMENT_CONDITION_DELETE: "site_utility.payment_condition.delete", // DELETE /:id
};

// ── leads / lead (authenticated lead-management surface) ───────────────────────
// Legacy: `routes/shared/client-leads.js` mounted at `/shared/client-leads`, behind
// the SHARED authentication middleware only — i.e. ANY authenticated role could hit
// every route. Object scope was enforced ad-hoc per-handler (sales saw only their
// `userId`-assigned leads; ADMIN/SUPER_ADMIN/ACCOUNTANT/isSuperSales saw all) and the
// `/:id/...` sub-resource routes (calls, meetings, price-offers, payments, files,
// notes) had NO scope check at all → IDOR. The v2 module encodes the same who-can-do-
// what as codes (granted to every role via LEAD_AUTHED below, preserving the "any
// authed role" surface) and adds the missing object-scope checkers (the IDOR fix).
// Privileged-only actions (assign-to-another-user, bulk-convert, convert, admin field
// edit) are gated by an additional ADMIN-tier code (LEAD_ADMIN). Reads/writes split.
export const LEAD_PERMISSIONS = {
  LIST: "lead.list", // GET / , /deals , /columns , /calls , /meetings
  VIEW: "lead.view", // GET /:id and its scoped sub-resource reads
  ASSIGN_SELF: "lead.assign.self", // PUT / (a sales user claims a lead for themselves)
  ASSIGN_OTHER: "lead.assign.other", // PUT / for another user, /bulk-convert (admin-tier)
  CONVERT: "lead.convert", // PUT /convert (move to converted list)
  EDIT: "lead.edit", // PUT /update/:id , /lead/update/:id (field edit)
  CHANGE_STATUS: "lead.change_status", // POST /:id/actions/* (status / price)
  CALL_MANAGE: "lead.call.manage", // create / update call reminders
  MEETING_MANAGE: "lead.meeting.manage", // create / update meeting reminders
  PRICE_OFFER_MANAGE: "lead.price_offer.manage", // create price offer, change its status
  PAYMENT_MANAGE: "lead.payment.manage", // add payments / extra-service payments
  FILE_MANAGE: "lead.file.manage", // upload a file to a lead
  NOTE_MANAGE: "lead.note.manage", // add a note to a lead
  REMINDER_SEND: "lead.reminder.send", // payment-reminder / complete-register triggers
  COUNTRY_CHECK: "lead.country.check", // POST /:userId/countries (allowed-to-take check)
};

// ── courses / LMS — admin-course (management surface) ───────────────────────────
// Legacy: `routes/courses/adminCourses.js` mounted at `/admin/courses`, guarded by
// `verifyTokenAndHandleAuthorization(..., "ADMIN")` — i.e. ADMIN / SUPER_ADMIN (and
// `isSuperSales`, and ADMIN/SUPER_ADMIN sub-roles). These codes encode the same
// privileged management surface (course/lesson/test/question CRUD, lesson access
// grants, attempt admin actions, answer approval, admin dashboard). Granted to
// ADMIN + SUPER_ADMIN in ROLE_PERMISSIONS, plus `isSuperSales` via
// SUPER_SALES_EXTRA_PERMISSIONS — preserving observable behavior. Reads/writes split.
export const COURSE_PERMISSIONS = {
  // course / lesson / content / test management (reads)
  VIEW: "course.view", // list courses, dashboard, course detail reads
  // course / lesson / content / test management (writes)
  MANAGE: "course.manage", // create/edit course, lessons, videos, pdfs, links, tests, questions
  // lesson access grants (who may access a lesson)
  ACCESS_MANAGE: "course.access.manage", // grant/revoke LessonAccess, view allowed users/roles
  // per-user attempt administration + manual answer approval
  ATTEMPT_MANAGE: "course.attempt.manage", // increase/decrease attempts, approve answers, attempt summaries
};

// ── courses / LMS — staff-course (consumption surface) ──────────────────────────
// Legacy: `routes/courses/staffCourses.js` mounted at `/shared/courses`, guarded by
// `verifyTokenAndHandleAuthorization(..., "SHARED")` — i.e. ANY authenticated role.
// These codes encode course-taking (browse published courses by role, view lessons,
// mark complete, submit homework, take tests, view OWN attempts/progress). Granted
// to every role via SHARED_AUTHED in ROLE_PERMISSIONS. Object-level access (which
// course/lesson/attempt) is enforced by the course-role gate + the attempt scope
// checker, not by the code. Reads/writes split.
export const STAFF_COURSE_PERMISSIONS = {
  VIEW: "staff_course.view", // browse courses/lessons/tests, dashboard, progress, own attempts
  TAKE: "staff_course.take", // mark lesson complete, submit homework, create attempt, submit answer, end attempt
};

// ── nested aggregate (canonical reference for app code) ───────────────────────
export const PERMISSIONS = {
  AUTH: AUTH_PERMISSIONS,
  CHAT: CHAT_PERMISSIONS,
  TELEGRAM: TELEGRAM_PERMISSIONS,
  UPLOAD: UPLOAD_PERMISSIONS,
  SITE_UTILITY: SITE_UTILITY_PERMISSIONS,
  COURSE: COURSE_PERMISSIONS,
  STAFF_COURSE: STAFF_COURSE_PERMISSIONS,
  LEAD: LEAD_PERMISSIONS,
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

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
// site-utility, courses, leads/lead, users/user, projects (project/task/update/
// delivery).
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

// ── users / user (directory + admin user-management + self-profile) ─────────────
// Legacy surfaces (three different gates — verified against
// `verifyTokenAndHandleAuthorization`):
//   1. User MANAGEMENT (`routes/admin/admin.js`, mounted at `/admin`, gate "ADMIN"):
//      admits role ADMIN/SUPER_ADMIN OR `isSuperSales` OR a subRole of ADMIN/
//      SUPER_ADMIN. The management codes below are granted to ADMIN/SUPER_ADMIN base
//      + `isSuperSales` (via SUPER_SALES_EXTRA_PERMISSIONS); sub-roles are unioned
//      automatically by getEffectivePermissions — so the effective set matches the
//      legacy `isAdmin` union exactly, without widening any other base role.
//   2. DIRECTORY pick-lists (`/shared/all-chat-users`, `/shared/all-related-chat-users`,
//      gate "SHARED"): ANY authenticated role. Encoded as DIRECTORY, granted to all
//      authed roles (preserves the broad surface the chat module needs).
//   3. Self PROFILE (`/shared/users/:userId/profile`, gate "SHARED"): ANY authed role,
//      but legacy applied NO ownership check → an IDOR + privilege-escalation hole
//      (any user could read another's full row incl. password hash, or PUT arbitrary
//      fields — role/isActive/password — on any userId). v2 keeps the codes broad
//      (PROFILE_VIEW/PROFILE_EDIT for all authed roles) but adds throwing object-scope
//      checkers (self OR admin-tier) — the IDOR fix. Reads/writes split per convention.
export const USER_PERMISSIONS = {
  // directory — broad authed pick-list (chat / assignment dropdowns)
  DIRECTORY: "user.directory", // GET /directory , /related-chat-directory

  // self-profile (object-scope checked: self OR admin-tier)
  PROFILE_VIEW: "user.profile.view", // GET /:userId/profile
  PROFILE_EDIT: "user.profile.edit", // PUT /:userId/profile

  // admin user-management (reads)
  LIST: "user.list", // GET /users , /all-users , /:userId/profile (admin view)
  VIEW_LOGS: "user.view_logs", // GET /:userId/logs (today notifications)
  VIEW_LAST_SEEN: "user.view_last_seen", // GET /:userId/last-seen (monthly activity)
  // admin user-management (writes)
  CREATE: "user.create", // POST /users
  UPDATE: "user.update", // PUT /:userId , PATCH /:userId (status), staff-extra
  MANAGE_ROLES: "user.manage_roles", // PUT /:userId/roles
  MANAGE_RESTRICTED_COUNTRIES: "user.manage_restricted_countries", // GET|POST /:userId/restricted-countries
  MANAGE_AUTO_ASSIGNMENTS: "user.manage_auto_assignments", // GET|PUT /:userId/auto-assignments
  SET_MAX_LEADS: "user.set_max_leads", // PUT /max-leads/:userId , /max-leads-per-day/:userId
  MANAGE_STAFF_EXTRA: "user.manage_staff_extra", // PATCH /:userId/staff-extra
};

// ── projects domain (project / task / update / delivery) ────────────────────────
// Legacy: `routes/shared/{projects,tasks,updates,delivery}.js` mounted under
// `/shared/{projects,tasks,updates,delivery}`, behind the SHARED authentication
// middleware only — i.e. ANY of the 9 authed roles could hit every route. Object
// scope was enforced ad-hoc per-handler (designers/executors/staff saw only projects
// they were ASSIGNED to via `assignments.some.userId`; ADMIN/SUPER_ADMIN — and
// ACCOUNTANT for the designer detail read — saw all). The object-scoped `/:id/...`
// sub-resource routes (assign-designer, status, groups, task/update/delivery by id)
// had NO consistent scope check → IDOR. The v2 module encodes the same who-can-do-what
// as codes (granted to every authed role via PROJECT_AUTHED in ROLE_PERMISSIONS,
// preserving the "any authed role" surface) and adds the missing object-scope checkers
// (checkIfUserCanAccessProject / checkIfUserCanMutateProject — the IDOR fix). The
// genuinely admin-tier management actions (assign/unassign a designer, change a
// project's board status) are gated by an additional ADMIN-tier code (PROJECT_MANAGE),
// granted to ADMIN/SUPER_ADMIN base + isSuperSales — matching legacy `isAdmin`.
// Reads/writes split per convention.
export const PROJECT_PERMISSIONS = {
  LIST: "project.list", // GET / , /designers , /designers/columns , /archived , /user-profile/:userId , /:leadId/groups
  VIEW: "project.view", // GET /:id , /designers/:id (object-scoped reads)
  EDIT: "project.edit", // PUT /:id (plain field edit)
  MANAGE: "project.manage", // assign-designer, change board status (admin-tier management)
};

export const TASK_PERMISSIONS = {
  LIST: "task.list", // GET / , GET /notes
  VIEW: "task.view", // GET /:id (object-scoped via parent project)
  CREATE: "task.create", // POST / (task / modification)
  EDIT: "task.edit", // PUT /:taskId
  DELETE: "task.delete", // DELETE /:id (generic delete; task is project-scoped)
  NOTE_MANAGE: "task.note.manage", // POST /notes
};

export const UPDATE_PERMISSIONS = {
  LIST: "update.list", // GET /:clientLeadId , GET /shared-settings/:updateId
  CREATE: "update.create", // POST /:clientLeadId
  AUTHORIZE: "update.authorize", // authorize / unauthorize a department on an update
  ARCHIVE: "update.archive", // archive / unarchive an update or shared update
  MARK_DONE: "update.mark_done", // mark an update as done
};

export const DELIVERY_PERMISSIONS = {
  LIST: "delivery.list", // GET /:projectId/schedules
  CREATE: "delivery.create", // POST /
  LINK_MEETING: "delivery.link_meeting", // link a delivery schedule to a meeting reminder
  DELETE: "delivery.delete", // DELETE /:deliveryId
};

// ── accounting (payments / expenses / rents / salaries / outcome / summary) ─────
// Legacy: `routes/accountant/accountant.js` mounted at `/accountant`, guarded by
// `verifyTokenAndHandleAuthorization(..., "ACCOUNTANT")`. VERIFIED: that gate, with
// the role param "ACCOUNTANT" (not "ADMIN"), falls through to the
// `decoded.role !== role` branch — so ONLY a user whose base role is ACCOUNTANT
// passes. The `isAdmin` early-return fires only when the gate's role param is
// "ADMIN"; ADMIN / SUPER_ADMIN / isSuperSales do NOT pass the accountant gate today.
// To PRESERVE observable behavior 1:1, these codes are granted to the ACCOUNTANT role
// ONLY in ROLE_PERMISSIONS (no ADMIN/SUPER_ADMIN/isSuperSales grant — widening that
// surface would be a behavior change requiring an explicit decision).
//
// These are GLOBAL financial records (the accountant operates on all payments /
// salaries / rents / expenses), so there is no per-owner object scope in legacy; the
// permission code IS the gate. The state-changing money operations (pay, mark-overdue,
// change-level, monthly-salary pay) carry distinct write codes and strict Zod money
// validation. Reads/writes split per convention.
export const ACCOUNTING_PERMISSIONS = {
  // payments
  PAYMENT_LIST: "accounting.payment.list", // GET /payments , GET /payments/:id/invoices
  PAYMENT_PROCESS: "accounting.payment.process", // POST /payments/:id/actions/pay
  PAYMENT_MARK_OVERDUE: "accounting.payment.mark_overdue", // POST /payments/:id/actions/mark-overdue
  PAYMENT_CHANGE_LEVEL: "accounting.payment.change_level", // POST /payments/:id/actions/change-status
  // notes
  NOTE_LIST: "accounting.note.list", // GET /notes
  NOTE_CREATE: "accounting.note.create", // POST /notes
  // operational expenses
  EXPENSE_LIST: "accounting.expense.list", // GET /operational-expenses
  EXPENSE_CREATE: "accounting.expense.create", // POST /operational-expenses
  // rents
  RENT_LIST: "accounting.rent.list", // GET /rents
  RENT_CREATE: "accounting.rent.create", // POST /rents
  RENT_RENEW: "accounting.rent.renew", // PUT /rents/:rentId (renew + outcome)
  // outcome / summary
  OUTCOME_LIST: "accounting.outcome.list", // GET /outcome
  SUMMARY_VIEW: "accounting.summary.view", // GET /summary
  // accountant-scoped user helper lists (for salaries)
  USER_LIST: "accounting.user.list", // GET /users
  USER_LAST_SEEN: "accounting.user.last_seen", // GET /users/:userId/last-seen
  // salaries
  SALARY_VIEW: "accounting.salary.view", // GET /salaries/data
  SALARY_CREATE: "accounting.salary.create", // POST /salaries/:userId
  SALARY_EDIT: "accounting.salary.edit", // PUT /salaries/:id
  SALARY_PAY: "accounting.salary.pay", // POST /salaries/monthly/pay
};

// ── calendar (staff availability/slots + meeting/call month-views + Google sync) ──
// Legacy: `routes/calendar/calendar.js` mounted TWICE in `routes/shared/index.js`
// (`/shared/calendar` AND `/shared/calendar-management` — the SAME router) and behind
// the SHARED router-level authentication middleware (any of the 9 authed roles). The
// calendar.js routes themselves declared NO per-route gate; they call `getCurrentUser`
// directly. The `google.js` OAuth router is a SUB-ROUTER of calendar.js at `/google`, so
// it inherits the same SHARED gate. VERIFIED against `verifyTokenAndHandleAuthorization`:
// the "SHARED" gate admits ADMIN/SUPER_ADMIN/STAFF/THREE_D_DESIGNER/TWO_D_DESIGNER/
// ACCOUNTANT/TWO_D_EXECUTOR/SUPER_SALES/CONTACT_INITIATOR (i.e. every authed role) — the
// isAdmin early-return fires only when the gate PARAM is "ADMIN", which it is not here. To
// preserve observable behavior 1:1, these codes are granted to EVERY authed role via
// CALENDAR_AUTHED in ROLE_PERMISSIONS.
//
// SCOPE NOTE: legacy calendar availability rows (AvailableDay/AvailableSlot) and the
// meeting/call month-views have NO per-owner object scope — any authed user could read or
// mutate any `adminId`'s availability by passing the id as a query param, and the
// month-view applies a role-derived `userId` filter INSIDE the service (admins see all,
// others see their own). There is therefore no per-record owner to scope-check; the
// permission CODE is the gate (matching legacy exactly). Widening or NARROWING that surface
// would be a behavior change. The Google-connect/disconnect/status actions act on the
// CALLER's own user id (req.auth.id) only — they are inherently self-scoped. Reads/writes
// split per convention.
//
// The PUBLIC client booking surface (`routes/calendar/client-calendar.js`, mounted at
// `/client/calendar`) has NO auth/gate (token-based via a MeetingReminder.token) — it gets
// NO permission code and stays PUBLIC, exactly like the booking funnel and `/files/client/*`.
export const CALENDAR_PERMISSIONS = {
  // availability + month-views (reads)
  VIEW: "calendar.view", // GET available-days, slots, dates/month, dates/day
  // availability (writes)
  MANAGE: "calendar.manage", // POST available-days(/multiple), DELETE days/:id, slots/:id
  // Google Calendar integration (self-scoped to the caller)
  GOOGLE_VIEW: "calendar.google.view", // GET google/connect (auth URL), google/status
  GOOGLE_MANAGE: "calendar.google.manage", // POST google/connect, POST google/disconnect
};

// ── notifications ──────────────────────────────────────────────────────────────
// Legacy surfaces (verified against the mounts in `server/src/app.js` +
// `verifyTokenAndHandleAuthorization`):
//   1. `/utility/notification/unread` (GET) and `/utility/notification/users/:userId`
//      (POST) — mounted at `/utility` with NO router-level auth → UNAUTHENTICATED today.
//      Worse, the read filtered notifications by a CLIENT-SUPPLIED `userId` query param
//      (`getNotifications` does `where.userId = Number(searchParams.userId)`), and the
//      mark-read trusted the `:userId` PATH param → a textbook IDOR: any caller could
//      read or mark-read ANY user's notifications. The v2 module GATES these with
//      authentication + a NOTIFICATION code AND derives the target user from
//      `req.auth.id` only (never from the query/body/param) — the IDOR fix.
//   2. `/shared/utilities/notifications` (GET, paginated all-notifications) — behind the
//      SHARED gate (every authed role).
// Every authenticated user has their OWN notifications, so all the codes below are
// granted to every authed role via NOTIFICATION_AUTHED; self-scope (not the code) is
// what prevents cross-user access. Reads/writes split per convention.
export const NOTIFICATION_PERMISSIONS = {
  LIST: "notification.list", // GET own notifications (paginated, all + unread)
  MARK_READ: "notification.mark_read", // POST mark own latest notifications as read
};

// ── utilities (lookup / helper reads behind the SHARED gate) ─────────────────────
// Legacy: `routes/shared/utilities.js` mounted at `/shared/utilities`, behind the
// SHARED authentication middleware (VERIFIED: the "SHARED" gate admits every one of the
// 9 authed roles; the isAdmin early-return fires only for the "ADMIN" gate PARAM). These
// are generic lookup/pick-list reads (fixed-data, user logs, admins/roles directory,
// image lookups, generic model reads) the FE uses across many screens. Plus
// `/utility/search` (mounted at `/utility`, authed via `verifyTokenUsingReq` → any
// logged-in user). To preserve the broad authed surface 1:1, all codes are granted to
// every authed role via UTILITY_AUTHED.
//
// OVERLAP NOTE: `user-logs`, `users/admins`, `users/role/:userId`, `roles` overlap the
// users module — but the users module exposes its equivalents under ADMIN-TIER codes
// (USER.VIEW_LOGS, USER.LIST), whereas legacy served these to EVERY authed role via the
// SHARED gate. Reusing the users codes would NARROW the surface (a behavior change), so
// these are migrated here under the broad UTILITY codes to preserve observable behavior.
//
// HARDENING NOTE: the generic-model reads (`getImageSesssionModel` for `/` and
// `getModelIds` for `/ids`) did an OPEN `prisma[model].findMany()` with NO allow-list —
// any client `model` query value could read any table. The v2 module adds a model
// allow-list (UTILITY_MODEL_ALLOWLIST below) and rejects non-whitelisted models.
export const UTILITY_PERMISSIONS = {
  FIXED_DATA_LIST: "utility.fixed_data.list", // GET /fixed-data
  USER_LOG_VIEW: "utility.user_log.view", // GET /user-logs
  USER_LOG_SUBMIT: "utility.user_log.submit", // POST /user-logs
  USER_ROLE_VIEW: "utility.user_role.view", // GET /users/role/:userId , GET /roles
  ADMIN_LIST: "utility.admin.list", // GET /users/admins
  IMAGE_LIST: "utility.image.list", // GET /images
  MODEL_READ: "utility.model.read", // GET / (image-session model) , GET /ids (model ids)
  SEARCH: "utility.search", // GET /utility/search → /v2/utilities/search
};

// Allow-list of model names the generic-model reads (`/` and `/ids`) may touch. Legacy
// allowed ANY `prisma[model]` (open mass-read); these are the lookup/reference tables the
// FE actually reads through this surface (image-session reference data + the pick-list
// model-id helper). A request for a model NOT in this set is rejected (the hardening).
//
// CORRECTNESS (FIX 3): each entry MUST be a REAL Prisma client delegate (the client
// lowercases the model's first letter, e.g. model `DesignImage` → `prisma.designImage`).
// The previous list contained `image`, `pattern`, `color`, `imageSession` which are NOT
// valid delegates — they would 500 on access. Cross-checked against
// `packages/db/prisma/schema.prisma`:
//   model DesignImage  → designImage   (was the bogus `image`)
//   model ColorPattern → colorPattern  (was the bogus `pattern`/`color`)
//   model Space        → space
//   model Material     → material
//   model Style        → style
//   model FixedData    → fixedData
// Client-scoped models (User, ClientLead, ClientImageSession, Payment, Contract, …) are
// deliberately EXCLUDED — these reads serve generic pick-lists, not confidential data.
export const UTILITY_MODEL_ALLOWLIST = Object.freeze([
  "designImage",
  "colorPattern",
  "space",
  "material",
  "style",
  "fixedData",
]);

// Per-model SAFE projection for the pick-list reads (FIX 2). The legacy `getModelIds`
// spread client-supplied `where`/`select`/`include` straight into `findMany`, letting a
// caller traverse relations or read arbitrary columns. v2 ignores all client projection
// inputs and applies ONLY this fixed minimal `select` (id + the model's label field). For
// the title-relation models (ColorPattern/Space/Material/Style) the label is the related
// `TextShort` rows ({ id, text }); FixedData has a scalar `title`; DesignImage has no
// title, so its label proxy is `imageUrl`. No `include`, no client columns, ever.
export const UTILITY_MODEL_PROJECTIONS = Object.freeze({
  designImage: { id: true, imageUrl: true },
  colorPattern: { id: true, title: { select: { id: true, text: true } } },
  space: { id: true, title: { select: { id: true, text: true } } },
  material: { id: true, title: { select: { id: true, text: true } } },
  style: { id: true, title: { select: { id: true, text: true } } },
  fixedData: { id: true, title: true },
});

// ── dashboard (read-only analytics aggregations behind the SHARED gate) ──────────
// Legacy: `routes/shared/dashboard.js` mounted at `/shared/dashboard`, behind the
// SHARED authentication middleware (VERIFIED: the "SHARED" gate admits every one of the
// 9 authed roles; the isAdmin early-return fires only for the "ADMIN" gate PARAM). All 9
// read-only GET aggregations (key-metrics, leads-status, monthly-performance, emirates-
// analytics, leads-monthly-overview, week-performance, latest-leads, recent-activities,
// designer-metrics) were served to EVERY authed role with no per-endpoint role split —
// the only differentiation was the per-request data SCOPE (legacy keyed it off a client-
// supplied `staffId`/`userId` query param). There is therefore a SINGLE view code,
// granted to every authed role via SHARED_AUTHED; the data boundary is enforced per
// endpoint in the usecase, NOT by a second code.
//
// SCOPE NOTE (the IDOR-class fix): legacy trusted `searchParams.staffId` (and, on
// recent-activities, `searchParams.userId`) to select WHOSE metrics to read — so any
// scoped role (sales/designer/executor) could pass `?staffId=<other>` and read another
// user's performance, and the un-scoped endpoints returned GLOBAL totals to everyone.
// v2 preserves the privileged behavior 1:1 for the admin-tier union (ADMIN/SUPER_ADMIN/
// isSuperSales): they may still pass a `staffId` to scope to anyone, or omit it for the
// global aggregate. For every OTHER role the scope identity is FORCED to req.auth.id —
// a non-privileged caller can only ever see their OWN metrics (matching the FE, which
// already sends the caller's own id for a self-view; the only thing closed is the
// cross-user read). The role used for this branch comes from req.auth (the token), never
// from a `?role=` query param.
export const DASHBOARD_PERMISSIONS = {
  VIEW: "dashboard.view", // GET all 9 dashboard read aggregations (scope enforced per request)
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
  USER: USER_PERMISSIONS,
  PROJECT: PROJECT_PERMISSIONS,
  TASK: TASK_PERMISSIONS,
  UPDATE: UPDATE_PERMISSIONS,
  DELIVERY: DELIVERY_PERMISSIONS,
  ACCOUNTING: ACCOUNTING_PERMISSIONS,
  CALENDAR: CALENDAR_PERMISSIONS,
  NOTIFICATION: NOTIFICATION_PERMISSIONS,
  UTILITY: UTILITY_PERMISSIONS,
  DASHBOARD: DASHBOARD_PERMISSIONS,
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

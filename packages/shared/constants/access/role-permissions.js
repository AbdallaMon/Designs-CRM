// Role → permission-code map. CODE-DEFINED (the Prisma schema is FROZEN and has
// NO permission tables — only `User.role`, `User.isSuperSales`, `User.subRoles`).
// Effective permissions are computed at request time from this static map (see
// `getEffectivePermissions` in ../../helpers.js).
//
// EFFECTIVE PERMISSIONS = base-role codes
//                       ∪ each sub-role's base-role codes (UserSubRole[])
//                       ∪ extra codes from `isSuperSales` (if set).
//
// CRITICAL — observable behavior must be preserved. Whatever a role can do TODAY,
// the codes here must grant the SAME roles the SAME access:
//   - Telegram routes are ADMIN-only today (requireRole(["ADMIN"]))  → only ADMIN
//     gets TELEGRAM.MANAGE.
//   - Chat + authed upload + auth.me/logout require ONLY authentication today
//     (any logged-in user) → every role gets those codes (via SHARED_AUTHED).
//   - Booking-lead is public → no codes (not gated).
//
// WHEN A MODULE MIGRATES: add its codes to the roles that can use it today. Do not
// widen access beyond the current behavior without an explicit decision.

import { PERMISSIONS } from "./permissions.constants.js";
import { USER_ROLES } from "./roles.constants.js";

const P = PERMISSIONS;

// Codes EVERY authenticated user holds today (auth self-service + chat + authed
// file upload). These modules gate on authentication alone in the current code,
// so all roles receive them to preserve behavior.
const SHARED_AUTHED = [
  P.AUTH.ME,
  P.AUTH.LOGOUT,
  P.CHAT.ROOM_LIST,
  P.CHAT.ROOM_VIEW,
  P.CHAT.ROOM_CREATE,
  P.CHAT.ROOM_EDIT,
  P.CHAT.ROOM_DELETE,
  P.CHAT.MEMBER_MANAGE,
  P.CHAT.MESSAGE_VIEW,
  P.CHAT.MESSAGE_SEND,
  P.UPLOAD.FILE_UPLOAD,
  // staff-course (course-taking) — legacy `/shared/courses` was behind SHARED
  // authentication (any logged-in role), so every role gets these. Object-level
  // course/lesson access is gated by the course-role match + the attempt scope
  // checker, not by the code.
  P.STAFF_COURSE.VIEW,
  P.STAFF_COURSE.TAKE,
  // users/user — directory pick-lists (legacy `/shared/all-chat-users`,
  // `/shared/all-related-chat-users`) sat behind SHARED authentication (any logged-in
  // role), so every role gets DIRECTORY. The chat module consumes this `/v2/users`
  // directory. Self-profile read/edit were ALSO behind SHARED auth (any authed role);
  // the codes stay broad but the v2 module's object-scope checkers (self OR admin-tier)
  // supply the row-level gate the legacy profile routes were MISSING (the IDOR fix).
  P.USER.DIRECTORY,
  P.USER.PROFILE_VIEW,
  P.USER.PROFILE_EDIT,
  // calendar — legacy `/shared/calendar` + `/shared/calendar-management` (the same
  // router, double-mounted) sat behind the SHARED authentication middleware (any
  // logged-in role), so every role gets the calendar codes. The Google sub-router
  // inherited the same SHARED gate; its actions act on the caller's own user id only
  // (self-scoped). Calendar availability rows have NO per-owner object scope in legacy
  // (the code IS the gate), so no object-scope checker is wired. The PUBLIC client
  // booking surface (`/client/calendar`, token-based) is ungated and gets NO code.
  P.CALENDAR.VIEW,
  P.CALENDAR.MANAGE,
  P.CALENDAR.GOOGLE_VIEW,
  P.CALENDAR.GOOGLE_MANAGE,
  // notifications — legacy `/utility/notification/*` was UNAUTHENTICATED and
  // `/shared/utilities/notifications` was behind SHARED auth (any authed role). Every
  // authenticated user owns notifications, so every role gets the notification codes;
  // the v2 module SELF-SCOPES every read/mark-read to req.auth.id (the IDOR fix) — the
  // code is the gate, self-scope is the row-level guarantee.
  P.NOTIFICATION.LIST,
  P.NOTIFICATION.MARK_READ,
  // utilities — legacy `/shared/utilities/*` (lookup/pick-list reads) sat behind the
  // SHARED gate (every authed role) and `/utility/search` was authed via
  // verifyTokenUsingReq (any logged-in user). To preserve that broad authed surface
  // 1:1, every role gets the utility codes. (These overlap the admin-tier users module
  // codes, but legacy served them to all authed roles — see permissions.constants.js.)
  P.UTILITY.FIXED_DATA_LIST,
  P.UTILITY.USER_LOG_VIEW,
  P.UTILITY.USER_LOG_SUBMIT,
  P.UTILITY.USER_ROLE_VIEW,
  P.UTILITY.ADMIN_LIST,
  P.UTILITY.IMAGE_LIST,
  P.UTILITY.MODEL_READ,
  P.UTILITY.SEARCH,
  // dashboard — legacy `/shared/dashboard/*` (9 read-only analytics aggregations) sat
  // behind the SHARED authentication middleware (any logged-in role), so every authed
  // role gets the single dashboard view code. There is NO per-endpoint role split in
  // legacy; the per-request data SCOPE is what differs and is enforced in the v2 usecase
  // (admin-tier may scope to any user / global; every other role is FORCED to req.auth.id
  // — the IDOR-class fix). The code is the gate, auth-scope is the row-level guarantee.
  P.DASHBOARD.VIEW,
  // questions — legacy `/shared/questions/*` (SPIN session questions/answers + VERSA
  // objection handling) sat behind the SHARED authentication middleware (any logged-in
  // role), so every authed role gets the question codes. Global config reads (question
  // types) are gated by the code alone; the lead-scoped reads/writes (session questions,
  // answers, custom questions, VERSA) additionally pass through the leads-module
  // object-scope checker in the v2 usecase (the IDOR fix the legacy routes were MISSING).
  P.QUESTION.CONFIG_VIEW,
  P.QUESTION.SESSION_VIEW,
  P.QUESTION.ANSWER_SUBMIT,
  P.QUESTION.CUSTOM_CREATE,
  P.QUESTION.VERSA_MANAGE,
  // sales-stages — legacy `/shared/sales-stages/*` sat behind the SHARED authentication
  // middleware (any logged-in role), so every authed role gets the sales-stage codes.
  // SalesStage rows are lead-scoped; the v2 module reuses the leads-module object-scope
  // checker on the parent lead (the IDOR fix). The code is the gate, lead-scope is the
  // row-level guarantee.
  P.SALES_STAGE.VIEW,
  P.SALES_STAGE.MANAGE,
  // reviews — legacy `/shared/reviews/*` (a thin Google Business Profile OAuth review
  // integration) sat behind the SHARED authentication middleware (any logged-in role),
  // so every authed role gets the review codes. The OAuth token flow is behavior-frozen
  // and owned by the legacy service; the v2 module never returns/logs tokens.
  P.REVIEW.VIEW,
  P.REVIEW.CONNECT,
  // contracts — legacy `/shared/contracts/*` (the authed staff/admin contract CRUD
  // surface: contracts, stages, payments, drawings, special items + the role-scoped
  // grouped payments list) sat behind the SHARED authentication middleware (any logged-in
  // role), so every authed role gets the contract codes. Contracts are lead-scoped; the
  // v2 module resolves the parent clientLead and runs the leads-module object-scope checker
  // (reads access-scope, writes mutate-scope) before any read/write — the IDOR fix the
  // legacy routes were MISSING. The code is the gate, lead-scope is the row-level guarantee.
  // The grouped payments list keeps its frozen-service internal role-scope (admin-tier see
  // all; others scoped to their own leads). The PUBLIC client e-sign surface
  // (`/client/contracts`, token-based) is ungated and gets NO code. 🔒 PDF generation is
  // wrapped, never modified.
  P.CONTRACT.LIST,
  P.CONTRACT.VIEW,
  P.CONTRACT.PAYMENT_LIST,
  P.CONTRACT.CREATE,
  P.CONTRACT.EDIT,
  P.CONTRACT.CANCEL,
  P.CONTRACT.GENERATE_PDF_TOKEN,
  P.CONTRACT.STAGE_MANAGE,
  P.CONTRACT.PAYMENT_MANAGE,
  P.CONTRACT.DRAWING_MANAGE,
  P.CONTRACT.SPECIAL_ITEM_MANAGE,
];

// Telegram management — ADMIN only today.
const TELEGRAM_ADMIN = [P.TELEGRAM.MANAGE];

// ── leads / lead ────────────────────────────────────────────────────────────────
// Legacy `/shared/client-leads` sat behind SHARED authentication only — EVERY
// authenticated role could call every route; object scope was enforced ad-hoc inside
// the handlers (sales: their own `userId` leads; ADMIN/SUPER_ADMIN/ACCOUNTANT/
// isSuperSales: all). To PRESERVE that "any authed role" surface, every role receives
// the broad lead-management code set below; the v2 module's object-scope checkers
// (checkIfUserCanAccessLead / checkIfUserCanMutateLead) supply the row-level gate that
// the legacy `/:id/...` routes were MISSING (the IDOR fix). The single genuinely
// admin-tier route in legacy was `/bulk-convert` (it threw for non-admin) and
// assigning a lead to ANOTHER user (PUT / with isAdmin); both map to LEAD.ASSIGN_OTHER,
// granted only to ADMIN/SUPER_ADMIN base + isSuperSales (see below) — matching legacy.
const LEAD_AUTHED = [
  P.LEAD.LIST,
  P.LEAD.VIEW,
  P.LEAD.ASSIGN_SELF,
  P.LEAD.CONVERT,
  P.LEAD.EDIT,
  P.LEAD.CHANGE_STATUS,
  P.LEAD.CALL_MANAGE,
  P.LEAD.MEETING_MANAGE,
  P.LEAD.PRICE_OFFER_MANAGE,
  P.LEAD.PAYMENT_MANAGE,
  P.LEAD.FILE_MANAGE,
  P.LEAD.NOTE_MANAGE,
  P.LEAD.REMINDER_SEND,
  P.LEAD.COUNTRY_CHECK,
];

// Admin-tier lead actions — assign a lead to ANOTHER user and bulk-convert. Legacy
// gated these on the `isAdmin` union (ADMIN / SUPER_ADMIN / isSuperSales). Granted to
// ADMIN/SUPER_ADMIN base here; the isSuperSales slice is layered via
// SUPER_SALES_EXTRA_PERMISSIONS below (matching legacy exactly, without widening any
// base role).
const LEAD_ADMIN = [P.LEAD.ASSIGN_OTHER];

// Site-utility management — ADMIN + SUPER_ADMIN only. The legacy routes were only
// behind SHARED authentication (any logged-in role could mutate them); the FE pages
// are @admin / @super_admin, so the v2 module tightens this to a privileged-only
// surface. This is a deliberate SECURITY FIX, not a behavior-preserving 1:1 grant.
const SITE_UTILITY_ADMIN = [
  P.SITE_UTILITY.PDF_CONFIG_VIEW,
  P.SITE_UTILITY.PDF_CONFIG_EDIT,
  P.SITE_UTILITY.PAYMENT_CONDITION_LIST,
  P.SITE_UTILITY.PAYMENT_CONDITION_CREATE,
  P.SITE_UTILITY.PAYMENT_CONDITION_EDIT,
  P.SITE_UTILITY.PAYMENT_CONDITION_DELETE,
];

// ── users / user — admin user-management ────────────────────────────────────────
// Legacy `/admin` router gate "ADMIN" (`verifyTokenAndHandleAuthorization`) admits
// role ADMIN/SUPER_ADMIN, OR `isSuperSales`, OR a subRole of ADMIN/SUPER_ADMIN. These
// management codes are granted to ADMIN/SUPER_ADMIN base here; the `isSuperSales` slice
// is layered via SUPER_SALES_EXTRA_PERMISSIONS below, and sub-roles are unioned
// automatically by getEffectivePermissions — so the effective set matches the legacy
// `isAdmin` union exactly without widening any other base role. (Legacy further
// constrains isSuperSales: it may only create/edit STAFF users and may not set
// ADMIN/SUPER_ADMIN roles — that finer rule is preserved in the v2 usecase, not the
// grant.) Reads/writes split per convention.
const USER_ADMIN = [
  P.USER.LIST,
  P.USER.VIEW_LOGS,
  P.USER.VIEW_LAST_SEEN,
  P.USER.CREATE,
  P.USER.UPDATE,
  P.USER.MANAGE_ROLES,
  P.USER.MANAGE_RESTRICTED_COUNTRIES,
  P.USER.MANAGE_AUTO_ASSIGNMENTS,
  P.USER.SET_MAX_LEADS,
  P.USER.MANAGE_STAFF_EXTRA,
];

// ── projects domain (project / task / update / delivery) ──────────────────────────
// Legacy `/shared/{projects,tasks,updates,delivery}` sat behind SHARED authentication
// only — EVERY one of the 9 authed roles could call every route; object scope was
// enforced ad-hoc inside the handlers (designers/executors/staff: only projects they
// are ASSIGNED to; ADMIN/SUPER_ADMIN — and ACCOUNTANT for the designer detail read:
// all). To PRESERVE that "any authed role" surface, every role receives the broad
// project-domain code set below; the v2 module's object-scope checkers
// (checkIfUserCanAccessProject / checkIfUserCanMutateProject) supply the row-level gate
// the legacy `/:id/...` routes were MISSING (the IDOR fix). The genuinely admin-tier
// management actions in legacy were assigning/unassigning a designer and changing the
// designer-board project status (gated by the `isAdmin` union); both map to
// PROJECT.MANAGE, granted only to ADMIN/SUPER_ADMIN base + isSuperSales (see below).
const PROJECT_AUTHED = [
  P.PROJECT.LIST,
  P.PROJECT.VIEW,
  P.PROJECT.EDIT,
  P.TASK.LIST,
  P.TASK.VIEW,
  P.TASK.CREATE,
  P.TASK.EDIT,
  P.TASK.DELETE,
  P.TASK.NOTE_MANAGE,
  P.UPDATE.LIST,
  P.UPDATE.CREATE,
  P.UPDATE.AUTHORIZE,
  P.UPDATE.ARCHIVE,
  P.UPDATE.MARK_DONE,
  P.DELIVERY.LIST,
  P.DELIVERY.CREATE,
  P.DELIVERY.LINK_MEETING,
  P.DELIVERY.DELETE,
];

// Admin-tier project management — assign/unassign a designer and change the
// designer-board project status. Legacy gated these on the `isAdmin` union (ADMIN /
// SUPER_ADMIN / isSuperSales). Granted to ADMIN/SUPER_ADMIN base here; the isSuperSales
// slice is layered via SUPER_SALES_EXTRA_PERMISSIONS below (matching legacy exactly,
// without widening any base role).
const PROJECT_ADMIN = [P.PROJECT.MANAGE];

// Admin course management — ADMIN + SUPER_ADMIN (behavior-preserving 1:1 with the
// legacy `/admin/courses` "ADMIN" gate, which admits ADMIN / SUPER_ADMIN, the
// ADMIN/SUPER_ADMIN sub-roles, and `isSuperSales`). The `isSuperSales` slice is
// granted via SUPER_SALES_EXTRA_PERMISSIONS below so the union matches legacy
// `isAdmin` exactly without widening role grants.
const COURSE_ADMIN = [
  P.COURSE.VIEW,
  P.COURSE.MANAGE,
  P.COURSE.ACCESS_MANAGE,
  P.COURSE.ATTEMPT_MANAGE,
];

// ── accounting ────────────────────────────────────────────────────────────────
// Legacy `/accountant` router gate `verifyTokenAndHandleAuthorization(..., "ACCOUNTANT")`
// admits ONLY a user whose base role is ACCOUNTANT (VERIFIED: the gate's `isAdmin`
// early-return fires only when the role PARAM is "ADMIN"; with param "ACCOUNTANT" it
// falls to `decoded.role !== role`, so ADMIN / SUPER_ADMIN / isSuperSales / sub-roles
// are NOT admitted). To preserve observable behavior 1:1, the full accounting code set
// is granted to the ACCOUNTANT role ONLY — no ADMIN/SUPER_ADMIN/isSuperSales grant.
// Widening this surface would be a behavior change and needs an explicit decision.
const ACCOUNTING_ALL = [
  P.ACCOUNTING.PAYMENT_LIST,
  P.ACCOUNTING.PAYMENT_PROCESS,
  P.ACCOUNTING.PAYMENT_MARK_OVERDUE,
  P.ACCOUNTING.PAYMENT_CHANGE_LEVEL,
  P.ACCOUNTING.NOTE_LIST,
  P.ACCOUNTING.NOTE_CREATE,
  P.ACCOUNTING.EXPENSE_LIST,
  P.ACCOUNTING.EXPENSE_CREATE,
  P.ACCOUNTING.RENT_LIST,
  P.ACCOUNTING.RENT_CREATE,
  P.ACCOUNTING.RENT_RENEW,
  P.ACCOUNTING.OUTCOME_LIST,
  P.ACCOUNTING.SUMMARY_VIEW,
  P.ACCOUNTING.USER_LIST,
  P.ACCOUNTING.USER_LAST_SEEN,
  P.ACCOUNTING.SALARY_VIEW,
  P.ACCOUNTING.SALARY_CREATE,
  P.ACCOUNTING.SALARY_EDIT,
  P.ACCOUNTING.SALARY_PAY,
];

/**
 * Base role → permission codes. Every UserRole value is present (no role may be
 * unmapped — an unmapped role would silently get nothing). De-duplication of the
 * union happens in `getEffectivePermissions`.
 */
export const ROLE_PERMISSIONS = {
  // ADMIN / SUPER_ADMIN are the privileged operators today: shared authed access
  // PLUS telegram management.
  [USER_ROLES.ADMIN]: [
    ...SHARED_AUTHED,
    ...TELEGRAM_ADMIN,
    ...SITE_UTILITY_ADMIN,
    ...COURSE_ADMIN,
    ...LEAD_AUTHED,
    ...LEAD_ADMIN,
    ...USER_ADMIN,
    ...PROJECT_AUTHED,
    ...PROJECT_ADMIN,
  ],
  [USER_ROLES.SUPER_ADMIN]: [
    ...SHARED_AUTHED,
    ...TELEGRAM_ADMIN,
    ...SITE_UTILITY_ADMIN,
    ...COURSE_ADMIN,
    ...LEAD_AUTHED,
    ...LEAD_ADMIN,
    ...USER_ADMIN,
    ...PROJECT_AUTHED,
    ...PROJECT_ADMIN,
  ],

  // All other roles currently have the shared authenticated surface (chat, authed
  // upload, auth self-service) but NOT telegram. They also held the full lead-
  // management surface (LEAD_AUTHED) — every authed role could reach `/shared/
  // client-leads`; object scope is what differs and is enforced by the checkers.
  [USER_ROLES.STAFF]: [...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED],
  [USER_ROLES.THREE_D_DESIGNER]: [...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED],
  [USER_ROLES.TWO_D_DESIGNER]: [...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED],
  [USER_ROLES.TWO_D_EXECUTOR]: [...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED],
  [USER_ROLES.ACCOUNTANT]: [...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED, ...ACCOUNTING_ALL],
  [USER_ROLES.SUPER_SALES]: [...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED],
  [USER_ROLES.CONTACT_INITIATOR]: [...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED],
};

/**
 * Extra codes granted by the `isSuperSales` boolean flag, layered ON TOP of the
 * user's base + sub-role codes. Empty today (no telegram/extra surface is
 * super-sales-only in the current code) — kept as the documented augmentation
 * point so a future module can grant super-sales-specific codes here without
 * touching role logic.
 *
 * Course admin: the legacy `/admin/courses` gate admits `isSuperSales` users (see
 * `verifyTokenAndHandleAuthorization` `isAdmin`). To preserve that exactly without
 * widening any base role, the admin course-management codes are layered on here for
 * `isSuperSales`. (The base SUPER_SALES role itself does NOT get them — only the
 * `isSuperSales` flag, matching legacy.)
 */
export const SUPER_SALES_EXTRA_PERMISSIONS = [
  P.COURSE.VIEW,
  P.COURSE.MANAGE,
  P.COURSE.ACCESS_MANAGE,
  P.COURSE.ATTEMPT_MANAGE,
  // Lead admin-tier: legacy `isAdmin` (which admits isSuperSales) gated bulk-convert
  // and assign-to-another-user. Layer the admin-tier lead code on for isSuperSales so
  // the union matches legacy exactly without granting the base SUPER_SALES role itself.
  P.LEAD.ASSIGN_OTHER,
  // User admin-tier: the legacy `/admin` gate "ADMIN" admits `isSuperSales`. Layer the
  // full user-management code set on for isSuperSales so the union matches legacy
  // exactly without granting the base SUPER_SALES role itself. (The finer legacy rule —
  // isSuperSales may only create/edit STAFF users — is enforced in the v2 usecase.)
  P.USER.LIST,
  P.USER.VIEW_LOGS,
  P.USER.VIEW_LAST_SEEN,
  P.USER.CREATE,
  P.USER.UPDATE,
  P.USER.MANAGE_ROLES,
  P.USER.MANAGE_RESTRICTED_COUNTRIES,
  P.USER.MANAGE_AUTO_ASSIGNMENTS,
  P.USER.SET_MAX_LEADS,
  P.USER.MANAGE_STAFF_EXTRA,
  // Project admin-tier: legacy `isAdmin` (which admits isSuperSales) gated the designer
  // assign/unassign and the designer-board status change. Layer the admin-tier project
  // code on for isSuperSales so the union matches legacy exactly without granting the
  // base SUPER_SALES role itself.
  P.PROJECT.MANAGE,
];

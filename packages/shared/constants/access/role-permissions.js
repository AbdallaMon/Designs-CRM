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
  [USER_ROLES.ACCOUNTANT]: [...SHARED_AUTHED, ...LEAD_AUTHED, ...PROJECT_AUTHED],
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

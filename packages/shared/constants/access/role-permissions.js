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
];

// Telegram management — ADMIN only today.
const TELEGRAM_ADMIN = [P.TELEGRAM.MANAGE];

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

/**
 * Base role → permission codes. Every UserRole value is present (no role may be
 * unmapped — an unmapped role would silently get nothing). De-duplication of the
 * union happens in `getEffectivePermissions`.
 */
export const ROLE_PERMISSIONS = {
  // ADMIN / SUPER_ADMIN are the privileged operators today: shared authed access
  // PLUS telegram management.
  [USER_ROLES.ADMIN]: [...SHARED_AUTHED, ...TELEGRAM_ADMIN, ...SITE_UTILITY_ADMIN],
  [USER_ROLES.SUPER_ADMIN]: [
    ...SHARED_AUTHED,
    ...TELEGRAM_ADMIN,
    ...SITE_UTILITY_ADMIN,
  ],

  // All other roles currently have the shared authenticated surface (chat, authed
  // upload, auth self-service) but NOT telegram.
  [USER_ROLES.STAFF]: [...SHARED_AUTHED],
  [USER_ROLES.THREE_D_DESIGNER]: [...SHARED_AUTHED],
  [USER_ROLES.TWO_D_DESIGNER]: [...SHARED_AUTHED],
  [USER_ROLES.TWO_D_EXECUTOR]: [...SHARED_AUTHED],
  [USER_ROLES.ACCOUNTANT]: [...SHARED_AUTHED],
  [USER_ROLES.SUPER_SALES]: [...SHARED_AUTHED],
  [USER_ROLES.CONTACT_INITIATOR]: [...SHARED_AUTHED],
};

/**
 * Extra codes granted by the `isSuperSales` boolean flag, layered ON TOP of the
 * user's base + sub-role codes. Empty today (no telegram/extra surface is
 * super-sales-only in the current code) — kept as the documented augmentation
 * point so a future module can grant super-sales-specific codes here without
 * touching role logic.
 */
export const SUPER_SALES_EXTRA_PERMISSIONS = [];

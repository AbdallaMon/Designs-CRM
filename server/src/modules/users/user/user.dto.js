// users/user DTO — output shaping + per-record `capabilities.*` (FE rendering hints;
// the server checkers remain the source of truth). Pure: no Prisma, no side effects.
//
// SECURITY: the legacy self-profile read returned the FULL user row (including the
// bcrypt `password` hash and other internals) straight to the client. `toSafeProfile`
// strips sensitive fields. The admin management lists already used narrow Prisma
// `select`s (no password), so they are passed through unchanged.
import { computeCapabilities, hasPermission, PERMISSIONS } from "@dms/shared";

const P = PERMISSIONS.USER;

// Fields never exposed by a profile read (defence-in-depth on top of any select).
const SENSITIVE_PROFILE_FIELDS = ["password"];

/** Strip sensitive fields from a single user/profile record. */
export function toSafeProfile(record) {
  if (!record || typeof record !== "object") return record;
  const safe = { ...record };
  for (const field of SENSITIVE_PROFILE_FIELDS) delete safe[field];
  return safe;
}

const ADMIN_TIER_ROLES = ["ADMIN", "SUPER_ADMIN"];

/**
 * Admin-tier (full user-management) check, mirroring the legacy `isAdmin` union in
 * verifyTokenAndHandleAuthorization (utility.js): base role ADMIN/SUPER_ADMIN OR
 * isSuperSales OR a sub-role of ADMIN/SUPER_ADMIN. The previous version omitted the
 * sub-role branch, so a sub-role-ADMIN user (who DOES hold every management permission
 * code via the sub-role union) was wrongly 403'd on others' profiles.
 *
 * `subRoles` is tolerated in either shape: the token/req.auth carries a plain string[]
 * (auth.dto.js toTokenPayload), while a raw Prisma row carries [{ subRole }].
 */
function isAdminTier(authUser) {
  if (!authUser) return false;
  if (authUser.isSuperSales) return true;
  if (ADMIN_TIER_ROLES.includes(authUser.role)) return true;
  const subRoles = Array.isArray(authUser.subRoles) ? authUser.subRoles : [];
  return subRoles.some((entry) =>
    ADMIN_TIER_ROLES.includes(typeof entry === "string" ? entry : entry?.subRole),
  );
}

/**
 * Capabilities for a single managed user row (admin list / detail). Combines the
 * permission CODE the caller holds with object facts (you cannot manage yourself the
 * same way, and isSuperSales is constrained to STAFF in the usecase).
 */
export function computeUserCapabilities(record, authUser) {
  const permissions = authUser?.permissions ?? [];
  const isSelf = record?.id != null && Number(record.id) === Number(authUser?.id);
  return computeCapabilities(
    {
      canEditUser: () => hasPermission(permissions, P.UPDATE),
      canChangeRoles: () => hasPermission(permissions, P.MANAGE_ROLES),
      canSetMaxLeads: () => hasPermission(permissions, P.SET_MAX_LEADS),
      canManageRestrictedCountries: () =>
        hasPermission(permissions, P.MANAGE_RESTRICTED_COUNTRIES),
      canManageAutoAssignments: () =>
        hasPermission(permissions, P.MANAGE_AUTO_ASSIGNMENTS),
      canManageStaffExtra: () => hasPermission(permissions, P.MANAGE_STAFF_EXTRA),
      canViewLogs: () => hasPermission(permissions, P.VIEW_LOGS),
      canViewLastSeen: () => hasPermission(permissions, P.VIEW_LAST_SEEN),
      // A user cannot toggle their OWN active status off (legacy let the FE hide it).
      canToggleStatus: () => hasPermission(permissions, P.UPDATE) && !isSelf,
    },
    {},
  );
}

/** Attach capabilities to a list of managed-user records. */
export function withListCapabilities(items, authUser) {
  if (!Array.isArray(items)) return items;
  return items.map((record) => ({
    ...record,
    capabilities: computeUserCapabilities(record, authUser),
  }));
}

/** Capabilities for a single profile record (self OR admin viewing). */
export function computeProfileCapabilities(record, authUser) {
  const permissions = authUser?.permissions ?? [];
  const isSelf = record?.id != null && Number(record.id) === Number(authUser?.id);
  const admin = isAdminTier(authUser);
  return computeCapabilities(
    {
      // self may edit own profile; admin-tier may edit any.
      canEditProfile: () =>
        hasPermission(permissions, P.PROFILE_EDIT) && (isSelf || admin),
    },
    {},
  );
}

export { isAdminTier };

// users/user DTO — output shaping + per-record `capabilities.*` (FE rendering hints;
// the server checkers remain the source of truth). Pure: no Prisma, no side effects.
//
// SECURITY: the legacy self-profile read returned the FULL user row (including the
// bcrypt `password` hash and other internals) straight to the client. `toSafeProfile`
// strips sensitive fields. The admin management lists already used narrow Prisma
// `select`s (no password), so they are passed through unchanged.
import { computeCapabilities, hasPermission, PERMISSIONS } from "@dms/shared";
import dayjs from "dayjs";

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
export function isAdminTier(authUser) {
  if (!authUser) return false;
  // Authoritative: the resolved current profile's flag (attached to req.auth by
  // requireAuth). This is what makes admin-tier follow the ACTIVE profile — an
  // admin who switched to a sales profile is no longer admin-tier.
  if (typeof authUser.isAdminTier === "boolean") return authUser.isAdminTier;
  // Legacy fallback for raw user rows / callers without a resolved profile.
  if (authUser.currentProfileKey === "SUPER_SALES") return true;
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

/**
 * Shape the monthly user-logs payload from the raw repo reads. Pure: no Prisma, no side
 * effects. The grouping / totals / final object are ported VERBATIM from the legacy
 * `getUserLogs` (only the Prisma reads were extracted into user.repo.js).
 */
export function formatUserLogs({ user, logs, todayLog, requestedMonth, requestedYear }) {
  // Calculate total month hours
  const totalMonthMinutes = logs.reduce(
    (total, log) => total + log.totalMinutes,
    0,
  );
  const totalMonthHours = (totalMonthMinutes / 60).toFixed(2);

  // Group logs by date
  const logsByDate = {};
  logs.forEach((log) => {
    const dateStr = dayjs(log.date).format("YYYY-MM-DD");
    if (!logsByDate[dateStr]) {
      logsByDate[dateStr] = {
        date: dateStr,
        formattedDate: dayjs(log.date).format("MMM DD, YYYY"),
        totalMinutes: 0,
        entries: [],
      };
    }

    logsByDate[dateStr].totalMinutes += log.totalMinutes;
    logsByDate[dateStr].entries.push({
      id: log.id,
      time: log.date,
      formattedTime: dayjs(log.date).format("h:mm A"),
      description: log.description || "Activity logged",
      totalHours: log.totalMinutes / 60,
    });
  });

  // Convert to array and calculate hours
  const formattedLogs = Object.values(logsByDate).map((day) => ({
    ...day,
    totalHours: (day.totalMinutes / 60).toFixed(2),
  }));

  const todayHours = todayLog
    ? (todayLog.totalMinutes / 60).toFixed(2)
    : "0.00";

  return {
    lastSeenAt: user?.lastSeenAt || null,
    logs: formattedLogs,
    totalMonthHours,
    totalHours: todayHours,
    month: requestedMonth + 1, // Convert back to 1-indexed for display
    year: requestedYear,
  };
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

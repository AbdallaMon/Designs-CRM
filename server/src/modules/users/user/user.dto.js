// users/user DTO — output shaping + per-record `capabilities.*` (FE rendering hints;
// the server checkers remain the source of truth). Pure: no Prisma, no side effects.
//
// Profile reads use narrow repository selects; the password strip is defence-in-depth.
import {
  PERMISSIONS,
  PROFILE_FAMILIES,
  PROFILES,
  computeCapabilities,
  hasPermission,
} from "@dms/shared";
import dayjs from "dayjs";

const P = PERMISSIONS.USER;

// Fields never exposed by a profile read (defence-in-depth on top of any select).
const SENSITIVE_PROFILE_FIELDS = [
  "password",
  "role",
  "subRoles",
  "isPrimary",
  "isSuperSales",
];

/** Strip sensitive fields from a single user/profile record. */
export function toSafeProfile(record) {
  if (!record || typeof record !== "object") return record;
  const safe = { ...record };
  for (const field of SENSITIVE_PROFILE_FIELDS) delete safe[field];
  return safe;
}

/**
 * Admin-tier check derived by the authentication middleware from the active profile.
 */
export function isAdminTier(authUser) {
  if (!authUser) return false;
  return Boolean(authUser.isAdminTier);
}

/** Sales-team management is elevated without redefining the global admin tier. */
export function isUserManagementOperator(authUser) {
  return (
    isAdminTier(authUser) ||
    authUser?.currentProfileKey === PROFILES.SUPER_SALES
  );
}

function targetProfileFacts(record) {
  const profiles = (record?.userProfiles ?? [])
    .map((assignment) => assignment?.profile)
    .filter(Boolean);
  return {
    keys: new Set(profiles.map((profile) => profile.key)),
    families: new Set(profiles.map((profile) => profile.family)),
    hasAdminTier: profiles.some(
      (profile) => profile.isAdminTier || [PROFILES.ADMIN, PROFILES.SUPER_ADMIN].includes(profile.key),
    ),
  };
}

/** Target scope for user management. ADMIN outranks SUPER_ADMIN; SUPER_SALES is sales-only. */
export function canManageUser(record, authUser) {
  if (!record || !authUser) return false;
  if (Number(record.id) === Number(authUser.id)) return false;
  const target = targetProfileFacts(record);
  switch (authUser.currentProfileKey) {
    case PROFILES.ADMIN:
      return true;
    case PROFILES.SUPER_ADMIN:
      return !target.keys.has(PROFILES.ADMIN);
    case PROFILES.SUPER_SALES:
  return !target.hasAdminTier && target.families.has(PROFILE_FAMILIES.SALES);
    default:
      return false;
  }
}

/**
 * Capabilities for a single managed user row (admin list / detail). Combines the
 * permission CODE the caller holds with object facts (you cannot manage yourself the
 * same way.
 */
export function computeUserCapabilities(record, authUser) {
  const permissions = authUser?.permissions ?? [];
  const isSelf = record?.id != null && Number(record.id) === Number(authUser?.id);
  const canManageTarget = canManageUser(record, authUser);
  return computeCapabilities(
    {
      canEditUser: () => hasPermission(permissions, P.UPDATE) && canManageTarget,
      canManageProfiles: () =>
        hasPermission(permissions, P.MANAGE_PROFILES) && canManageTarget,
      canSetMaxLeads: () =>
        hasPermission(permissions, P.SET_MAX_LEADS) && canManageTarget,
      canManageRestrictedCountries: () =>
        hasPermission(permissions, P.MANAGE_RESTRICTED_COUNTRIES) && canManageTarget,
      canManageAutoAssignments: () =>
        hasPermission(permissions, P.MANAGE_AUTO_ASSIGNMENTS) && canManageTarget,
      canViewLogs: () => hasPermission(permissions, P.VIEW_LOGS) && canManageTarget,
      canViewLastSeen: () =>
        hasPermission(permissions, P.VIEW_LAST_SEEN) && canManageTarget,
      // A user cannot deactivate their own account.
      canToggleStatus: () =>
        hasPermission(permissions, P.UPDATE) && !isSelf && canManageTarget,
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
 * Shape the monthly user-logs payload from the raw repository reads.
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
  const canManageTarget = canManageUser(record, authUser);
  return computeCapabilities(
    {
      // self may edit own profile; admin-tier may edit any.
      canEditProfile: () =>
        hasPermission(permissions, P.PROFILE_EDIT) && (isSelf || canManageTarget),
    },
    {},
  );
}

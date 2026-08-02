// users/user DTO — output shaping + per-record `capabilities.*` (FE rendering hints;
// the server checkers remain the source of truth). Pure: no Prisma, no side effects.
//
// Profile reads use narrow repository selects; the password strip is defence-in-depth.
import { computeCapabilities, hasPermission, PERMISSIONS } from "@dms/shared";
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

/**
 * Capabilities for a single managed user row (admin list / detail). Combines the
 * permission CODE the caller holds with object facts (you cannot manage yourself the
 * same way.
 */
export function computeUserCapabilities(record, authUser) {
  const permissions = authUser?.permissions ?? [];
  const isSelf = record?.id != null && Number(record.id) === Number(authUser?.id);
  return computeCapabilities(
    {
      canEditUser: () => hasPermission(permissions, P.UPDATE),
      canManageProfiles: () => hasPermission(permissions, P.MANAGE_PROFILES),
      canSetMaxLeads: () => hasPermission(permissions, P.SET_MAX_LEADS),
      canManageRestrictedCountries: () =>
        hasPermission(permissions, P.MANAGE_RESTRICTED_COUNTRIES),
      canManageAutoAssignments: () =>
        hasPermission(permissions, P.MANAGE_AUTO_ASSIGNMENTS),
      canViewLogs: () => hasPermission(permissions, P.VIEW_LOGS),
      canViewLastSeen: () => hasPermission(permissions, P.VIEW_LAST_SEEN),
      // A user cannot deactivate their own account.
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

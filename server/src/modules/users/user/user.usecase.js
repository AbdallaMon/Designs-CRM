// User business logic. Prisma access is restricted to user.repo.js.
// Authorization derives exclusively from the caller's active permission profile.
import bcrypt from "bcrypt";
import dayjs from "dayjs";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  PROFILE_FAMILIES,
  PROFILES,
  userMessagesCodes,
  AUDIT_MODULES,
  AUDIT_ACTIONS,
} from "@dms/shared";
import { userRepository } from "./user.repo.js";
import { authAuditRepository, AUTH_AUDIT_ACTIONS } from "../../../infra/audit/auth-audit.repo.js";
import { recordAction } from "../../../infra/audit/record-action.js";
import {
  toSafeProfile,
  computeUserCapabilities,
  computeProfileCapabilities,
  isAdminTier,
  isUserManagementOperator,
  canManageUser,
  formatUserLogs,
} from "./user.dto.js";

// Identity writes hash passwords here and delegate persistence to the repository.
export function createUserRecord(user) {
  const hashedPassword = bcrypt.hashSync(user.password, BCRYPT_COST);
  return userRepository.createUserRecord({ user, hashedPassword });
}

export function updateUserRecord(user, userId) {
  let hashedPassword = undefined;
  if (user.password) {
    hashedPassword = bcrypt.hashSync(user.password, BCRYPT_COST);
  }
  return userRepository.updateUserRecord({ user, userId, hashedPassword });
}

// Monthly activity aggregation. Reads via the repo; shaping lives in the DTO.
export async function getUserLogs(userId, month, year) {
  // Default to current month/year if not provided
  const requestedMonth = month ? parseInt(month) - 1 : dayjs().month(); // 0-indexed month
  const requestedYear = year ? parseInt(year) : dayjs().year();

  // Get start and end dates for the requested month
  const startOfMonth = dayjs()
    .year(requestedYear)
    .month(requestedMonth)
    .startOf("month")
    .toDate();
  const endOfMonth = dayjs()
    .year(requestedYear)
    .month(requestedMonth)
    .endOf("month")
    .toDate();

  const user = await userRepository.findUserLastSeenById({ userId });
  const logs = await userRepository.findUserLogsInRange({
    userId,
    startOfMonth,
    endOfMonth,
  });

  // Get today's hours for consistency
  const today = dayjs().startOf("day").toDate();
  const todayLog = await userRepository.findUserLogForDay({ userId, date: today });

  return formatUserLogs({ user, logs, todayLog, requestedMonth, requestedYear });
}

// Non-admin self-service edits cannot change authorization or administrative fields.
const PROFILE_SELF_EDITABLE = [
  "name",
  "telegramUsername",
  "profilePicture",
  "allowNotification",
  "allowEmailing",
];

// Admin-tier profile edits use an explicit allow-list. Passwords are always hashed.
const PROFILE_ADMIN_EDITABLE = [
  "name",
  "email",
  "telegramUsername",
  "profilePicture",
  "isActive",
  "password",
  "maxLeadsCounts",
  "maxLeadCountPerDay",
  "allowNotification",
  "allowEmailing",
];

const USER_IDENTITY_FIELDS = [
  "email",
  "password",
  "name",
  "telegramUsername",
];

function pickUserIdentity(body = {}) {
  return Object.fromEntries(
    USER_IDENTITY_FIELDS
      .filter((key) => body[key] !== undefined)
      .map((key) => [key, body[key]]),
  );
}

// Preserve the established password cost for existing credentials.
const BCRYPT_COST = 8;

// P2002-on-email detector for the public API error contract.
function isEmailTakenError(error) {
  return error?.code === "P2002" && error?.meta?.target?.includes?.("email");
}

export class UserUsecase {
  // ════════════════════════════════════════════════════════════════════════════
  //  SCOPE CHECKERS — the profile IDOR fix
  // ════════════════════════════════════════════════════════════════════════════
  // Read scope: self or an active ADMIN/SUPER_ADMIN profile. Deny before lookup so an
  // unauthorized caller cannot probe whether another user exists.
  async checkIfUserCanAccessProfile({ userId, authUser }) {
    const targetId = Number(userId);
    const isSelf = targetId === Number(authUser.id);
    if (!isSelf && !isUserManagementOperator(authUser)) {
      throw new AppError({ code: userMessagesCodes.USER_PROFILE_ACCESS_DENIED, statusCode: 403 });
    }
    const target = isSelf
      ? await userRepository.findUserIdById({ userId: targetId })
      : await userRepository.findUserManagementScope({ userId: targetId });
    if (!target) throw new AppError({ code: userMessagesCodes.USER_PROFILE_NOT_FOUND, statusCode: 404 });
    if (!isSelf && !canManageUser(target, authUser)) {
      throw new AppError({ code: userMessagesCodes.USER_PROFILE_ACCESS_DENIED, statusCode: 403 });
    }
    return {
      id: target.id,
      isSelf,
      adminTier:
        isAdminTier(authUser) ||
        (!isSelf && authUser?.currentProfileKey === PROFILES.SUPER_SALES),
    };
  }

  // Write scope: same self-OR-admin rule (stricter behavior is in the field whitelist).
  async checkIfUserCanMutateProfile({ userId, authUser }) {
    const targetId = Number(userId);
    const isSelf = targetId === Number(authUser.id);
    if (!isSelf && !isUserManagementOperator(authUser)) {
      throw new AppError({ code: userMessagesCodes.USER_PROFILE_MUTATE_DENIED, statusCode: 403 });
    }
    const target = isSelf
      ? await userRepository.findUserIdById({ userId: targetId })
      : await userRepository.findUserManagementScope({ userId: targetId });
    if (!target) throw new AppError({ code: userMessagesCodes.USER_PROFILE_NOT_FOUND, statusCode: 404 });
    if (!isSelf && !canManageUser(target, authUser)) {
      throw new AppError({ code: userMessagesCodes.USER_PROFILE_MUTATE_DENIED, statusCode: 403 });
    }
    return {
      id: target.id,
      isSelf,
      adminTier:
        isAdminTier(authUser) ||
        (!isSelf && authUser?.currentProfileKey === PROFILES.SUPER_SALES),
    };
  }

  async checkIfUserCanManageUser({ userId, authUser }) {
    const target = await userRepository.findUserManagementScope({ userId });
    if (!target) {
      throw new AppError({ code: userMessagesCodes.USER_PROFILE_NOT_FOUND, statusCode: 404 });
    }
    if (!canManageUser(target, authUser)) {
      throw new AppError({ code: userMessagesCodes.USER_PROFILE_MUTATE_DENIED, statusCode: 403 });
    }
    return { id: target.id };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DIRECTORY
  // ════════════════════════════════════════════════════════════════════════════
  // relatedOnly includes existing STAFF_TO_STAFF peers; the default excludes them.
  // Non-admin results are scoped to profiles the requester holds.
  async getDirectory({ query, authUser, relatedOnly = false }) {
    const items = await userRepository.findDirectory({
      searchParams: { ...query },
      currentUser: authUser,
      checkIfNotHasRelatedChat: !relatedOnly,
      checkIfHasRelatedChat: relatedOnly,
    });
    return { items };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  ADMIN MANAGEMENT LIST
  // ════════════════════════════════════════════════════════════════════════════
  async listUsers({ query, authUser, page, limit, skip }) {
    const { users, total } = await userRepository.findManagementList({
      searchParams: { ...query },
      currentUser: authUser,
      skip,
      take: limit,
    });
    const items = users.map((u) => ({ ...u, capabilities: computeUserCapabilities(u, authUser) }));
    return { items, total, page, pageSize: limit };
  }

  // Profile-scoped picker list. Returns the standard items envelope.
  async getAllUsers({ query, authUser }) {
    const items = await userRepository.findDirectory({
      searchParams: query ?? {},
      currentUser: authUser,
    });
    return { items: items.map((u) => ({ ...u, capabilities: computeUserCapabilities(u, authUser) })) };
  }

  // ── chat member-picker directory (single consolidated surface) ────────────────
  // Admin profiles can select from the full directory. Other profiles are restricted
  // to existing STAFF_TO_STAFF peers.
  async getChatDirectory({ query, authUser }) {
    const relatedOnly = !isAdminTier(authUser);
    return userRepository.findDirectory({
      searchParams: { ...query },
      currentUser: authUser,
      checkIfHasRelatedChat: relatedOnly,
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  PROFILE (read / edit) — scope already enforced by the checker
  // ════════════════════════════════════════════════════════════════════════════
  async getProfile({ userId, authUser }) {
    const profile = await userRepository.findUserProfileById({ userId });
    if (!profile) throw new AppError({ code: userMessagesCodes.USER_PROFILE_NOT_FOUND, statusCode: 404 });
    const safe = toSafeProfile(profile);
    return { ...safe, capabilities: computeProfileCapabilities(safe, authUser) };
  }

  async updateProfile({ userId, body, scoped }) {
    // The mutate scope checker stashed { isSelf, adminTier } on req.scoped.
    const adminTier = scoped?.adminTier;
    const allowlist = adminTier ? PROFILE_ADMIN_EDITABLE : PROFILE_SELF_EDITABLE;
    // Apply the self/admin allow-list and hash any administrative password update.
    const data = {};
    for (const key of allowlist) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (data.password !== undefined) {
      // Only admin-tier callers can reach a `password` key (it is not in
      // PROFILE_SELF_EDITABLE). Hash it; never persist plaintext.
      data.password = bcrypt.hashSync(data.password, BCRYPT_COST);
    }
    const updated = await userRepository.updateUserProfile({ userId, data });
    return toSafeProfile(updated);
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  ADMIN CREATE / EDIT / STATUS
  // ════════════════════════════════════════════════════════════════════════════
  async createUser({ body, authUser, auditCtx }) {
    const identity = pickUserIdentity(body);
    if (Object.keys(identity).length === 0) {
      throw new AppError({ code: userMessagesCodes.USER_NO_DATA_SENT, statusCode: 404 });
    }
    // Identity only. Authorization profiles are assigned through
    // PUT /users/:id/profiles.
    try {
      const createdUser = await createUserRecord(identity);
      // Semantic audit: a new user account was created (secrets auto-redacted).
      await recordAction(auditCtx, {
        module: AUDIT_MODULES.USER,
        action: AUDIT_ACTIONS.USER_CREATED,
        entityType: "User",
        entityId: createdUser?.id ?? null,
        summary: `User #${createdUser?.id ?? "?"} created`,
        after: { name: createdUser?.name, email: createdUser?.email },
      });
      return createdUser;
    } catch (error) {
      if (isEmailTakenError(error)) throw new AppError({ code: userMessagesCodes.EMAIL_ALREADY_REGISTERED, statusCode: 400 });
      throw error;
    }
  }

  async updateUser({ userId, body, authUser, auditCtx }) {
    if (!body || !userId) throw new AppError({ code: userMessagesCodes.USER_NOT_FOUND, statusCode: 404 });
    const identity = pickUserIdentity(body);
    if (Object.keys(identity).length === 0) {
      throw new AppError({ code: userMessagesCodes.USER_NO_DATA_SENT, statusCode: 400 });
    }
    // Identity only; profile changes go through the profiles endpoint.
    // Snapshot the pre-edit row for the before/after diff (best-effort; never breaks the
    // update). The diff+redaction helper captures only the edited fields (secrets redacted).
    let before = null;
    try {
      before = await userRepository.findUserProfileById({ userId });
    } catch {
      before = null;
    }
    try {
      const updatedUser = await updateUserRecord(identity, userId);
      await recordAction(auditCtx, {
        module: AUDIT_MODULES.USER,
        action: AUDIT_ACTIONS.USER_UPDATED,
        entityType: "User",
        entityId: Number(userId),
        summary: `User #${userId} updated`,
        before,
        after: updatedUser,
        allowedKeys: Object.keys(identity),
      });
      return updatedUser;
    } catch (error) {
      if (isEmailTakenError(error)) throw new AppError({ code: userMessagesCodes.EMAIL_ALREADY_REGISTERED, statusCode: 400 });
      throw error;
    }
  }

  async changeStatus({ userId, body }) {
    if (!userId || !body?.user) throw new AppError({ code: userMessagesCodes.USER_NOT_FOUND, statusCode: 404 });
    return userRepository.toggleStatus({ userId, isActive: body.user.isActive });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  PROFILES / AUTO-ASSIGNMENTS / RESTRICTED COUNTRIES / MAX LEADS
  // ════════════════════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════════════════════
  //  DB-RELATIONAL PROFILES (admin assign / remove + active)
  // ════════════════════════════════════════════════════════════════════════════
  async listAssignableProfiles({ authUser }) {
    let where = {};
    if (authUser?.currentProfileKey === PROFILES.SUPER_ADMIN) where = { key: { not: PROFILES.ADMIN } };
    if (authUser?.currentProfileKey === PROFILES.SUPER_SALES) {
      where = { family: PROFILE_FAMILIES.SALES };
    }
    return { items: await userRepository.listAssignableProfiles({ where }) };
  }

  /**
   * Admin sets assigned permission profiles and the active profile. The operation
   * diff-applies UserProfile rows and audits every addition/removal. At least one
   * profile must remain assigned.
   */
  async updateUserProfiles({ authUser, userId, profileIds, currentProfileId }) {
    const targetId = Number(userId);
    if (!Array.isArray(profileIds) || profileIds.length === 0) {
      throw new AppError({ code: userMessagesCodes.USER_NO_DATA_SENT, statusCode: 400 });
    }
    const desired = [...new Set(profileIds.map(Number))];
    const profiles = await userRepository.findProfilesByIds({ ids: desired });
    if (profiles.length !== desired.length) {
      throw new AppError({ code: userMessagesCodes.USER_PROFILE_NOT_ALLOWED, statusCode: 400 });
    }
    if (
      (authUser?.currentProfileKey === PROFILES.SUPER_ADMIN && profiles.some((p) => p.key === PROFILES.ADMIN)) ||
      (authUser?.currentProfileKey === PROFILES.SUPER_SALES &&
        profiles.some((p) => p.family !== PROFILE_FAMILIES.SALES))
    ) {
      throw new AppError({ code: userMessagesCodes.USER_PROFILE_NOT_ALLOWED, statusCode: 403 });
    }

    // Sales tier is mutually exclusive: at most one of Sales / Primary sales / Super sales
    // (hierarchical variants of the same STAFF-sales role). Other families combine freely.
    const SALES_TIER = [PROFILES.NORMAL_SALES, PROFILES.PRIMARY_SALES, PROFILES.SUPER_SALES];
    if (profiles.filter((p) => SALES_TIER.includes(p.key)).length > 1) {
      throw new AppError({ code: userMessagesCodes.USER_SALES_TIER_EXCLUSIVE, statusCode: 400 });
    }

    // current = requested if it's in the new set, else the first assigned.
    const nextCurrent =
      currentProfileId != null && desired.includes(Number(currentProfileId))
        ? Number(currentProfileId)
        : desired[0];

    const existing = await userRepository.getUserProfileIds({ userId: targetId });
    const existingSet = new Set(existing);
    const desiredSet = new Set(desired);
    const addIds = desired.filter((id) => !existingSet.has(id));
    const removeIds = existing.filter((id) => !desiredSet.has(id));

    await userRepository.setUserProfiles({
      userId: targetId,
      addIds,
      removeIds,
      currentProfileId: nextCurrent,
      assignedByUserId: Number(authUser.id),
    });

    for (const id of addIds) {
      await authAuditRepository.record({
        actorUserId: Number(authUser.id),
        targetUserId: targetId,
        action: AUTH_AUDIT_ACTIONS.PROFILE_ASSIGN,
        detail: { profileId: id },
      });
    }
    for (const id of removeIds) {
      await authAuditRepository.record({
        actorUserId: Number(authUser.id),
        targetUserId: targetId,
        action: AUTH_AUDIT_ACTIONS.PROFILE_REMOVE,
        detail: { profileId: id },
      });
    }

    return { userId: targetId, profileIds: desired, currentProfileId: nextCurrent };
  }

  async getAutoAssignments({ userId }) {
    return userRepository.findAutoAssignments({ userId: Number(userId) });
  }

  async updateAutoAssignments({ userId, body }) {
    return userRepository.updateUserAutoAssignment(userId, body);
  }

  async getRestrictedCountries({ userId }) {
    return userRepository.findRestrictedCountries({ userId });
  }

  async updateRestrictedCountries({ userId, body }) {
    return userRepository.updateRestrictedCountries({ userId, countries: body.countries });
  }

  async setMaxLeads({ userId, body }) {
    return userRepository.updateMaxLeads({ userId, maxLeadsCounts: body.maxLeadsCounts });
  }

  async setMaxLeadsPerDay({ userId, body }) {
    return userRepository.updateMaxLeadsPerDay({ userId, maxLeadCountPerDay: body.maxLeadCountPerDay });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  LOGS / LAST-SEEN
  // ════════════════════════════════════════════════════════════════════════════
  // GET /:userId/logs — today's notifications for the user.
  async getLogs({ userId }) {
    return userRepository.getNotificationForTodayByStaffId(userId);
  }

  // GET /:userId/last-seen — monthly activity aggregation.
  async getLastSeen({ userId, query }) {
    return getUserLogs(userId, query.month, query.year);
  }
}

export const userUsecase = new UserUsecase();

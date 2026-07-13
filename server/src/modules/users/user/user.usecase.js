// users/user usecase — business logic / orchestration. Prisma NEVER appears here (only
// repo calls). Behavior is ported 1:1 from the legacy handlers + services
// (routes/admin/admin.js, routes/shared/users.js, routes/shared/index.js, and
// the legacy admin service + the removed user-profile service). Errors
// are thrown as AppError(code, statusCode); the envelope serializes them.
//
// THE IDOR FIXES live in:
//   - checkIfUserCanAccessProfile / checkIfUserCanMutateProfile — self OR admin-tier;
//     the legacy `/shared/users/:userId/profile` routes had NO ownership check (any
//     authed user could read another user's full row incl. password hash, or PUT
//     arbitrary fields — role/isActive/password — on any userId).
//   - PROFILE_SELF_EDITABLE whitelist — the legacy update was a blind
//     `data: req.body` passthrough (privilege escalation). Non-admin self-edits are
//     restricted to safe fields; admin-tier callers keep the full passthrough (1:1
//     with the legacy ADMIN edit path).
//
// SIDE EFFECTS / multi-write / heavy formatting (createStaffUser+bcrypt,
// editStaffUser+bcrypt, updateUserRoles, updateUserAutoAssignment, getUserLogs,
// getNotificationForTodayByStaffId) are invoked via lazy imports of the EXISTING
// implementations so observable behavior is preserved without duplicating logic — the
// same pattern as the migrated leads/courses modules.
import bcrypt from "bcrypt";
import dayjs from "dayjs";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  userMessagesCodes,
  PROFILE_KEYS,
  PROFILE_META,
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
  formatUserLogs,
} from "./user.dto.js";

// ── Relocated side-effecting user ops (formerly the admin-services god-file) ──────────
// The heavy create/edit/logs operations now live in THIS module: bcrypt hashing stays in the
// usecase layer, Prisma writes/reads go through user.repo.js, and the log shaping is in
// user.dto.js. Behavior is ported 1:1 from the legacy admin-services implementations. The
// pure-Prisma writes (updateUserRoles / updateUserAutoAssignment / getNotificationForToday*)
// are wired straight to the repo in the DI seam below.
export function createStaffUser(user) {
  const hashedPassword = bcrypt.hashSync(user.password, BCRYPT_COST);
  return userRepository.createStaffUser({ user, hashedPassword });
}

export function editStaffUser(user, userId) {
  let hashedPassword = undefined;
  if (user.password) {
    hashedPassword = bcrypt.hashSync(user.password, BCRYPT_COST);
  }
  return userRepository.editStaffUser({ user, userId, hashedPassword });
}

// Monthly activity aggregation (legacy getUserLogs). Reads via the repo; shaping in the dto.
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

// Non-admin self-profile editable fields. The legacy update was an unguarded
// passthrough; we restrict a non-admin self-edit to fields that cannot escalate
// privilege. role / isActive / isSuperSales / isPrimary / maxLeads* / password are
// EXCLUDED here (they are managed only by the admin endpoints). Admin-tier callers
// bypass this whitelist (preserving the legacy ADMIN profile-edit passthrough).
const PROFILE_SELF_EDITABLE = ["name", "telegramUsername", "profilePicture"];

// Admin-tier profile-editable fields. The legacy admin edit path (editStaffUser +
// updateUserProfileById) let admins set these; we keep that surface but as an EXPLICIT
// allow-list so the admin profile-edit branch can no longer write arbitrary keys (the
// legacy `data: req.body` passthrough silently accepted any field). `password` is hashed
// (never stored plaintext — see updateProfile); everything outside this list is dropped.
const PROFILE_ADMIN_EDITABLE = [
  "name",
  "email",
  "role",
  "telegramUsername",
  "profilePicture",
  "isActive",
  "password",
  "maxLeadsCounts",
  "maxLeadCountPerDay",
];

// Staff-extra toggle fields (the only flags PATCH /:userId/staff-extra may set). Mirrors
// the FE caller (UsersPage.jsx toggleUserStatus → isPrimary / isSuperSales). NEVER
// password/role/isActive.
const STAFF_EXTRA_EDITABLE = ["isPrimary", "isSuperSales"];

// bcrypt cost factor — matched VERBATIM to the legacy editStaffUser/createStaffUser
// (bcrypt.hashSync(password, 8) in services/main/admin/adminServices.js). Do not change.
const BCRYPT_COST = 8;

// P2002-on-email detector (legacy mapped this Prisma error to a 400 "email already
// registered" for create AND edit).
function isEmailTakenError(error) {
  return error?.code === "P2002" && error?.meta?.target?.includes?.("email");
}

// When a profile is supplied, it is authoritative: derive the legacy role/flags from
// PROFILE_META and merge them into the body the frozen create/edit service writes, so
// nothing that still reads role/isPrimary/isSuperSales goes out of sync. When no
// profile is sent this is a no-op (parity with pre-profile behavior).
//
// IMPORTANT: the frozen legacy `createStaffUser`/`editStaffUser` (adminServices.js)
// build an EXPLICIT Prisma `data: { email, password, role, name, telegramUsername }` —
// they silently IGNORE isPrimary/isSuperSales even when present on the merged body. So
// those two flags can NEVER be synced by merging them into the legacy call's input; the
// caller must write them separately via `repo.setUserProfile`. We return them here as an
// explicit `sync` object (defaulting to false when PROFILE_META doesn't specify them) so
// create/update can pass them through after the legacy write succeeds.
function applyProfileToBody(body) {
  const key = body?.profile;
  if (key == null) return { body, profile: null, sync: null };
  if (!PROFILE_KEYS.includes(key)) throw new AppError(userMessagesCodes.USER_ROLE_NOT_ALLOWED, 400);
  const meta = PROFILE_META[key];
  const sync = { isPrimary: Boolean(meta.isPrimary), isSuperSales: Boolean(meta.isSuperSales) };
  const merged = { ...body, role: meta.baseRole, ...sync };
  return { body: merged, profile: key, sync };
}

export class UserUsecase {
  // ════════════════════════════════════════════════════════════════════════════
  //  SCOPE CHECKERS — the profile IDOR fix
  // ════════════════════════════════════════════════════════════════════════════
  // Read scope: the caller may view a profile if it is THEIR OWN, or they are
  // admin-tier (ADMIN/SUPER_ADMIN/isSuperSales — the legacy `isAdmin` union). Throws
  // 403 otherwise. We do not leak existence to an unauthorized caller (403, not 404).
  async checkIfUserCanAccessProfile({ userId, authUser }) {
    const targetId = Number(userId);
    const isSelf = targetId === Number(authUser.id);
    if (!isSelf && !isAdminTier(authUser)) {
      throw new AppError(userMessagesCodes.USER_PROFILE_ACCESS_DENIED, 403);
    }
    const target = await userRepository.findUserIdById({ userId: targetId });
    if (!target) throw new AppError(userMessagesCodes.USER_PROFILE_NOT_FOUND, 404);
    return { id: target.id, isSelf, adminTier: isAdminTier(authUser) };
  }

  // Write scope: same self-OR-admin rule (stricter behavior is in the field whitelist).
  async checkIfUserCanMutateProfile({ userId, authUser }) {
    const targetId = Number(userId);
    const isSelf = targetId === Number(authUser.id);
    if (!isSelf && !isAdminTier(authUser)) {
      throw new AppError(userMessagesCodes.USER_PROFILE_MUTATE_DENIED, 403);
    }
    const target = await userRepository.findUserIdById({ userId: targetId });
    if (!target) throw new AppError(userMessagesCodes.USER_PROFILE_NOT_FOUND, 404);
    return { id: target.id, isSelf, adminTier: isAdminTier(authUser) };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DIRECTORY (legacy /shared/all-chat-users , /shared/all-related-chat-users)
  // ════════════════════════════════════════════════════════════════════════════
  // `relatedOnly` selects the 4th-arg legacy call-shape: getAllUsers(.., false, true) —
  // only users already in a STAFF_TO_STAFF room with me. The default (`relatedOnly:
  // false`) is the 3rd-arg shape getAllUsers(.., true) — exclude users already chatting
  // with me. Both are role-narrowed for non-admins inside the repo (verbatim legacy).
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
  //  ADMIN MANAGEMENT LIST (legacy GET /admin/users + /admin/all-users)
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

  // /all-users — the role-grouped pick list (legacy getAllUsers default shape, no chat
  // flags). Returns a bare list (no pagination — legacy returned `{ data: users }`).
  //
  // `exactRole=true` (sent by the lead-assign picker) narrows the match to the PRIMARY
  // role column only — excluding designers/executors who merely carry the requested role
  // as a secondary subRole. Sales-staff selection for lead assignment must list STAFF
  // agents ONLY; without this flag the default OR(role, subRole) match leaks
  // THREE_D_DESIGNER / TWO_D_DESIGNER / TWO_D_EXECUTOR users that hold a `STAFF` subRole.
  // Other callers (e.g. the designer-assign modal) omit it and keep the legacy OR match.
  async getAllUsers({ query, authUser }) {
    const { exactRole, ...searchParams } = query ?? {};
    const items = await userRepository.findDirectory({
      searchParams,
      currentUser: authUser,
      exactRole: exactRole === true || exactRole === "true" || exactRole === "1",
    });
    return { items: items.map((u) => ({ ...u, capabilities: computeUserCapabilities(u, authUser) })) };
  }

  // ── chat member-picker directory (single consolidated surface) ────────────────
  // Mirrors the legacy FE branch in chat.service.js (listDirectoryUsers): admins hit
  // `/admin/all-users` → getAllUsers(sp, currentUser) (no chat flags); non-admins hit
  // `/shared/all-related-chat-users?projectId=...` → getAllUsers(sp, user, false, true)
  // (only users already in a STAFF_TO_STAFF room with me). The server now decides which
  // shape to return FROM req.auth (admin-tier vs not) instead of trusting an FE flag — so
  // the picker can run entirely on `/v2`. Returns a BARE user array (legacy `data: users`
  // shape — getAllUsers carries no `capabilities`), so the repointed FE's `response.data`
  // (an array) keeps working 1:1. `projectId` mirrors the legacy query param: getAllUsers
  // never read it (the related-chat scope is derived from the membership join, not the
  // project), so it is accepted-but-unused exactly as before.
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
    if (!profile) throw new AppError(userMessagesCodes.USER_PROFILE_NOT_FOUND, 404);
    const safe = toSafeProfile(profile);
    return { ...safe, capabilities: computeProfileCapabilities(safe, authUser) };
  }

  async updateProfile({ userId, body, scoped }) {
    // The mutate scope checker stashed { isSelf, adminTier } on req.scoped.
    const adminTier = scoped?.adminTier;
    const allowlist = adminTier ? PROFILE_ADMIN_EDITABLE : PROFILE_SELF_EDITABLE;
    // Whitelist the editable fields (privilege-escalation fix). The legacy admin path was
    // a blind `data: req.body` passthrough (it accepted role/isActive AND stored password
    // in PLAINTEXT). We pick only sanctioned fields and hash the password the SAME way the
    // legacy editStaffUser did (bcrypt cost 8) before it ever reaches Prisma.
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
  //  ADMIN CREATE / EDIT / STATUS / STAFF-EXTRA
  // ════════════════════════════════════════════════════════════════════════════
  async createUser({ body, authUser, auditCtx }) {
    if (!body || Object.keys(body).length === 0) {
      throw new AppError(userMessagesCodes.USER_NO_DATA_SENT, 404);
    }
    // Identity only — NO role/profile is assigned from this form. A new user defaults
    // to STAFF (createStaffUser) and receives its role(s) via the profiles endpoint
    // (PUT /users/:id/profiles). Legacy guard: an isSuperSales (non-admin) creator may
    // only create STAFF — enforced ONLY if a non-STAFF role is explicitly provided.
    if (
      authUser.currentProfileKey === "SUPER_SALES" &&
      authUser.role !== "ADMIN" &&
      authUser.role !== "SUPER_ADMIN" &&
      body.role &&
      body.role !== "STAFF"
    ) {
      throw new AppError(userMessagesCodes.USER_ROLE_NOT_ALLOWED, 403);
    }
    try {
      const createdUser = await createStaffUser(body);
      // Semantic audit: a new user account was created (secrets auto-redacted).
      await recordAction(auditCtx, {
        module: AUDIT_MODULES.USER,
        action: AUDIT_ACTIONS.USER_CREATED,
        entityType: "User",
        entityId: createdUser?.id ?? null,
        summary: `User #${createdUser?.id ?? "?"} created`,
        after: { name: createdUser?.name, email: createdUser?.email, role: createdUser?.role },
      });
      return createdUser;
    } catch (error) {
      if (isEmailTakenError(error)) throw new AppError(userMessagesCodes.EMAIL_ALREADY_REGISTERED, 400);
      throw error;
    }
  }

  async updateUser({ userId, body, authUser, auditCtx }) {
    if (!body || !userId) throw new AppError(userMessagesCodes.USER_NOT_FOUND, 404);
    // Identity only — role/profile changes go through the profiles endpoint. Legacy
    // guard: a non-admin isSuperSales editor may not set a non-STAFF role.
    if (
      authUser.role !== "ADMIN" &&
      authUser.role !== "SUPER_ADMIN" &&
      authUser.currentProfileKey === "SUPER_SALES" &&
      body.role &&
      body.role !== "STAFF"
    ) {
      throw new AppError(userMessagesCodes.USER_ROLE_NOT_ALLOWED, 403);
    }
    // Snapshot the pre-edit row for the before/after diff (best-effort; never breaks the
    // update). The diff+redaction helper captures only the edited fields (secrets redacted).
    let before = null;
    try {
      before = await userRepository.findUserProfileById({ userId });
    } catch {
      before = null;
    }
    try {
      const updatedUser = await editStaffUser(body, userId);
      await recordAction(auditCtx, {
        module: AUDIT_MODULES.USER,
        action: AUDIT_ACTIONS.USER_UPDATED,
        entityType: "User",
        entityId: Number(userId),
        summary: `User #${userId} updated`,
        before,
        after: updatedUser,
        allowedKeys: Object.keys(body),
      });
      return updatedUser;
    } catch (error) {
      if (isEmailTakenError(error)) throw new AppError(userMessagesCodes.EMAIL_ALREADY_REGISTERED, 400);
      throw error;
    }
  }

  async changeStatus({ userId, body }) {
    if (!userId || !body?.user) throw new AppError(userMessagesCodes.USER_NOT_FOUND, 404);
    return userRepository.toggleStatus({ userId, isActive: body.user.isActive });
  }

  async toggleStaffExtra({ userId, body }) {
    if (!userId) throw new AppError(userMessagesCodes.USER_NOT_FOUND, 404);
    // Whitelist the only legitimate staff-extra flags (privilege-escalation fix).
    // The Zod schema already strips/rejects anything else, but we re-pick here so the
    // repo never receives an unfiltered body (never password/role/isActive).
    const data = {};
    for (const key of STAFF_EXTRA_EDITABLE) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    return userRepository.toggleStaffExtra({ userId, data });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  ROLES / AUTO-ASSIGNMENTS / RESTRICTED COUNTRIES / MAX LEADS
  // ════════════════════════════════════════════════════════════════════════════
  async manageRoles({ userId, body, auditCtx }) {
    const result = await userRepository.updateUserRoles(userId, body);
    // Semantic audit: a user's role(s) were changed.
    await recordAction(auditCtx, {
      module: AUDIT_MODULES.USER,
      action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
      entityType: "User",
      entityId: Number(userId),
      summary: `User #${userId} roles changed`,
      after: body,
    });
    return result;
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DB-RELATIONAL PROFILES (admin assign / remove + active)
  // ════════════════════════════════════════════════════════════════════════════
  async listAssignableProfiles() {
    return { items: await userRepository.listAssignableProfiles() };
  }

  /**
   * Admin sets a user's assigned permission profiles + which is current. Diff-applies
   * the UserProfile rows, keeps the legacy role/flags/profile-string synced with the
   * new current (rollback safety), and audits each add/remove. A user must always
   * keep ≥1 profile. Propagation to the target's session is bounded by their token TTL
   * (refresh re-validates), matching the master staleness contract.
   */
  async updateUserProfiles({ authUser, userId, profileIds, currentProfileId }) {
    const targetId = Number(userId);
    if (!Array.isArray(profileIds) || profileIds.length === 0) {
      throw new AppError(userMessagesCodes.USER_NO_DATA_SENT, 400);
    }
    const desired = [...new Set(profileIds.map(Number))];
    const profiles = await userRepository.findProfilesByIds({ ids: desired });
    if (profiles.length !== desired.length) throw new AppError(userMessagesCodes.USER_ROLE_NOT_ALLOWED, 400);

    // Sales tier is mutually exclusive: at most one of Sales / Primary sales / Super sales
    // (hierarchical variants of the same STAFF-sales role). Other families combine freely.
    const SALES_TIER = ["NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES"];
    if (profiles.filter((p) => SALES_TIER.includes(p.key)).length > 1) {
      throw new AppError(userMessagesCodes.USER_SALES_TIER_EXCLUSIVE, 400);
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

    // Keep the legacy columns in sync with the new current profile (PROFILE_META owns
    // the isPrimary/isSuperSales flags; baseRole comes from the profile row / meta).
    const currentProfile = profiles.find((p) => p.id === nextCurrent);
    const meta = PROFILE_META[currentProfile.key] ?? {};
    const legacySync = {
      role: currentProfile.baseRole ?? meta.baseRole ?? null,
      isPrimary: Boolean(meta.isPrimary),
      isSuperSales: Boolean(meta.isSuperSales),
      profileKey: currentProfile.key,
    };

    await userRepository.setUserProfiles({
      userId: targetId,
      addIds,
      removeIds,
      currentProfileId: nextCurrent,
      legacySync,
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
  // GET /:userId/logs — today's notifications for the staff member (legacy
  // getNotificationForTodayByStaffId).
  async getLogs({ userId }) {
    return userRepository.getNotificationForTodayByStaffId(userId);
  }

  // GET /:userId/last-seen — monthly activity aggregation (legacy getUserLogs).
  async getLastSeen({ userId, query }) {
    return getUserLogs(userId, query.month, query.year);
  }
}

export const userUsecase = new UserUsecase();

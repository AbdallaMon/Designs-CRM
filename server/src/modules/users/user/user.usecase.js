// users/user usecase — business logic / orchestration. Prisma NEVER appears here (only
// repo calls). Behavior is ported 1:1 from the legacy handlers + services
// (routes/admin/admin.js, routes/shared/users.js, routes/shared/index.js, and
// services/main/admin/adminServices.js + services/main/shared/userProfile.js). Errors
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
import { AppError } from "../../../shared/errors/AppError.js";
import { userMessagesCodes as C } from "@dms/shared";
import { userRepository } from "./user.repository.js";
import {
  toSafeProfile,
  computeUserCapabilities,
  computeProfileCapabilities,
  isAdminTier,
} from "./user.dto.js";

// ── Lazy adapters to the not-yet-migrated services (behavior-preserving) ──────────
const legacyDefaults = {
  createStaffUser: (a) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.createStaffUser(a)),
  editStaffUser: (a, b) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.editStaffUser(a, b)),
  updateUserRoles: (a, b) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.updateUserRoles(a, b)),
  updateUserAutoAssignment: (a, b) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.updateUserAutoAssignment(a, b)),
  getUserLogs: (a, b, c) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.getUserLogs(a, b, c)),
  getNotificationForTodayByStaffId: (a) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.getNotificationForTodayByStaffId(a)),
};

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

export class UserUsecase {
  /**
   * @param {import("./user.repository.js").UserRepository} repository
   * @param {Partial<typeof legacyDefaults>} [legacy]
   */
  constructor(repository, legacy = {}) {
    this.repo = repository;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

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
      throw new AppError(C.USER_PROFILE_ACCESS_DENIED, 403);
    }
    const target = await this.repo.findUserIdById({ userId: targetId });
    if (!target) throw new AppError(C.USER_PROFILE_NOT_FOUND, 404);
    return { id: target.id, isSelf, adminTier: isAdminTier(authUser) };
  }

  // Write scope: same self-OR-admin rule (stricter behavior is in the field whitelist).
  async checkIfUserCanMutateProfile({ userId, authUser }) {
    const targetId = Number(userId);
    const isSelf = targetId === Number(authUser.id);
    if (!isSelf && !isAdminTier(authUser)) {
      throw new AppError(C.USER_PROFILE_MUTATE_DENIED, 403);
    }
    const target = await this.repo.findUserIdById({ userId: targetId });
    if (!target) throw new AppError(C.USER_PROFILE_NOT_FOUND, 404);
    return { id: target.id, isSelf, adminTier: isAdminTier(authUser) };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DIRECTORY (legacy /shared/all-chat-users , /shared/all-related-chat-users)
  // ════════════════════════════════════════════════════════════════════════════
  // `relatedOnly` selects the 4th-arg legacy call-shape: getAllUsers(.., false, true) —
  // only users already in a STAFF_TO_STAFF room with me. The default (`relatedOnly:
  // false`) is the 3rd-arg shape getAllUsers(.., true) — exclude users already chatting
  // with me. Both are role-narrowed for non-admins inside the repo (verbatim legacy).
  async directory({ query, authUser, relatedOnly = false }) {
    const items = await this.repo.findDirectory({
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
  async list({ query, authUser, page, limit, skip }) {
    const { users, total } = await this.repo.findManagementList({
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
  async allUsers({ query, authUser }) {
    const items = await this.repo.findDirectory({
      searchParams: { ...query },
      currentUser: authUser,
    });
    return { items: items.map((u) => ({ ...u, capabilities: computeUserCapabilities(u, authUser) })) };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  PROFILE (read / edit) — scope already enforced by the checker
  // ════════════════════════════════════════════════════════════════════════════
  async getProfile({ userId, authUser }) {
    const profile = await this.repo.findUserProfileById({ userId });
    if (!profile) throw new AppError(C.USER_PROFILE_NOT_FOUND, 404);
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
    const updated = await this.repo.updateUserProfile({ userId, data });
    return toSafeProfile(updated);
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  ADMIN CREATE / EDIT / STATUS / STAFF-EXTRA
  // ════════════════════════════════════════════════════════════════════════════
  async create({ body, authUser }) {
    if (!body || Object.keys(body).length === 0) {
      throw new AppError(C.USER_NO_DATA_SENT, 404);
    }
    // Legacy rule: an isSuperSales (non-admin) creator may only create STAFF users.
    if (
      authUser.isSuperSales &&
      authUser.role !== "ADMIN" &&
      authUser.role !== "SUPER_ADMIN" &&
      (body.role === "ADMIN" || body.role === "SUPER_ADMIN" || body.role !== "STAFF")
    ) {
      throw new AppError(C.USER_ROLE_NOT_ALLOWED, 403);
    }
    try {
      return await this.legacy.createStaffUser(body);
    } catch (error) {
      if (isEmailTakenError(error)) throw new AppError(C.EMAIL_ALREADY_REGISTERED, 400);
      throw error;
    }
  }

  async update({ userId, body, authUser }) {
    if (!body || !userId) throw new AppError(C.USER_NOT_FOUND, 404);
    // Legacy rule: a non-admin isSuperSales editor may not change a role to non-STAFF.
    if (
      authUser.role !== "ADMIN" &&
      authUser.role !== "SUPER_ADMIN" &&
      authUser.isSuperSales &&
      body.role &&
      body.role !== "STAFF"
    ) {
      throw new AppError(C.USER_ROLE_NOT_ALLOWED, 403);
    }
    try {
      return await this.legacy.editStaffUser(body, userId);
    } catch (error) {
      if (isEmailTakenError(error)) throw new AppError(C.EMAIL_ALREADY_REGISTERED, 400);
      throw error;
    }
  }

  async changeStatus({ userId, body }) {
    if (!userId || !body?.user) throw new AppError(C.USER_NOT_FOUND, 404);
    return this.repo.toggleStatus({ userId, isActive: body.user.isActive });
  }

  async toggleStaffExtra({ userId, body }) {
    if (!userId) throw new AppError(C.USER_NOT_FOUND, 404);
    // Whitelist the only legitimate staff-extra flags (privilege-escalation fix).
    // The Zod schema already strips/rejects anything else, but we re-pick here so the
    // repo never receives an unfiltered body (never password/role/isActive).
    const data = {};
    for (const key of STAFF_EXTRA_EDITABLE) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    return this.repo.toggleStaffExtra({ userId, data });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  ROLES / AUTO-ASSIGNMENTS / RESTRICTED COUNTRIES / MAX LEADS
  // ════════════════════════════════════════════════════════════════════════════
  async manageRoles({ userId, body }) {
    return this.legacy.updateUserRoles(userId, body);
  }

  async getAutoAssignments({ userId }) {
    return this.repo.findAutoAssignments({ userId: Number(userId) });
  }

  async updateAutoAssignments({ userId, body }) {
    return this.legacy.updateUserAutoAssignment(userId, body);
  }

  async getRestrictedCountries({ userId }) {
    return this.repo.findRestrictedCountries({ userId });
  }

  async updateRestrictedCountries({ userId, body }) {
    return this.repo.updateRestrictedCountries({ userId, countries: body.countries });
  }

  async setMaxLeads({ userId, body }) {
    return this.repo.updateMaxLeads({ userId, maxLeadsCounts: body.maxLeadsCounts });
  }

  async setMaxLeadsPerDay({ userId, body }) {
    return this.repo.updateMaxLeadsPerDay({ userId, maxLeadCountPerDay: body.maxLeadCountPerDay });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  LOGS / LAST-SEEN
  // ════════════════════════════════════════════════════════════════════════════
  // GET /:userId/logs — today's notifications for the staff member (legacy
  // getNotificationForTodayByStaffId).
  async getLogs({ userId }) {
    return this.legacy.getNotificationForTodayByStaffId(userId);
  }

  // GET /:userId/last-seen — monthly activity aggregation (legacy getUserLogs).
  async getLastSeen({ userId, query }) {
    return this.legacy.getUserLogs(userId, query.month, query.year);
  }
}

export const userUsecase = new UserUsecase(userRepository);

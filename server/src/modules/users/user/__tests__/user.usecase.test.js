import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the audit infra seam so user usecases can be asserted without a DB.
vi.mock("../../../../infra/audit/record-action.js", () => ({
  recordAction: vi.fn(),
  auditCtxFromReq: vi.fn(() => ({})),
}));

// DI removed: the usecase calls the imported `userRepository` singleton directly (and the
// module-level create/update record helpers delegate their Prisma writes to it).
// Mock the singleton so the usecase can be asserted without a DB.
vi.mock("../user.repo.js", () => ({
  userRepository: {
    findUserIdById: vi.fn(),
    findDirectory: vi.fn(),
    findManagementList: vi.fn(),
    findUserProfileById: vi.fn(),
    updateUserProfile: vi.fn(),
    toggleStatus: vi.fn(),
    createUserRecord: vi.fn(),
    updateUserRecord: vi.fn(),
  },
}));

import { recordAction } from "../../../../infra/audit/record-action.js";
import { userUsecase } from "../user.usecase.js";
import { userRepository } from "../user.repo.js";
import { userMessagesCodes } from "@dms/shared";

beforeEach(() => {
  vi.clearAllMocks();
  userRepository.findDirectory.mockResolvedValue([]);
  userRepository.findManagementList.mockResolvedValue({ users: [], total: 0 });
});

const admin = {
  id: 1,
  currentProfileKey: "ADMIN",
  isAdminTier: true,
  permissions: [],
};
const superSales = {
  id: 2,
  currentProfileKey: "SUPER_SALES",
  isAdminTier: false,
  permissions: [],
};
const staff = {
  id: 3,
  currentProfileKey: "NORMAL_SALES",
  isAdminTier: false,
  permissions: [],
};
const retainedAdminFields = {
  id: 4,
  role: "ADMIN",
  subRoles: ["SUPER_ADMIN"],
  isAdminTier: false,
  permissions: [],
};

// ════════════════════════════════════════════════════════════════════════════
//  PROFILE SCOPE — the IDOR fix (allow vs deny)
// ════════════════════════════════════════════════════════════════════════════
describe("UserUsecase profile scope checkers (IDOR fix)", () => {
  it("ACCESS: a user may view their OWN profile", async () => {
    userRepository.findUserIdById.mockResolvedValue({ id: 3 });
    const scope = await userUsecase.checkIfUserCanAccessProfile({ userId: 3, authUser: staff });
    expect(scope).toMatchObject({ id: 3, isSelf: true });
  });

  it("ACCESS: a non-admin user is DENIED another user's profile (403, no existence leak)", async () => {
    await expect(
      userUsecase.checkIfUserCanAccessProfile({ userId: 99, authUser: staff }),
    ).rejects.toMatchObject({ statusCode: 403, message: userMessagesCodes.USER_PROFILE_ACCESS_DENIED });
    // we reject BEFORE touching the DB — no existence probe.
    expect(userRepository.findUserIdById).not.toHaveBeenCalled();
  });

  it("ACCESS: an admin-tier user may view ANY profile", async () => {
    userRepository.findUserIdById.mockResolvedValue({ id: 99 });
    const scope = await userUsecase.checkIfUserCanAccessProfile({ userId: 99, authUser: admin });
    expect(scope).toMatchObject({ id: 99, isSelf: false, adminTier: true });
  });

  it("ACCESS: SUPER_SALES does not become an admin profile", async () => {
    await expect(
      userUsecase.checkIfUserCanAccessProfile({
        userId: 50,
        authUser: superSales,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("ACCESS: retained role fields do not grant admin-tier access", async () => {
    await expect(
      userUsecase.checkIfUserCanAccessProfile({
        userId: 77,
        authUser: retainedAdminFields,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("MUTATE: a non-admin is DENIED mutating another user's profile (403)", async () => {
    await expect(
      userUsecase.checkIfUserCanMutateProfile({ userId: 99, authUser: staff }),
    ).rejects.toMatchObject({ statusCode: 403, message: userMessagesCodes.USER_PROFILE_MUTATE_DENIED });
  });

  it("ACCESS: a self target that does not exist → 404", async () => {
    userRepository.findUserIdById.mockResolvedValue(null);
    await expect(
      userUsecase.checkIfUserCanAccessProfile({ userId: 3, authUser: staff }),
    ).rejects.toMatchObject({ statusCode: 404, message: userMessagesCodes.USER_PROFILE_NOT_FOUND });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  PROFILE OUTPUT — password stripping + self-edit whitelist (priv-esc fix)
// ════════════════════════════════════════════════════════════════════════════
describe("UserUsecase.getProfile output safety", () => {
  it("strips the password hash from the returned profile", async () => {
    userRepository.findUserProfileById.mockResolvedValue({ id: 3, name: "S", password: "HASH", role: "STAFF" });
    const out = await userUsecase.getProfile({ userId: 3, authUser: staff });
    expect(out.password).toBeUndefined();
    expect(out.name).toBe("S");
    expect(out.capabilities).toBeDefined();
  });

  it("strips retained authorization fields from profile output", async () => {
    userRepository.findUserProfileById.mockResolvedValue({
      id: 9,
      name: "A",
      password: "HASH",
      role: "STAFF",
      subRoles: [{ id: 1, subRole: "ACCOUNTANT", userId: 9 }],
    });
    const out = await userUsecase.getProfile({ userId: 9, authUser: admin });
    expect(out.password).toBeUndefined();
    expect(out.subRoles).toBeUndefined();
    expect(out.role).toBeUndefined();
  });
});

describe("UserUsecase.updateProfile self-edit whitelist (privilege-escalation fix)", () => {
  it("a non-admin self-edit drops role/isActive/password and keeps safe fields", async () => {
    userRepository.updateUserProfile.mockImplementation(async ({ data }) => ({ id: 3, ...data }));
    await userUsecase.updateProfile({
      userId: 3,
      body: { name: "New", role: "ADMIN", isActive: false, password: "x", isSuperSales: true },
      scoped: { isSelf: true, adminTier: false },
    });
    const passed = userRepository.updateUserProfile.mock.calls[0][0].data;
    expect(passed).toEqual({ name: "New" });
    expect(passed.role).toBeUndefined();
    expect(passed.isActive).toBeUndefined();
    expect(passed.password).toBeUndefined();
    expect(passed.isSuperSales).toBeUndefined();
  });

  it("an admin-tier edit applies the admin allow-list (name/role) and drops unknown keys (FIX 2)", async () => {
    userRepository.updateUserProfile.mockImplementation(async ({ data }) => ({ id: 9, ...data }));
    await userUsecase.updateProfile({
      userId: 9,
      body: { name: "X", role: "STAFF", bogus: "drop-me", id: 999 },
      scoped: { isSelf: false, adminTier: true },
    });
    const passed = userRepository.updateUserProfile.mock.calls[0][0].data;
    expect(passed).toEqual({ name: "X" });
    expect(passed.bogus).toBeUndefined();
    expect(passed.id).toBeUndefined();
  });

  it("an admin-tier edit HASHES the password (never stores plaintext) (FIX 2)", async () => {
    userRepository.updateUserProfile.mockImplementation(async ({ data }) => ({ id: 9, ...data }));
    await userUsecase.updateProfile({
      userId: 9,
      body: { password: "plaintext", role: "SUPER_ADMIN" },
      scoped: { isSelf: false, adminTier: true },
    });
    const passed = userRepository.updateUserProfile.mock.calls[0][0].data;
    expect(passed.password).toBeDefined();
    expect(passed.password).not.toBe("plaintext");
    // bcrypt hash with cost 8 ("$2b$08$...").
    expect(passed.password).toMatch(/^\$2[aby]\$08\$/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  DIRECTORY — call-shape flags (legacy 3rd/4th arg) + envelope
// ════════════════════════════════════════════════════════════════════════════
describe("UserUsecase.directory", () => {
  it("default shape excludes users already chatting with me (checkIfNotHasRelatedChat)", async () => {
    userRepository.findDirectory.mockResolvedValue([{ id: 5 }]);
    const out = await userUsecase.getDirectory({ query: { role: "STAFF" }, authUser: staff });
    expect(out).toEqual({ items: [{ id: 5 }] });
    expect(userRepository.findDirectory).toHaveBeenCalledWith(
      expect.objectContaining({ checkIfNotHasRelatedChat: true, checkIfHasRelatedChat: false }),
    );
  });

  it("relatedOnly shape includes only users already chatting with me (checkIfHasRelatedChat)", async () => {
    userRepository.findDirectory.mockResolvedValue([]);
    await userUsecase.getDirectory({ query: {}, authUser: staff, relatedOnly: true });
    expect(userRepository.findDirectory).toHaveBeenCalledWith(
      expect.objectContaining({ checkIfNotHasRelatedChat: false, checkIfHasRelatedChat: true }),
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  MANAGEMENT LIST — pagination envelope + capabilities
// ════════════════════════════════════════════════════════════════════════════
describe("UserUsecase.list", () => {
  it("returns the contract pagination envelope with per-record capabilities", async () => {
    userRepository.findManagementList.mockResolvedValue({ users: [{ id: 7 }], total: 1 });
    const out = await userUsecase.listUsers({ query: {}, authUser: admin, page: 1, limit: 10, skip: 0 });
    expect(out).toMatchObject({ total: 1, page: 1, pageSize: 10 });
    expect(out.items[0].capabilities).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN CREATE / UPDATE — legacy role-constraint + P2002 mapping
// ════════════════════════════════════════════════════════════════════════════
describe("UserUsecase.create", () => {
  it("ignores retained authorization fields on direct usecase calls", async () => {
    userRepository.createUserRecord.mockResolvedValue({ id: 11 });
    await userUsecase.createUser({
      body: {
        role: "ADMIN",
        isSuperSales: true,
        email: "a",
        password: "p",
        name: "n",
      },
      authUser: superSales,
    });
    expect(userRepository.createUserRecord.mock.calls[0][0].user).toEqual({
      email: "a",
      password: "p",
      name: "n",
    });
  });

  it("maps a Prisma P2002-on-email to EMAIL_ALREADY_REGISTERED (legacy 400)", async () => {
    const err = Object.assign(new Error("dup"), { code: "P2002", meta: { target: ["email"] } });
    userRepository.createUserRecord.mockRejectedValue(err);
    await expect(
      userUsecase.createUser({ body: { email: "a", password: "p", name: "n" }, authUser: admin }),
    ).rejects.toMatchObject({ statusCode: 400, message: userMessagesCodes.EMAIL_ALREADY_REGISTERED });
  });

  it("creates a valid user via the legacy adapter", async () => {
    const created = { id: 11 };
    userRepository.createUserRecord.mockResolvedValue(created);
    const out = await userUsecase.createUser({ body: { email: "a", password: "p", name: "n" }, authUser: admin });
    expect(out).toEqual(created);
  });
});

describe("UserUsecase.changeStatus", () => {
  it("toggles isActive via the repo (single-field write)", async () => {
    userRepository.toggleStatus.mockResolvedValue({ id: 4 });
    await userUsecase.changeStatus({ userId: 4, body: { user: { isActive: true } } });
    expect(userRepository.toggleStatus).toHaveBeenCalledWith({ userId: 4, isActive: true });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN CREATE / UPDATE are IDENTITY-ONLY now — role/profile assignment moved to
//  the profiles endpoint (PUT /users/:id/profiles). The form no longer sends a
//  role/profile, so create/update just pass the identity body to the frozen
//  legacy adapters (a new user defaults to STAFF).
// ════════════════════════════════════════════════════════════════════════════
describe("UserUsecase.update (identity only)", () => {
  it("passes the identity body to the update record repository method", async () => {
    // The module-level helper forwards the identity body to the repo with a
    // hashedPassword only when a password is present. No password here → hashedPassword undefined.
    userRepository.updateUserRecord.mockImplementation(async ({ user, userId }) => ({ id: userId, ...user }));
    await userUsecase.updateUser({ userId: 7, body: { name: "New" }, authUser: admin });
    expect(userRepository.updateUserRecord).toHaveBeenCalledWith({ user: { name: "New" }, userId: 7, hashedPassword: undefined });
  });

  it("rejects an update containing only retained authorization fields", async () => {
    await expect(
      userUsecase.updateUser({ userId: 7, body: { role: "ADMIN" }, authUser: superSales }),
    ).rejects.toMatchObject({ statusCode: 400, message: userMessagesCodes.USER_NO_DATA_SENT });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  SEMANTIC AUDIT — create / update emit ActionAuditLog events (mocked seam)
// ════════════════════════════════════════════════════════════════════════════
describe("UserUsecase semantic audit events", () => {
  it("update: records USER_UPDATED once with before/after (secrets auto-redacted by the helper)", async () => {
    userRepository.findUserProfileById.mockResolvedValue({ id: 7, name: "Old", password: "HASH" });
    userRepository.updateUserRecord.mockResolvedValue({ id: 7, name: "New", password: "NEWHASH" });

    await userUsecase.updateUser({ userId: 7, body: { name: "New", password: "x" }, authUser: { role: "ADMIN" }, auditCtx: {} });

    expect(recordAction).toHaveBeenCalledTimes(1);
    expect(recordAction).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        module: "user",
        action: "USER_UPDATED",
        entityType: "User",
        entityId: 7,
        allowedKeys: ["password", "name"],
      }),
    );
  });

  it("create: records USER_CREATED once with the new user id", async () => {
    const created = { id: 11, name: "N", email: "a@b.com" };
    userRepository.createUserRecord.mockResolvedValue(created);

    await userUsecase.createUser({ body: { email: "a@b.com", password: "p", name: "N" }, authUser: admin, auditCtx: {} });

    expect(recordAction).toHaveBeenCalledTimes(1);
    expect(recordAction).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        module: "user",
        action: "USER_CREATED",
        entityType: "User",
        entityId: 11,
      }),
    );
  });
});

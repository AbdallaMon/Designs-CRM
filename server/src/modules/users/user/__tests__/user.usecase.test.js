import { describe, it, expect, vi } from "vitest";

import { UserUsecase } from "../user.usecase.js";
import { userMessagesCodes } from "@dms/shared";

/** Minimal fake repository — only the methods the tested usecases touch. */
function makeRepo(overrides = {}) {
  return {
    findUserIdById: vi.fn(),
    findDirectory: vi.fn().mockResolvedValue([]),
    findManagementList: vi.fn().mockResolvedValue({ users: [], total: 0 }),
    findUserProfileById: vi.fn(),
    updateUserProfile: vi.fn(),
    findAutoAssignments: vi.fn(),
    findRestrictedCountries: vi.fn(),
    updateRestrictedCountries: vi.fn(),
    updateMaxLeads: vi.fn(),
    updateMaxLeadsPerDay: vi.fn(),
    toggleStatus: vi.fn(),
    toggleStaffExtra: vi.fn(),
    ...overrides,
  };
}

const admin = { id: 1, role: "ADMIN", permissions: [] };
const superSales = { id: 2, role: "STAFF", isSuperSales: true, permissions: [] };
const staff = { id: 3, role: "STAFF", permissions: [] };
// A user whose BASE role is non-admin but who holds an ADMIN sub-role (string[] shape,
// as carried on req.auth from the token payload).
const subRoleAdmin = { id: 4, role: "STAFF", subRoles: ["ADMIN"], permissions: [] };

// ════════════════════════════════════════════════════════════════════════════
//  PROFILE SCOPE — the IDOR fix (allow vs deny)
// ════════════════════════════════════════════════════════════════════════════
describe("UserUsecase profile scope checkers (IDOR fix)", () => {
  it("ACCESS: a user may view their OWN profile", async () => {
    const repo = makeRepo({ findUserIdById: vi.fn().mockResolvedValue({ id: 3 }) });
    const usecase = new UserUsecase(repo);
    const scope = await usecase.checkIfUserCanAccessProfile({ userId: 3, authUser: staff });
    expect(scope).toMatchObject({ id: 3, isSelf: true });
  });

  it("ACCESS: a non-admin user is DENIED another user's profile (403, no existence leak)", async () => {
    const repo = makeRepo({ findUserIdById: vi.fn() });
    const usecase = new UserUsecase(repo);
    await expect(
      usecase.checkIfUserCanAccessProfile({ userId: 99, authUser: staff }),
    ).rejects.toMatchObject({ statusCode: 403, message: userMessagesCodes.USER_PROFILE_ACCESS_DENIED });
    // we reject BEFORE touching the DB — no existence probe.
    expect(repo.findUserIdById).not.toHaveBeenCalled();
  });

  it("ACCESS: an admin-tier user may view ANY profile", async () => {
    const repo = makeRepo({ findUserIdById: vi.fn().mockResolvedValue({ id: 99 }) });
    const usecase = new UserUsecase(repo);
    const scope = await usecase.checkIfUserCanAccessProfile({ userId: 99, authUser: admin });
    expect(scope).toMatchObject({ id: 99, isSelf: false, adminTier: true });
  });

  it("ACCESS: isSuperSales is treated as admin-tier (legacy isAdmin union)", async () => {
    const repo = makeRepo({ findUserIdById: vi.fn().mockResolvedValue({ id: 50 }) });
    const usecase = new UserUsecase(repo);
    const scope = await usecase.checkIfUserCanAccessProfile({ userId: 50, authUser: superSales });
    expect(scope).toMatchObject({ id: 50, adminTier: true });
  });

  it("ACCESS: a sub-role-ADMIN user is admin-tier and may view ANY profile (FIX 3)", async () => {
    const repo = makeRepo({ findUserIdById: vi.fn().mockResolvedValue({ id: 77 }) });
    const usecase = new UserUsecase(repo);
    const scope = await usecase.checkIfUserCanAccessProfile({ userId: 77, authUser: subRoleAdmin });
    expect(scope).toMatchObject({ id: 77, isSelf: false, adminTier: true });
  });

  it("MUTATE: a non-admin is DENIED mutating another user's profile (403)", async () => {
    const usecase = new UserUsecase(makeRepo());
    await expect(
      usecase.checkIfUserCanMutateProfile({ userId: 99, authUser: staff }),
    ).rejects.toMatchObject({ statusCode: 403, message: userMessagesCodes.USER_PROFILE_MUTATE_DENIED });
  });

  it("ACCESS: a self target that does not exist → 404", async () => {
    const repo = makeRepo({ findUserIdById: vi.fn().mockResolvedValue(null) });
    const usecase = new UserUsecase(repo);
    await expect(
      usecase.checkIfUserCanAccessProfile({ userId: 3, authUser: staff }),
    ).rejects.toMatchObject({ statusCode: 404, message: userMessagesCodes.USER_PROFILE_NOT_FOUND });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  PROFILE OUTPUT — password stripping + self-edit whitelist (priv-esc fix)
// ════════════════════════════════════════════════════════════════════════════
describe("UserUsecase.getProfile output safety", () => {
  it("strips the password hash from the returned profile", async () => {
    const repo = makeRepo({
      findUserProfileById: vi.fn().mockResolvedValue({ id: 3, name: "S", password: "HASH", role: "STAFF" }),
    });
    const usecase = new UserUsecase(repo);
    const out = await usecase.getProfile({ userId: 3, authUser: staff });
    expect(out.password).toBeUndefined();
    expect(out.name).toBe("S");
    expect(out.capabilities).toBeDefined();
  });

  it("passes subRoles through (admin profile controls) while stripping password (FIX 4)", async () => {
    const repo = makeRepo({
      findUserProfileById: vi.fn().mockResolvedValue({
        id: 9,
        name: "A",
        password: "HASH",
        role: "STAFF",
        subRoles: [{ id: 1, subRole: "ACCOUNTANT", userId: 9 }],
      }),
    });
    const usecase = new UserUsecase(repo);
    const out = await usecase.getProfile({ userId: 9, authUser: admin });
    expect(out.password).toBeUndefined();
    expect(out.subRoles).toEqual([{ id: 1, subRole: "ACCOUNTANT", userId: 9 }]);
  });
});

describe("UserUsecase.updateProfile self-edit whitelist (privilege-escalation fix)", () => {
  it("a non-admin self-edit drops role/isActive/password and keeps safe fields", async () => {
    const repo = makeRepo({
      updateUserProfile: vi.fn(async ({ data }) => ({ id: 3, ...data })),
    });
    const usecase = new UserUsecase(repo);
    await usecase.updateProfile({
      userId: 3,
      body: { name: "New", role: "ADMIN", isActive: false, password: "x", isSuperSales: true },
      scoped: { isSelf: true, adminTier: false },
    });
    const passed = repo.updateUserProfile.mock.calls[0][0].data;
    expect(passed).toEqual({ name: "New" });
    expect(passed.role).toBeUndefined();
    expect(passed.isActive).toBeUndefined();
    expect(passed.password).toBeUndefined();
    expect(passed.isSuperSales).toBeUndefined();
  });

  it("an admin-tier edit applies the admin allow-list (name/role) and drops unknown keys (FIX 2)", async () => {
    const repo = makeRepo({
      updateUserProfile: vi.fn(async ({ data }) => ({ id: 9, ...data })),
    });
    const usecase = new UserUsecase(repo);
    await usecase.updateProfile({
      userId: 9,
      body: { name: "X", role: "STAFF", bogus: "drop-me", id: 999 },
      scoped: { isSelf: false, adminTier: true },
    });
    const passed = repo.updateUserProfile.mock.calls[0][0].data;
    expect(passed).toEqual({ name: "X", role: "STAFF" });
    expect(passed.bogus).toBeUndefined();
    expect(passed.id).toBeUndefined();
  });

  it("an admin-tier edit HASHES the password (never stores plaintext) (FIX 2)", async () => {
    const repo = makeRepo({
      updateUserProfile: vi.fn(async ({ data }) => ({ id: 9, ...data })),
    });
    const usecase = new UserUsecase(repo);
    await usecase.updateProfile({
      userId: 9,
      body: { password: "plaintext", role: "SUPER_ADMIN" },
      scoped: { isSelf: false, adminTier: true },
    });
    const passed = repo.updateUserProfile.mock.calls[0][0].data;
    expect(passed.password).toBeDefined();
    expect(passed.password).not.toBe("plaintext");
    // bcrypt hash with cost 8 ("$2b$08$...").
    expect(passed.password).toMatch(/^\$2[aby]\$08\$/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  STAFF-EXTRA — whitelist (mass-assignment / privilege-escalation fix)
// ════════════════════════════════════════════════════════════════════════════
describe("UserUsecase.toggleStaffExtra whitelist (FIX 1)", () => {
  it("passes ONLY the staff flags and never password/role/isActive to the repo", async () => {
    const repo = makeRepo({ toggleStaffExtra: vi.fn().mockResolvedValue({ id: 5 }) });
    const usecase = new UserUsecase(repo);
    await usecase.toggleStaffExtra({
      userId: 5,
      body: { isSuperSales: true, password: "x", role: "ADMIN", isActive: false, isPrimary: true },
    });
    const passed = repo.toggleStaffExtra.mock.calls[0][0].data;
    expect(passed).toEqual({ isSuperSales: true, isPrimary: true });
    expect(passed.password).toBeUndefined();
    expect(passed.role).toBeUndefined();
    expect(passed.isActive).toBeUndefined();
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  DIRECTORY — call-shape flags (legacy 3rd/4th arg) + envelope
// ════════════════════════════════════════════════════════════════════════════
describe("UserUsecase.directory", () => {
  it("default shape excludes users already chatting with me (checkIfNotHasRelatedChat)", async () => {
    const repo = makeRepo({ findDirectory: vi.fn().mockResolvedValue([{ id: 5 }]) });
    const usecase = new UserUsecase(repo);
    const out = await usecase.directory({ query: { role: "STAFF" }, authUser: staff });
    expect(out).toEqual({ items: [{ id: 5 }] });
    expect(repo.findDirectory).toHaveBeenCalledWith(
      expect.objectContaining({ checkIfNotHasRelatedChat: true, checkIfHasRelatedChat: false }),
    );
  });

  it("relatedOnly shape includes only users already chatting with me (checkIfHasRelatedChat)", async () => {
    const repo = makeRepo({ findDirectory: vi.fn().mockResolvedValue([]) });
    const usecase = new UserUsecase(repo);
    await usecase.directory({ query: {}, authUser: staff, relatedOnly: true });
    expect(repo.findDirectory).toHaveBeenCalledWith(
      expect.objectContaining({ checkIfNotHasRelatedChat: false, checkIfHasRelatedChat: true }),
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  MANAGEMENT LIST — pagination envelope + capabilities
// ════════════════════════════════════════════════════════════════════════════
describe("UserUsecase.list", () => {
  it("returns the contract pagination envelope with per-record capabilities", async () => {
    const repo = makeRepo({
      findManagementList: vi.fn().mockResolvedValue({ users: [{ id: 7 }], total: 1 }),
    });
    const usecase = new UserUsecase(repo);
    const out = await usecase.list({ query: {}, authUser: admin, page: 1, limit: 10, skip: 0 });
    expect(out).toMatchObject({ total: 1, page: 1, pageSize: 10 });
    expect(out.items[0].capabilities).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN CREATE / UPDATE — legacy role-constraint + P2002 mapping
// ════════════════════════════════════════════════════════════════════════════
describe("UserUsecase.create", () => {
  it("rejects an isSuperSales (non-admin) creating a non-STAFF user (legacy rule)", async () => {
    const usecase = new UserUsecase(makeRepo(), { createStaffUser: vi.fn() });
    await expect(
      usecase.create({ body: { role: "ADMIN", email: "a", password: "p", name: "n" }, authUser: superSales }),
    ).rejects.toMatchObject({ statusCode: 403, message: userMessagesCodes.USER_ROLE_NOT_ALLOWED });
  });

  it("maps a Prisma P2002-on-email to EMAIL_ALREADY_REGISTERED (legacy 400)", async () => {
    const err = Object.assign(new Error("dup"), { code: "P2002", meta: { target: ["email"] } });
    const usecase = new UserUsecase(makeRepo(), { createStaffUser: vi.fn().mockRejectedValue(err) });
    await expect(
      usecase.create({ body: { role: "STAFF", email: "a", password: "p", name: "n" }, authUser: admin }),
    ).rejects.toMatchObject({ statusCode: 400, message: userMessagesCodes.EMAIL_ALREADY_REGISTERED });
  });

  it("creates a valid user via the legacy adapter", async () => {
    const created = { id: 11, role: "STAFF" };
    const usecase = new UserUsecase(makeRepo(), { createStaffUser: vi.fn().mockResolvedValue(created) });
    const out = await usecase.create({ body: { role: "STAFF", email: "a", password: "p", name: "n" }, authUser: admin });
    expect(out).toEqual(created);
  });
});

describe("UserUsecase.changeStatus", () => {
  it("toggles isActive via the repo (single-field write)", async () => {
    const repo = makeRepo({ toggleStatus: vi.fn().mockResolvedValue({ id: 4 }) });
    const usecase = new UserUsecase(repo);
    await usecase.changeStatus({ userId: 4, body: { user: { isActive: true } } });
    expect(repo.toggleStatus).toHaveBeenCalledWith({ userId: 4, isActive: true });
  });
});

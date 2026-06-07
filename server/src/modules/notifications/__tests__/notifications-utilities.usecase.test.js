import { describe, it, expect, vi } from "vitest";

import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  PERMISSIONS,
  getEffectivePermissions,
  USER_ROLES,
  authMessagesCodes,
  notificationsMessagesCodes,
  utilitiesMessagesCodes,
} from "@dms/shared";

import { NotificationUsecase } from "../notification.usecase.js";
import { NotificationValidation } from "../notification.validation.js";
import { UtilityUsecase } from "../../utilities/utility.usecase.js";
import { UtilityValidation } from "../../utilities/utility.validation.js";

const NC = notificationsMessagesCodes;
const UC = utilitiesMessagesCodes;
const PN = PERMISSIONS.NOTIFICATION;
const PU = PERMISSIONS.UTILITY;

function makeReq(role, id = 1, isSuperSales = false) {
  const { permissions, permissionsByModule } = getEffectivePermissions({ role, isSuperSales });
  return { auth: { id, role, isSuperSales, permissions, permissionsByModule } };
}

// Every authed role behind the legacy SHARED gate.
const SHARED_ROLES = [
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.STAFF,
  USER_ROLES.THREE_D_DESIGNER,
  USER_ROLES.TWO_D_DESIGNER,
  USER_ROLES.TWO_D_EXECUTOR,
  USER_ROLES.ACCOUNTANT,
  USER_ROLES.SUPER_SALES,
  USER_ROLES.CONTACT_INITIATOR,
];

// ════════════════════════════════════════════════════════════════════════════
//  PERMISSION GATE — notification + utility codes granted to every authed role
// ════════════════════════════════════════════════════════════════════════════
describe("notifications + utilities permission grants (every authed role)", () => {
  for (const role of SHARED_ROLES) {
    it(`${role} holds notification.list, notification.mark_read and the utility codes`, () => {
      const { auth } = makeReq(role);
      expect(auth.permissions).toContain(PN.LIST);
      expect(auth.permissions).toContain(PN.MARK_READ);
      expect(auth.permissions).toContain(PU.FIXED_DATA_LIST);
      expect(auth.permissions).toContain(PU.MODEL_READ);
      expect(auth.permissions).toContain(PU.SEARCH);
    });
  }

  it("an authed role passes the notification list + mark-read gates", () => {
    const req = makeReq(USER_ROLES.STAFF);
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PN.LIST])(req, {}, next);
    AuthMiddleware.requirePermissions([PN.MARK_READ])(req, {}, next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenNthCalledWith(1);
    expect(next).toHaveBeenNthCalledWith(2);
  });

  it("an UNAUTHENTICATED request (no req.auth) is rejected by the gate (the legacy hole closed)", () => {
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PN.LIST])({}, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe(authMessagesCodes.UNAUTHORIZED);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  NOTIFICATION SELF-SCOPE — the IDOR fix (subject is ALWAYS req.auth.id)
// ════════════════════════════════════════════════════════════════════════════
describe("NotificationUsecase self-scope (IDOR fix)", () => {
  function makeRepo(overrides = {}) {
    return {
      list: vi.fn().mockResolvedValue({ notifications: [], total: 0 }),
      markAllReadForUser: vi.fn().mockResolvedValue({ count: 3 }),
      ...overrides,
    };
  }

  it("list scopes by the AUTHENTICATED user id, IGNORING a client-supplied userId/staffId", async () => {
    const repo = makeRepo();
    const usecase = new NotificationUsecase(repo);
    // Attacker tries to read user 999's notifications via query params.
    await usecase.list({
      query: { userId: "999", staffId: "999", page: "1", limit: "9" },
      authUser: { id: 7 },
      unreadOnly: false,
    });
    const arg = repo.list.mock.calls[0][0];
    expect(arg.userId).toBe(7); // ← derived from auth, NOT from query
    expect(arg.userId).not.toBe(999);
  });

  it("list forwards unreadOnly and pagination, returns the {items,total,page,pageSize} contract", async () => {
    const repo = makeRepo({
      list: vi.fn().mockResolvedValue({ notifications: [{ id: 1 }], total: 1 }),
    });
    const usecase = new NotificationUsecase(repo);
    const result = await usecase.list({
      query: { page: "2", limit: "5" },
      authUser: { id: 7 },
      unreadOnly: true,
    });
    const arg = repo.list.mock.calls[0][0];
    expect(arg.unreadOnly).toBe(true);
    expect(arg.skip).toBe(5); // (2-1)*5
    expect(arg.take).toBe(5);
    expect(result).toEqual({ items: [{ id: 1 }], total: 1, page: 2, pageSize: 5 });
  });

  it("list parses an optional date range from `filters`, but never a target user", async () => {
    const repo = makeRepo();
    const usecase = new NotificationUsecase(repo);
    await usecase.list({
      query: {
        filters: JSON.stringify({ range: { startDate: "2026-01-01", endDate: "2026-02-01" }, staffId: 999 }),
      },
      authUser: { id: 7 },
      unreadOnly: false,
    });
    const arg = repo.list.mock.calls[0][0];
    expect(arg.userId).toBe(7);
    expect(arg.range).toEqual({ startDate: "2026-01-01", endDate: "2026-02-01" });
  });

  it("markRead marks ONLY the authenticated user's notifications (never a :userId param)", async () => {
    const repo = makeRepo();
    const usecase = new NotificationUsecase(repo);
    const result = await usecase.markRead({ authUser: { id: 7 } });
    expect(repo.markAllReadForUser).toHaveBeenCalledWith({ userId: 7 });
    expect(result).toEqual({ updated: 3 });
  });

  it("the buildWhere repo helper always binds the userId into the where clause", async () => {
    const { NotificationRepository } = await import("../notification.repository.js");
    const repo = new NotificationRepository();
    const where = repo.buildWhere({ userId: 7, range: null, unreadOnly: true });
    expect(where.userId).toBe(7);
    expect(where.isRead).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  NOTIFICATION VALIDATION — mark-read body is strict (no smuggled userId)
// ════════════════════════════════════════════════════════════════════════════
describe("NotificationValidation", () => {
  it("markRead rejects a body carrying a target userId (.strict mass-assignment defense)", () => {
    const r = NotificationValidation.markRead.safeParse({ userId: 999 });
    expect(r.success).toBe(false);
  });

  it("markRead accepts an empty body", () => {
    const r = NotificationValidation.markRead.safeParse({});
    expect(r.success).toBe(true);
  });

  it("listQuery coerces pagination and accepts a filters string", () => {
    const r = NotificationValidation.listQuery.safeParse({ page: "2", limit: "5", filters: "{}" });
    expect(r.success).toBe(true);
    expect(r.data.page).toBe(2);
    expect(r.data.limit).toBe(5);
  });

  it("listQuery rejects an over-max limit", () => {
    const r = NotificationValidation.listQuery.safeParse({ limit: "9999" });
    expect(r.success).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  UTILITY — generic-model allow-list (mass-read hardening)
// ════════════════════════════════════════════════════════════════════════════
describe("UtilityUsecase generic-model allow-list + fixed projection (hardening)", () => {
  function makeUsecase({ repo = {}, legacy = {} } = {}) {
    return new UtilityUsecase(repo, {
      searchData: vi.fn().mockResolvedValue([]),
      ...legacy,
    });
  }

  it("getModelData ALLOWS a whitelisted model (designImage) and reads via the repo with the FIXED projection", async () => {
    const repo = { findModelPickList: vi.fn().mockResolvedValue([{ id: 1, imageUrl: "u" }]) };
    const usecase = makeUsecase({ repo });
    const data = await usecase.getModelData({ query: { model: "designImage" } });
    expect(data).toEqual([{ id: 1, imageUrl: "u" }]);
    expect(repo.findModelPickList).toHaveBeenCalledWith({
      model: "designImage",
      select: { id: true, imageUrl: true },
    });
  });

  it("getModelData REJECTS a non-whitelisted model (user) — never touches the repo", async () => {
    const repo = { findModelPickList: vi.fn() };
    const usecase = makeUsecase({ repo });
    await expect(usecase.getModelData({ query: { model: "user" } })).rejects.toMatchObject({
      statusCode: 400,
      message: UC.MODEL_NOT_ALLOWED,
    });
    expect(repo.findModelPickList).not.toHaveBeenCalled();
  });

  it("getModelData REJECTS a bogus/non-existent delegate (the old `image`) — guards FIX 3", async () => {
    const repo = { findModelPickList: vi.fn() };
    const usecase = makeUsecase({ repo });
    await expect(usecase.getModelData({ query: { model: "image" } })).rejects.toMatchObject({
      statusCode: 400,
      message: UC.MODEL_NOT_ALLOWED,
    });
    expect(repo.findModelPickList).not.toHaveBeenCalled();
  });

  it("getModelIds REJECTS a non-whitelisted model (clientLead) before touching the repo", async () => {
    const repo = { findModelPickList: vi.fn() };
    const usecase = makeUsecase({ repo });
    await expect(usecase.getModelIds({ query: { model: "clientLead" } })).rejects.toMatchObject({
      statusCode: 400,
      message: UC.MODEL_NOT_ALLOWED,
    });
    expect(repo.findModelPickList).not.toHaveBeenCalled();
  });

  it("getModelIds does NOT honor a client-supplied select/include/where — only the fixed projection reaches the repo", async () => {
    const repo = { findModelPickList: vi.fn().mockResolvedValue([{ id: 5 }]) };
    const usecase = makeUsecase({ repo });
    // Attacker tries to traverse relations / pull arbitrary columns.
    await usecase.getModelIds({
      query: {
        model: "space",
        select: "id,secretColumn",
        include: "spaceImages",
        where: JSON.stringify({ isArchived: false }),
      },
    });
    expect(repo.findModelPickList).toHaveBeenCalledWith({
      model: "space",
      select: { id: true, title: { select: { id: true, text: true } } },
    });
    const passed = repo.findModelPickList.mock.calls[0][0];
    expect(passed.include).toBeUndefined();
    expect(passed.where).toBeUndefined();
  });

  it("search forwards the authenticated user (req.auth) as currentUser to the legacy service", async () => {
    const legacy = { searchData: vi.fn().mockResolvedValue([{ id: 1 }]) };
    const usecase = makeUsecase({ legacy });
    const authUser = { id: 3, role: USER_ROLES.STAFF };
    await usecase.search({ query: { model: "user", query: "a" }, authUser });
    expect(legacy.searchData).toHaveBeenCalledWith({ model: "user", query: "a" }, authUser);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  UTILITY USER-LOG SELF-SCOPE — the IDOR fix (subject is ALWAYS req.auth.id)
// ════════════════════════════════════════════════════════════════════════════
describe("UtilityUsecase user-log self-scope (IDOR fix)", () => {
  function makeUsecase(repoOverrides = {}) {
    const repo = {
      userLogExists: vi.fn().mockResolvedValue(false),
      createUserLog: vi.fn().mockResolvedValue({ id: 1 }),
      ...repoOverrides,
    };
    return { usecase: new UtilityUsecase(repo, { searchData: vi.fn() }), repo };
  }

  it("submitUserLog writes the AUTHENTICATED user's log, IGNORING any body userId (cannot forge another's log)", async () => {
    const { usecase, repo } = makeUsecase();
    // Even if a userId leaked past validation, the usecase never reads it.
    await usecase.submitUserLog({
      body: { userId: 999, date: "2026-01-01", description: "work" },
      authUser: { id: 7 },
    });
    const arg = repo.createUserLog.mock.calls[0][0];
    expect(arg.userId).toBe(7);
    expect(arg.userId).not.toBe(999);
  });

  it("checkUserLog reads ONLY the authenticated user's log range, IGNORING any query userId", async () => {
    const { usecase, repo } = makeUsecase();
    await usecase.checkUserLog({
      query: { userId: 999, startTime: "2026-01-01", endTime: "2026-02-01" },
      authUser: { id: 7 },
    });
    const arg = repo.userLogExists.mock.calls[0][0];
    expect(arg.userId).toBe(7);
    expect(arg.userId).not.toBe(999);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  UTILITY VALIDATION — reject cases
// ════════════════════════════════════════════════════════════════════════════
describe("UtilityValidation", () => {
  it("submitUserLog rejects an empty description", () => {
    const r = UtilityValidation.submitUserLog.safeParse({ date: "2026-01-01", description: "  " });
    expect(r.success).toBe(false);
  });

  it("submitUserLog REJECTS a smuggled target userId (.strict self-scope — IDOR fix)", () => {
    const r = UtilityValidation.submitUserLog.safeParse({
      userId: 999,
      date: "2026-01-01",
      description: "ok",
    });
    expect(r.success).toBe(false);
  });

  it("submitUserLog rejects an unknown field (.strict)", () => {
    const r = UtilityValidation.submitUserLog.safeParse({
      date: "2026-01-01",
      description: "ok",
      isAdmin: true,
    });
    expect(r.success).toBe(false);
  });

  it("submitUserLog accepts a valid body (no userId) and coerces totalMinutes", () => {
    const r = UtilityValidation.submitUserLog.safeParse({
      date: "2026-01-01",
      description: "did work",
      totalMinutes: "60",
    });
    expect(r.success).toBe(true);
    expect(r.data.totalMinutes).toBe(60);
  });

  it("userLogQuery requires start/end times and REJECTS a smuggled userId (.strict self-scope)", () => {
    expect(UtilityValidation.userLogQuery.safeParse({}).success).toBe(false);
    expect(
      UtilityValidation.userLogQuery.safeParse({ startTime: "2026-01-01", endTime: "2026-02-01" }).success,
    ).toBe(true);
    expect(
      UtilityValidation.userLogQuery.safeParse({
        userId: 999,
        startTime: "2026-01-01",
        endTime: "2026-02-01",
      }).success,
    ).toBe(false);
  });

  it("modelQuery requires a non-empty model and REJECTS client select/include/where (.strict — FIX 2)", () => {
    expect(UtilityValidation.modelQuery.safeParse({}).success).toBe(false);
    expect(UtilityValidation.modelQuery.safeParse({ model: "designImage" }).success).toBe(true);
    expect(UtilityValidation.modelQuery.safeParse({ model: "space", select: "id" }).success).toBe(false);
    expect(UtilityValidation.modelQuery.safeParse({ model: "space", include: "spaceImages" }).success).toBe(false);
  });

  it("userIdParams coerces and rejects a non-positive id", () => {
    expect(UtilityValidation.userIdParams.safeParse({ userId: "5" }).data.userId).toBe(5);
    expect(UtilityValidation.userIdParams.safeParse({ userId: "0" }).success).toBe(false);
  });
});

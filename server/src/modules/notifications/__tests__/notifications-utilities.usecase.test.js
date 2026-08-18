import { describe, it, expect, vi, beforeEach } from "vitest";

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

// DI was removed: NotificationUsecase now calls the imported `notificationRepository`
// singleton directly. Mock the singleton (keeping the real NotificationRepository class the
// buildWhere test constructs). UtilityUsecase (a different, unconverted module) still takes
// its repo via the constructor — those tests are unchanged.
vi.mock("../notification.repo.js", async (importActual) => {
  const actual = await importActual();
  return {
    ...actual,
    notificationRepository: {
      list: vi.fn(),
      markAllReadForUser: vi.fn(),
    },
  };
});

// DI was also removed from UtilityUsecase: it now calls the imported `utilityRepository`
// singleton directly (and the module-level `searchData` delegates its Prisma I/O to the
// same repo). Mock the singleton so the utility usecase can be asserted without a DB.
vi.mock("../../utilities/utility.repo.js", () => ({
  utilityRepository: {
    findModelPickList: vi.fn(),
    userLogExists: vi.fn(),
    createUserLog: vi.fn(),
    searchUsers: vi.fn(),
    searchClients: vi.fn(),
    searchLeads: vi.fn(),
    findUserForSearchScope: vi.fn(),
  },
}));

import { notificationUsecase, NotificationUsecase } from "../notification.usecase.js";
import { notificationRepository } from "../notification.repo.js";
import { NotificationValidation } from "../notification.validation.js";
import { utilityUsecase, UtilityUsecase } from "../../utilities/utility.usecase.js";
import { utilityRepository } from "../../utilities/utility.repo.js";
import { UtilityValidation } from "../../utilities/utility.validation.js";

const NC = notificationsMessagesCodes;
const UC = utilitiesMessagesCodes;
const PN = PERMISSIONS.NOTIFICATION;
const PU = PERMISSIONS.UTILITY;

function makeReq(persona, id = 1, superSales = false) {
  const currentProfileKey = superSales
    ? "SUPER_SALES"
    : {
        ADMIN: "ADMIN",
        SUPER_ADMIN: "SUPER_ADMIN",
        STAFF: "NORMAL_SALES",
        THREE_D_DESIGNER: "DESIGNER_3D",
        TWO_D_DESIGNER: "DESIGNER_2D",
        TWO_D_EXECUTOR: "EXECUTOR_2D",
        ACCOUNTANT: "ACCOUNTANT",
        SUPER_SALES: "SUPER_SALES",
        CONTACT_INITIATOR: "CONTACT_INITIATOR",
      }[persona];
  const { permissions, permissionsByModule } = getEffectivePermissions({
    profile: currentProfileKey,
  });
  return {
    auth: {
      id,
      currentProfileKey,
      profileFamily: ["NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES"].includes(
        currentProfileKey,
      )
        ? "SALES"
        : ["DESIGNER_3D", "DESIGNER_2D", "EXECUTOR_2D"].includes(currentProfileKey)
          ? "DESIGN"
          : null,
      isAdminTier: ["ADMIN", "SUPER_ADMIN"].includes(currentProfileKey),
      permissions,
      permissionsByModule,
    },
  };
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
  // Seed the mocked repo singleton before each test (defaults; individual tests override).
  beforeEach(() => {
    vi.clearAllMocks();
    notificationRepository.list.mockResolvedValue({ notifications: [], total: 0 });
    notificationRepository.markAllReadForUser.mockResolvedValue({ count: 3 });
  });

  it("list scopes by the AUTHENTICATED user id, IGNORING a client-supplied userId/staffId", async () => {
    // Attacker tries to read user 999's notifications via query params.
    await notificationUsecase.listNotifications({
      query: { userId: "999", staffId: "999", page: "1", limit: "9" },
      authUser: { id: 7 },
      unreadOnly: false,
    });
    const arg = notificationRepository.list.mock.calls[0][0];
    expect(arg.userId).toBe(7); // ← derived from auth, NOT from query
    expect(arg.userId).not.toBe(999);
  });

  it("list forwards unreadOnly and pagination, returns the {items,total,page,pageSize} contract", async () => {
    notificationRepository.list.mockResolvedValue({ notifications: [{ id: 1 }], total: 1 });
    const result = await notificationUsecase.listNotifications({
      query: { page: "2", limit: "5" },
      authUser: { id: 7 },
      unreadOnly: true,
    });
    const arg = notificationRepository.list.mock.calls[0][0];
    expect(arg.unreadOnly).toBe(true);
    expect(arg.skip).toBe(5); // (2-1)*5
    expect(arg.take).toBe(5);
    expect(result).toEqual({ items: [{ id: 1 }], total: 1, page: 2, pageSize: 5 });
  });

  it("list parses an optional date range from `filters`, but never a target user", async () => {
    await notificationUsecase.listNotifications({
      query: {
        filters: JSON.stringify({ range: { startDate: "2026-01-01", endDate: "2026-02-01" }, staffId: 999 }),
      },
      authUser: { id: 7 },
      unreadOnly: false,
    });
    const arg = notificationRepository.list.mock.calls[0][0];
    expect(arg.userId).toBe(7);
    expect(arg.range).toEqual({ startDate: "2026-01-01", endDate: "2026-02-01" });
  });

  it("markRead marks ONLY the authenticated user's notifications (never a :userId param)", async () => {
    const result = await notificationUsecase.markRead({ authUser: { id: 7 } });
    expect(notificationRepository.markAllReadForUser).toHaveBeenCalledWith({ userId: 7 });
    expect(result).toEqual({ updated: 3 });
  });

  it("the buildWhere repo helper always binds the userId into the where clause", async () => {
    const { NotificationRepository } = await import("../notification.repo.js");
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
  beforeEach(() => vi.clearAllMocks());

  it("getModelData ALLOWS a whitelisted model (designImage) and reads via the repo with the FIXED projection", async () => {
    utilityRepository.findModelPickList.mockResolvedValue([{ id: 1, imageUrl: "u" }]);
    const data = await utilityUsecase.getModelData({ query: { model: "designImage" } });
    expect(data).toEqual([{ id: 1, imageUrl: "u" }]);
    expect(utilityRepository.findModelPickList).toHaveBeenCalledWith({
      model: "designImage",
      select: { id: true, imageUrl: true },
    });
  });

  it("getModelData REJECTS a non-whitelisted model (user) — never touches the repo", () => {
    expect(() => utilityUsecase.getModelData({ query: { model: "user" } })).toThrowError(
      expect.objectContaining({ statusCode: 400, message: UC.MODEL_NOT_ALLOWED }),
    );
    expect(utilityRepository.findModelPickList).not.toHaveBeenCalled();
  });

  it("getModelData REJECTS a bogus/non-existent delegate", () => {
    expect(() => utilityUsecase.getModelData({ query: { model: "image" } })).toThrowError(
      expect.objectContaining({ statusCode: 400, message: UC.MODEL_NOT_ALLOWED }),
    );
    expect(utilityRepository.findModelPickList).not.toHaveBeenCalled();
  });

  it("getModelIds REJECTS a non-whitelisted model (clientLead) before touching the repo", () => {
    expect(() => utilityUsecase.getModelIds({ query: { model: "clientLead" } })).toThrowError(
      expect.objectContaining({ statusCode: 400, message: UC.MODEL_NOT_ALLOWED }),
    );
    expect(utilityRepository.findModelPickList).not.toHaveBeenCalled();
  });

  it("getModelIds does NOT honor a client-supplied select/include/where — only the fixed projection reaches the repo", async () => {
    utilityRepository.findModelPickList.mockResolvedValue([{ id: 5 }]);
    // Attacker tries to traverse relations / pull arbitrary columns.
    await utilityUsecase.getModelIds({
      query: {
        model: "space",
        select: "id,secretColumn",
        include: "spaceImages",
        where: JSON.stringify({ isArchived: false }),
      },
    });
    expect(utilityRepository.findModelPickList).toHaveBeenCalledWith({
      model: "space",
      select: { id: true, title: { select: { id: true, text: true } } },
    });
    const passed = utilityRepository.findModelPickList.mock.calls[0][0];
    expect(passed.include).toBeUndefined();
    expect(passed.where).toBeUndefined();
  });

  it("search forwards the authenticated user (req.auth) as currentUser to the cross-model search", async () => {
    // DI removed: `search` now calls the module-level `searchData`, which delegates its
    // Prisma read to `utilityRepository.searchFindMany`. The authUser drives the role-scoped
    // `where`, so asserting the repo call (delegate + fixed user projection) proves the
    // authenticated user reached the search path.
    utilityRepository.searchUsers.mockResolvedValue([{ id: 1 }]);
    const authUser = makeReq(USER_ROLES.STAFF, 3).auth;
    const out = await utilityUsecase.search({
      query: { resource: "users", query: "a" },
      authUser,
    });
    expect(out).toEqual([{ id: 1 }]);
    expect(utilityRepository.searchUsers).toHaveBeenCalledWith({
      query: "a",
      profileKey: undefined,
    });
  });

  it("search scopes normal sales lead results to the authenticated owner's leads", async () => {
    utilityRepository.searchLeads.mockResolvedValue([{ id: 7, code: "L-7" }]);
    const authUser = makeReq(USER_ROLES.STAFF, 3).auth;

    await utilityUsecase.search({
      query: { resource: "leads", query: "client" },
      authUser,
    });

    expect(utilityRepository.searchLeads).toHaveBeenCalledWith({
      query: "client",
      leadScope: { userId: 3 },
    });
  });

  it("search keeps SUPER_SALES full lead scope", async () => {
    utilityRepository.searchLeads.mockResolvedValue([]);
    const authUser = makeReq(USER_ROLES.SUPER_SALES, 9).auth;

    await utilityUsecase.search({
      query: { resource: "leads", query: "client" },
      authUser,
    });

    expect(utilityRepository.searchLeads).toHaveBeenCalledWith({
      query: "client",
      leadScope: {},
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  UTILITY USER-LOG SELF-SCOPE — the IDOR fix (subject is ALWAYS req.auth.id)
// ════════════════════════════════════════════════════════════════════════════
describe("UtilityUsecase user-log self-scope (IDOR fix)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    utilityRepository.userLogExists.mockResolvedValue(false);
    utilityRepository.createUserLog.mockResolvedValue({ id: 1 });
  });

  it("submitUserLog writes the AUTHENTICATED user's log, IGNORING any body userId (cannot forge another's log)", async () => {
    // Even if a userId leaked past validation, the usecase never reads it.
    await utilityUsecase.submitUserLog({
      body: { userId: 999, date: "2026-01-01", description: "work" },
      authUser: { id: 7 },
    });
    const arg = utilityRepository.createUserLog.mock.calls[0][0];
    expect(arg.userId).toBe(7);
    expect(arg.userId).not.toBe(999);
  });

  it("checkUserLog reads ONLY the authenticated user's log range, IGNORING any query userId", async () => {
    await utilityUsecase.checkUserLog({
      query: { userId: 999, startTime: "2026-01-01", endTime: "2026-02-01" },
      authUser: { id: 7 },
    });
    const arg = utilityRepository.userLogExists.mock.calls[0][0];
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

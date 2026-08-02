import { describe, it, expect, vi } from "vitest";
import { AuthMiddleware } from "../auth.middleware.js";
import { AppError } from "../../errors/AppError.js";
import {
  PERMISSIONS,
  getEffectivePermissions,
  USER_ROLES,
  authMessagesCodes,
} from "@dms/shared";

function makeReq(persona, _unused = [], profile) {
  const currentProfileKey =
    profile ??
    {
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
      id: 1,
      currentProfileKey,
      isAdminTier: ["ADMIN", "SUPER_ADMIN"].includes(currentProfileKey),
      permissions,
      permissionsByModule,
    },
  };
}

describe("AuthMiddleware.requirePermissions", () => {
  it("calls next() with no error when the user holds the required code", () => {
    const req = makeReq(USER_ROLES.ADMIN);
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PERMISSIONS.TELEGRAM.MANAGE])(
      req,
      {},
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // no arg = success
  });

  it("denies with 403 PERMISSION_DENIED when the user lacks the required code", () => {
    const req = makeReq(USER_ROLES.STAFF); // STAFF has no telegram.manage
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PERMISSIONS.TELEGRAM.MANAGE])(
      req,
      {},
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe(authMessagesCodes.PERMISSION_DENIED);
  });

  it("allows STAFF for a code every role holds (chat.room.view)", () => {
    const req = makeReq(USER_ROLES.STAFF);
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PERMISSIONS.CHAT.ROOM_VIEW])(
      req,
      {},
      next,
    );
    expect(next).toHaveBeenCalledWith();
  });

  it("ALL-of semantics: requires every code in `required`", () => {
    const req = makeReq(USER_ROLES.STAFF);
    const next = vi.fn();
    AuthMiddleware.requirePermissions([
      PERMISSIONS.CHAT.ROOM_VIEW,
      PERMISSIONS.TELEGRAM.MANAGE,
    ])(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it("ANY-of semantics: passes when one of `anyOf` is held", () => {
    const req = makeReq(USER_ROLES.STAFF);
    const next = vi.fn();
    AuthMiddleware.requirePermissions(
      [],
      [PERMISSIONS.TELEGRAM.MANAGE, PERMISSIONS.CHAT.ROOM_VIEW],
    )(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("a STAFF user with an ADMIN sub-role no longer passes the telegram gate (subRoles union removed)", () => {
    const req = makeReq(USER_ROLES.STAFF, [{ subRole: USER_ROLES.ADMIN }]);
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PERMISSIONS.TELEGRAM.MANAGE])(
      req,
      {},
      next,
    );
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
  });

  it("a STAFF user resolved to the ADMIN profile passes the telegram gate (profile is the sole source)", () => {
    const req = makeReq(USER_ROLES.STAFF, [], "ADMIN");
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PERMISSIONS.TELEGRAM.MANAGE])(
      req,
      {},
      next,
    );
    expect(next).toHaveBeenCalledWith();
  });

  it("401 UNAUTHORIZED when req.auth is missing", () => {
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PERMISSIONS.CHAT.ROOM_VIEW])(
      {},
      {},
      next,
    );
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it("requirePermissions throws PERMISSION_DENIED with the requiredPermissions details", () => {
    const req = { auth: { permissions: ["lead.list"] } };
    let captured;
    const next = (e) => { captured = e; };
    AuthMiddleware.requirePermissions(["lead.edit"])(req, {}, next);
    expect(captured).toBeInstanceOf(AppError);
    expect(captured.message).toBe("PERMISSION_DENIED");
    expect(captured.statusCode).toBe(403);
    expect(captured.details).toEqual({ requiredPermissions: ["lead.edit"] });
  });
});

describe("AuthMiddleware.requireSpecialChecker", () => {
  it("calls next() and stashes the row on req.scoped when the checker resolves", async () => {
    const req = {};
    const next = vi.fn();
    const row = { id: 5 };
    await AuthMiddleware.requireSpecialChecker(async () => row)(req, {}, next);
    expect(req.scoped).toBe(row);
    expect(next).toHaveBeenCalledWith();
  });

  it("forwards the thrown AppError to next() (denial path)", async () => {
    const req = {};
    const next = vi.fn();
    const denial = new AppError({ code: authMessagesCodes.ACCESS_DENIED, statusCode: 403 });
    await AuthMiddleware.requireSpecialChecker(async () => {
      throw denial;
    })(req, {}, next);
    expect(next).toHaveBeenCalledWith(denial);
  });
});

import { describe, it, expect } from "vitest";

import { validate } from "../../../../shared/middlewares/validate.middleware.js";
import { UserValidation } from "../user.validation.js";
import { PERMISSIONS, ROLE_PERMISSIONS, USER_ROLES } from "@dms/shared";

const P = PERMISSIONS.USER;

/** Run middlewares in sequence against a fake req; stop on next(err). */
function runMiddlewares(middlewares, req) {
  let err = null;
  for (const mw of middlewares) {
    let called = false;
    mw(req, {}, (e) => {
      called = true;
      if (e) err = e;
    });
    if (err || !called) break;
  }
  return { req, err };
}

describe("UserValidation", () => {
  it("createUser requires email/password/name/role", () => {
    const { err } = runMiddlewares([validate(UserValidation.createUser)], { body: { email: "a" } });
    expect(err).not.toBeNull();
    expect(err.statusCode).toBe(422);
  });

  it("createUser accepts a complete body", () => {
    const req = { body: { email: "a@b.c", password: "x", name: "N", role: "STAFF" } };
    const { err } = runMiddlewares([validate(UserValidation.createUser)], req);
    expect(err).toBeNull();
  });

  it("userIdParams coerces a numeric string and rejects non-positive", () => {
    const okReq = { params: { userId: "42" } };
    const { req: out, err } = runMiddlewares([validate(UserValidation.userIdParams, "params")], okReq);
    expect(err).toBeNull();
    expect(out.params.userId).toBe(42);

    const { err: badErr } = runMiddlewares([validate(UserValidation.userIdParams, "params")], { params: { userId: "abc" } });
    expect(badErr).not.toBeNull();
    expect(badErr.statusCode).toBe(422);
  });

  it("maxLeads requires maxLeadsCounts", () => {
    const { err } = runMiddlewares([validate(UserValidation.maxLeads)], { body: {} });
    expect(err).not.toBeNull();
    expect(err.statusCode).toBe(422);
  });

  it("staffExtra ACCEPTS the whitelisted boolean flags", () => {
    const { err } = runMiddlewares(
      [validate(UserValidation.staffExtra)],
      { body: { isSuperSales: true } },
    );
    expect(err).toBeNull();
  });

  it("staffExtra REJECTS password/role/isActive (mass-assignment fix, 422)", () => {
    for (const body of [
      { password: "x" },
      { role: "ADMIN" },
      { isActive: false },
      { isSuperSales: true, password: "x" },
    ]) {
      const { err } = runMiddlewares([validate(UserValidation.staffExtra)], { body });
      expect(err, JSON.stringify(body)).not.toBeNull();
      expect(err.statusCode).toBe(422);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  ROLE GRANTS — directory broad; management admin-tier only
// ════════════════════════════════════════════════════════════════════════════
describe("user role grants", () => {
  const DIRECTORY_AND_PROFILE = [P.DIRECTORY, P.PROFILE_VIEW, P.PROFILE_EDIT];
  const MANAGEMENT = [
    P.LIST, P.VIEW_LOGS, P.VIEW_LAST_SEEN, P.CREATE, P.UPDATE, P.MANAGE_ROLES,
    P.MANAGE_RESTRICTED_COUNTRIES, P.MANAGE_AUTO_ASSIGNMENTS, P.SET_MAX_LEADS, P.MANAGE_STAFF_EXTRA,
  ];

  it("EVERY role holds the directory + profile codes (legacy SHARED surface)", () => {
    for (const [, granted] of Object.entries(ROLE_PERMISSIONS)) {
      for (const code of DIRECTORY_AND_PROFILE) {
        expect(granted).toContain(code);
      }
    }
  });

  it("ADMIN and SUPER_ADMIN hold every management code", () => {
    for (const role of [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]) {
      for (const code of MANAGEMENT) {
        expect(ROLE_PERMISSIONS[role]).toContain(code);
      }
    }
  });

  it("NO non-admin BASE role holds ANY management code (sub-role/isSuperSales union is layered separately)", () => {
    const privileged = new Set([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]);
    for (const [role, granted] of Object.entries(ROLE_PERMISSIONS)) {
      if (privileged.has(role)) continue;
      for (const code of MANAGEMENT) {
        expect(granted).not.toContain(code);
      }
    }
  });
});

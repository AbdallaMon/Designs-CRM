import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the JWT verifier and the profile cache so we can drive requireAuth directly.
vi.mock("../../../infra/security/jwt.js", () => ({
  JwtService: { verifyAccess: vi.fn() },
}));
vi.mock("../../../infra/auth/profile-cache.js", () => ({
  profileCache: { resolve: vi.fn() },
}));

import { AuthMiddleware } from "../auth.middleware.js";
import { JwtService } from "../../../infra/security/jwt.js";
import { profileCache } from "../../../infra/auth/profile-cache.js";
import { AUTH_COOKIE_NAME } from "@dms/shared";

function run(payload, resolved) {
  JwtService.verifyAccess.mockReturnValue(payload);
  profileCache.resolve.mockReturnValue(resolved);
  const req = { cookies: { [AUTH_COOKIE_NAME]: "token" } };
  let nextArg;
  AuthMiddleware.requireAuth(req, {}, (e) => {
    nextArg = e;
  });
  return { req, nextArg };
}

describe("requireAuth resolves via the profile cache", () => {
  beforeEach(() => vi.clearAllMocks());

  it("attaches the current profile's permissions + isAdminTier", () => {
    const { req, nextArg } = run(
      { id: 5, currentProfileId: 1, role: "ADMIN" },
      {
        key: "ADMIN",
        isAdminTier: true,
        baseRole: "ADMIN",
        permissions: ["lead.view"],
        permissionsByModule: { lead: { codes: ["lead.view"] } },
      },
    );
    expect(nextArg).toBeUndefined();
    expect(req.auth.permissions).toEqual(["lead.view"]);
    expect(req.auth.isAdminTier).toBe(true);
    expect(req.auth.currentProfileKey).toBe("ADMIN");
    expect(req.auth.baseRole).toBe("ADMIN");
  });

  it("falls back to the legacy code-map when the profile is unresolved (old token / unmigrated user)", () => {
    const { req, nextArg } = run(
      { id: 5, currentProfileId: null, role: "ADMIN", isSuperSales: false, subRoles: [] },
      null,
    );
    expect(nextArg).toBeUndefined();
    expect(req.auth.permissions.length).toBeGreaterThan(0); // real ADMIN code-map perms
    expect(req.auth.isAdminTier).toBe(true); // ADMIN role → admin-tier in the fallback
  });

  it("fallback marks a plain STAFF user as non-admin-tier", () => {
    const { req } = run(
      { id: 9, currentProfileId: null, role: "STAFF", isSuperSales: false, subRoles: [] },
      null,
    );
    expect(req.auth.isAdminTier).toBe(false);
  });

  it("401 when no access-token cookie is present", () => {
    const req = { cookies: {} };
    let nextArg;
    AuthMiddleware.requireAuth(req, {}, (e) => (nextArg = e));
    expect(nextArg?.statusCode).toBe(401);
  });
});

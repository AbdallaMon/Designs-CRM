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

async function run(payload, resolved) {
  JwtService.verifyAccess.mockReturnValue(payload);
  profileCache.resolve.mockReturnValue(resolved);
  const req = { cookies: { [AUTH_COOKIE_NAME]: "token" } };
  let nextArg;
  await AuthMiddleware.requireAuth(req, {}, (e) => {
    nextArg = e;
  });
  return { req, nextArg };
}

describe("requireAuth resolves via the profile cache", () => {
  beforeEach(() => vi.clearAllMocks());

  it("attaches the current profile's permissions + isAdminTier", async () => {
    const { req, nextArg } = await run(
      { id: 5, currentProfileId: 1 },
      {
        key: "ADMIN",
        isAdminTier: true,
        family: "ADMIN",
        permissions: ["lead.view"],
        permissionsByModule: { lead: { codes: ["lead.view"] } },
      },
    );
    expect(nextArg).toBeUndefined();
    expect(req.auth.permissions).toEqual(["lead.view"]);
    expect(req.auth.isAdminTier).toBe(true);
    expect(req.auth.currentProfileKey).toBe("ADMIN");
    expect(req.auth.profileFamily).toBe("ADMIN");
  });

  it("rejects an unresolved active profile without role fallback", async () => {
    const { req, nextArg } = await run(
      { id: 5, currentProfileId: null, role: "ADMIN", subRoles: [] },
      null,
    );
    expect(nextArg).toMatchObject({ statusCode: 403, message: "PROFILE_REQUIRED" });
    expect(req.auth).toBeUndefined();
  });

  it("401 when no access-token cookie is present", async () => {
    const req = { cookies: {} };
    let nextArg;
    await AuthMiddleware.requireAuth(req, {}, (e) => (nextArg = e));
    expect(nextArg?.statusCode).toBe(401);
  });
});

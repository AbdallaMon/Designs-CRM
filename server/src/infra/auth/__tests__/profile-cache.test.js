import { describe, it, expect } from "vitest";
import { createProfileCache } from "../profile-cache.js";

const fakeRepo = {
  loadProfilesWithCodes: async () => [
    { id: 1, key: "ADMIN", isAdminTier: true, baseRole: "ADMIN", codes: ["lead.list", "lead.view"] },
    { id: 2, key: "NORMAL_SALES", isAdminTier: false, baseRole: "STAFF", codes: ["lead.list"] },
  ],
};

describe("profile cache", () => {
  it("resolves codes + isAdminTier + meta by profileId", async () => {
    const cache = createProfileCache({ repository: fakeRepo });
    await cache.load();

    const admin = cache.resolve(1);
    expect(admin.key).toBe("ADMIN");
    expect(admin.baseRole).toBe("ADMIN");
    expect(admin.isAdminTier).toBe(true);
    expect(new Set(admin.permissions)).toEqual(new Set(["lead.list", "lead.view"]));
    expect(admin.permissionsByModule.lead.codes).toContain("lead.view");

    const sales = cache.resolve(2);
    expect(sales.isAdminTier).toBe(false);
    expect(sales.permissions).toEqual(["lead.list"]);
  });

  it("returns null for an unknown or null id", async () => {
    const cache = createProfileCache({ repository: fakeRepo });
    await cache.load();
    expect(cache.resolve(999)).toBeNull();
    expect(cache.resolve(null)).toBeNull();
    expect(cache.resolve(undefined)).toBeNull();
  });

  it("accepts a numeric string id (as it arrives from a JWT payload)", async () => {
    const cache = createProfileCache({ repository: fakeRepo });
    await cache.load();
    expect(cache.resolve("1").key).toBe("ADMIN");
  });
});

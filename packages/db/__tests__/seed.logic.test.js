import { describe, it, expect } from "vitest";
import { buildCatalog, ADMIN_TIER_PROFILE_KEYS } from "../prisma/seed.js";

describe("buildCatalog", () => {
  const cat = buildCatalog();

  it("emits a code row per ALL_PERMISSIONS entry with a module", () => {
    expect(cat.codes.length).toBeGreaterThan(0);
    for (const c of cat.codes) {
      expect(c.code).toContain(".");
      expect(c.module).toBeTruthy();
    }
  });

  it("marks ADMIN/SUPER_ADMIN/SUPER_SALES as admin-tier, others not", () => {
    const byKey = Object.fromEntries(cat.profiles.map((p) => [p.key, p]));
    for (const k of ADMIN_TIER_PROFILE_KEYS) expect(byKey[k].isAdminTier).toBe(true);
    expect(byKey.NORMAL_SALES.isAdminTier).toBe(false);
    expect(byKey.ACCOUNTANT.isAdminTier).toBe(false);
  });

  it("every link references a real profile key and a real code", () => {
    const keys = new Set(cat.profiles.map((p) => p.key));
    const codes = new Set(cat.codes.map((c) => c.code));
    for (const l of cat.links) {
      expect(keys.has(l.profileKey)).toBe(true);
      expect(codes.has(l.code)).toBe(true);
    }
  });
});

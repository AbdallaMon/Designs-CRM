import { describe, it, expect, vi } from "vitest";
import { buildCatalog, ADMIN_TIER_PROFILE_KEYS, seedAdminUser } from "../prisma/seed.js";

describe("buildCatalog", () => {
  const cat = buildCatalog();

  it("emits a code row per ALL_PERMISSIONS entry with a module", () => {
    expect(cat.codes.length).toBeGreaterThan(0);
    for (const c of cat.codes) {
      expect(c.code).toContain(".");
      expect(c.module).toBeTruthy();
    }
  });

  it("marks ADMIN and SUPER_ADMIN as admin-tier, others not", () => {
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

describe("seedAdminUser (idempotent bootstrap admin)", () => {
  // Minimal fake prisma capturing only the calls seedAdminUser makes.
  const makeDb = ({ admin = null, byEmail = null, profile = { id: 7 } } = {}) => ({
    user: {
      findFirst: vi.fn().mockResolvedValue(admin),
      findUnique: vi.fn().mockResolvedValue(byEmail),
      create: vi.fn().mockResolvedValue({ id: 42, email: "abdotlos60@gmail.com" }),
    },
    profile: { findUnique: vi.fn().mockResolvedValue(profile) },
    userProfile: { upsert: vi.fn().mockResolvedValue({}) },
  });

  it("no-ops when an admin-tier user already exists", async () => {
    const db = makeDb({ admin: { id: 1 } });
    const r = await seedAdminUser({ prisma: db });
    expect(r).toEqual({ created: false, reason: "admin-exists" });
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("no-ops (no create) when the email is already taken by a non-admin", async () => {
    const db = makeDb({ admin: null, byEmail: { id: 5 } });
    const r = await seedAdminUser({ prisma: db });
    expect(r.created).toBe(false);
    expect(r.reason).toBe("email-taken");
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("creates an ADMIN user + links the ADMIN profile when none exists", async () => {
    const db = makeDb();
    const r = await seedAdminUser({ prisma: db });
    expect(r.created).toBe(true);
    const data = db.user.create.mock.calls[0][0].data;
    expect(data).not.toHaveProperty("role");
    expect(data.isActive).toBe(true);
    expect(data.currentProfileId).toBe(7);
    expect(data.password).toMatch(/^\$2[aby]\$/); // a bcrypt hash, never plaintext
    expect(db.userProfile.upsert).toHaveBeenCalledOnce();
  });

  it("still creates the user (no profile link) when the ADMIN profile is missing", async () => {
    const db = makeDb({ profile: null });
    const r = await seedAdminUser({ prisma: db });
    expect(r.created).toBe(true);
    expect(r.linkedProfile).toBe(false);
    expect(db.userProfile.upsert).not.toHaveBeenCalled();
  });

  it("honors SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD_HASH overrides", async () => {
    const db = makeDb();
    const prev = { e: process.env.SEED_ADMIN_EMAIL, h: process.env.SEED_ADMIN_PASSWORD_HASH };
    process.env.SEED_ADMIN_EMAIL = "root@example.com";
    process.env.SEED_ADMIN_PASSWORD_HASH = "$2b$08$overrideoverrideoverrideoverrideoverrideov";
    try {
      await seedAdminUser({ prisma: db });
      const data = db.user.create.mock.calls[0][0].data;
      expect(data.email).toBe("root@example.com");
      expect(data.password).toBe("$2b$08$overrideoverrideoverrideoverrideoverrideov");
    } finally {
      process.env.SEED_ADMIN_EMAIL = prev.e;
      process.env.SEED_ADMIN_PASSWORD_HASH = prev.h;
    }
  });
});

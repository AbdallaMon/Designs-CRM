import { describe, it, expect } from "vitest";
import { AuthSchema } from "../auth.dto.js";

describe("toMe profile", () => {
  it("emits the stored profile when present", () => {
    const me = AuthSchema.toMe({ id: 1, email: "a@b.c", name: "A", role: "STAFF", profile: "PRIMARY_SALES" });
    expect(me.profile).toBe("PRIMARY_SALES");
  });
  it("derives the profile from legacy fields when unset", () => {
    const me = AuthSchema.toMe({ id: 1, email: "a@b.c", name: "A", role: "STAFF", isSuperSales: true, profile: null });
    expect(me.profile).toBe("SUPER_SALES");
  });
});

describe("toMe profiles + currentProfile", () => {
  it("returns the assigned profiles + current, profile == current key", () => {
    const me = AuthSchema.toMe({
      id: 1, email: "a@b.c", name: "A", role: "STAFF", currentProfileId: 2,
      currentProfile: { id: 2, key: "PRIMARY_SALES", baseRole: "STAFF", isAdminTier: false },
      userProfiles: [
        { profile: { id: 2, key: "PRIMARY_SALES", label: "x", family: "SALES", isAdminTier: false } },
        { profile: { id: 5, key: "ACCOUNTANT", label: "y", family: "FINANCE", isAdminTier: false } },
      ],
      permissions: ["lead.view"], permissionsByModule: { lead: { codes: ["lead.view"] } },
    });
    expect(me.currentProfileId).toBe(2);
    expect(me.profile).toBe("PRIMARY_SALES");
    expect(me.profiles.map((p) => p.key).sort()).toEqual(["ACCOUNTANT", "PRIMARY_SALES"]);
    expect(me.profiles[0]).toHaveProperty("label");
  });

  it("defaults profiles to [] and currentProfileId to null when absent (legacy row)", () => {
    const me = AuthSchema.toMe({ id: 1, email: "a@b.c", name: "A", role: "ACCOUNTANT" });
    expect(me.profiles).toEqual([]);
    expect(me.currentProfileId).toBeNull();
    expect(me.profile).toBe("ACCOUNTANT");
  });
});

describe("toMe derives role from the active profile (not the legacy column)", () => {
  it("role/activeRole follow currentProfile.baseRole when it disagrees with user.role", () => {
    const me = AuthSchema.toMe({
      id: 1, email: "a@b.c", name: "A",
      role: "THREE_D_DESIGNER", // STALE legacy column
      currentProfileId: 9,
      currentProfile: { id: 9, key: "DESIGNER_2D", baseRole: "TWO_D_DESIGNER", isAdminTier: false },
      userProfiles: [
        { profile: { id: 8, key: "DESIGNER_3D", label: "3D", family: "DESIGN", isAdminTier: false, baseRole: "THREE_D_DESIGNER" } },
        { profile: { id: 9, key: "DESIGNER_2D", label: "2D", family: "DESIGN", isAdminTier: false, baseRole: "TWO_D_DESIGNER" } },
      ],
      permissions: ["lead.view"], permissionsByModule: { lead: { codes: ["lead.view"] } },
    });
    expect(me.role).toBe("TWO_D_DESIGNER");
    expect(me.activeRole).toBe("TWO_D_DESIGNER");
  });

  it("returns subRoles: [] even when the row carries subRole rows", () => {
    const me = AuthSchema.toMe({
      id: 1, email: "a@b.c", name: "A", role: "STAFF",
      subRoles: [{ subRole: "ACCOUNTANT" }],
      currentProfileId: 2,
      currentProfile: { id: 2, key: "NORMAL_SALES", baseRole: "STAFF", isAdminTier: false },
      userProfiles: [{ profile: { id: 2, key: "NORMAL_SALES", label: "Sales", family: "SALES", isAdminTier: false, baseRole: "STAFF" } }],
      permissions: [], permissionsByModule: {},
    });
    expect(me.subRoles).toEqual([]);
  });

  it("falls back to user.role when the user holds no profile (legacy row)", () => {
    const me = AuthSchema.toMe({ id: 1, email: "a@b.c", name: "A", role: "ACCOUNTANT" });
    expect(me.role).toBe("ACCOUNTANT");
    expect(me.activeRole).toBe("ACCOUNTANT");
  });

  it("uses req.auth.baseRole on the DB-free /auth/me path", () => {
    // req.auth has no currentProfile object and no userProfiles — only baseRole (from cache).
    const me = AuthSchema.toMe({
      id: 1, email: "a@b.c", name: "A", role: "STAFF",
      currentProfileId: 5, baseRole: "STAFF", currentProfileKey: "SUPER_SALES",
      profiles: [{ id: 5, key: "SUPER_SALES", label: "Super sales", family: "SALES", isAdminTier: true }],
      permissions: [], permissionsByModule: {},
    });
    expect(me.role).toBe("STAFF");
  });
});

describe("toTokenPayload derives role from the effective (corrected) profile", () => {
  it("uses the corrected currentProfileId, not the stale currentProfile object", () => {
    // login/refresh correct a dangling currentProfileId but leave user.currentProfile stale.
    const payload = AuthSchema.toTokenPayload({
      id: 1, email: "a@b.c", name: "A", isActive: true,
      role: "THREE_D_DESIGNER",
      currentProfileId: 9, // CORRECTED (effective)
      currentProfile: { id: 8, key: "DESIGNER_3D", baseRole: "THREE_D_DESIGNER" }, // STALE
      userProfiles: [
        { profile: { id: 8, key: "DESIGNER_3D", baseRole: "THREE_D_DESIGNER" } },
        { profile: { id: 9, key: "DESIGNER_2D", baseRole: "TWO_D_DESIGNER" } },
      ],
    });
    expect(payload.role).toBe("TWO_D_DESIGNER");
    expect(payload.activeRole).toBe("TWO_D_DESIGNER");
    expect(payload.subRoles).toEqual([]);
    expect(payload.currentProfileId).toBe(9);
    expect(payload.profileIds.sort()).toEqual([8, 9]);
  });
});

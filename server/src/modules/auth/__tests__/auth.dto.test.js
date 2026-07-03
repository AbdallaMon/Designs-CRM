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

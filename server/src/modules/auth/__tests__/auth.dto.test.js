import { describe, expect, it } from "vitest";
import { AuthSchema } from "../auth.dto.js";

describe("AuthSchema.toMe", () => {
  it("emits the active profile, assigned profiles, and profile permissions", () => {
    const me = AuthSchema.toMe({
      id: 1,
      email: "a@b.c",
      name: "A",
      currentProfileId: 2,
      currentProfile: {
        id: 2,
        key: "PRIMARY_SALES",
        family: "SALES",
        isAdminTier: false,
      },
      userProfiles: [
        {
          profile: {
            id: 2,
            key: "PRIMARY_SALES",
            label: "Primary sales",
            family: "SALES",
            isAdminTier: false,
          },
        },
        {
          profile: {
            id: 5,
            key: "ACCOUNTANT",
            label: "Accountant",
            family: "FINANCE",
            isAdminTier: false,
          },
        },
      ],
    });
    expect(me.profile).toBe("PRIMARY_SALES");
    expect(me.profileFamily).toBe("SALES");
    expect(me.currentProfileId).toBe(2);
    expect(me.profiles.map((profile) => profile.key).sort()).toEqual([
      "ACCOUNTANT",
      "PRIMARY_SALES",
    ]);
    expect(me.permissions.length).toBeGreaterThan(0);
  });

  it("does not infer a profile from retained schema fields", () => {
    const me = AuthSchema.toMe({
      id: 1,
      email: "a@b.c",
      name: "A",
      role: "ADMIN",
      subRoles: ["SUPER_ADMIN"],
      isSuperSales: true,
    });
    expect(me.profile).toBeNull();
    expect(me.permissions).toEqual([]);
    expect(me.navigationTabs).toEqual([]);
  });

  it("uses the request-auth profile on the DB-free /auth/me path", () => {
    const me = AuthSchema.toMe({
      id: 1,
      email: "a@b.c",
      name: "A",
      currentProfileId: 5,
      currentProfileKey: "SUPER_SALES",
      profileFamily: "SALES",
      profiles: [
        {
          id: 5,
          key: "SUPER_SALES",
          label: "Super sales",
          family: "SALES",
          isAdminTier: false,
        },
      ],
      permissions: ["lead.view"],
      permissionsByModule: { lead: { codes: ["lead.view"] } },
    });
    expect(me.profile).toBe("SUPER_SALES");
    expect(me.profileFamily).toBe("SALES");
  });
});

describe("AuthSchema.toTokenPayload", () => {
  it("contains identity and profile ids, but no role or sales flags", () => {
    const payload = AuthSchema.toTokenPayload({
      id: 1,
      email: "a@b.c",
      name: "A",
      isActive: true,
      currentProfileId: 9,
      userProfiles: [
        { profile: { id: 8, key: "DESIGNER_3D" } },
        { profile: { id: 9, key: "DESIGNER_2D" } },
      ],
    });
    expect(payload.currentProfileId).toBe(9);
    expect(payload.profileIds.sort()).toEqual([8, 9]);
    expect(payload).not.toHaveProperty("role");
    expect(payload).not.toHaveProperty("subRoles");
    expect(payload).not.toHaveProperty("isSuperSales");
  });
});

import { describe, expect, it } from "vitest";
import { ALL_PERMISSIONS, getEffectivePermissions, PERMISSIONS } from "@dms/shared";
import { UserValidation } from "../user.validation.js";

describe("UserValidation", () => {
  it("requires identity fields when creating a user", () => {
    expect(UserValidation.createUser.safeParse({ email: "a" }).success).toBe(false);
    expect(
      UserValidation.createUser.safeParse({
        email: "a@b.c",
        password: "x",
        name: "N",
      }).success,
    ).toBe(true);
  });

  it("rejects retained role and sales-flag fields on create/update", () => {
    expect(
      UserValidation.createUser.safeParse({
        email: "a@b.c",
        password: "x",
        name: "N",
        role: "ADMIN",
      }).success,
    ).toBe(false);
    expect(
      UserValidation.updateUser.safeParse({
        name: "N",
        isSuperSales: true,
      }).success,
    ).toBe(false);
  });

  it("coerces valid user ids and rejects invalid ones", () => {
    expect(UserValidation.userIdParams.parse({ userId: "42" })).toEqual({
      userId: 42,
    });
    expect(UserValidation.userIdParams.safeParse({ userId: "abc" }).success).toBe(
      false,
    );
  });

  it("requires at least one assigned profile", () => {
    expect(
      UserValidation.updateUserProfiles.safeParse({ profileIds: [] }).success,
    ).toBe(false);
    expect(
      UserValidation.updateUserProfiles.safeParse({
        profileIds: [1, 2],
        currentProfileId: 2,
      }).success,
    ).toBe(true);
  });
});

describe("user profile grants", () => {
  it("admin profiles hold every user-management permission", () => {
    for (const profile of ["ADMIN", "SUPER_ADMIN"]) {
      const permissions = getEffectivePermissions({ profile }).permissions;
      expect(new Set(permissions)).toEqual(new Set(ALL_PERMISSIONS));
      expect(permissions).toContain(PERMISSIONS.USER.MANAGE_PROFILES);
    }
  });

  it("retained schema fields do not grant user-management access", () => {
    const permissions = getEffectivePermissions({
      role: "ADMIN",
      subRoles: ["SUPER_ADMIN"],
      isSuperSales: true,
    }).permissions;
    expect(permissions).toEqual([]);
  });
});

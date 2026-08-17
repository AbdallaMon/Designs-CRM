import { describe, expect, it, vi } from "vitest";
import {
  deriveLegacyProfileKeys,
  planUserProfiles,
  runUserProfileMigration,
} from "../migrate-users-to-profiles.js";

const PROFILE_IDS = {
  ADMIN: 1,
  SUPER_ADMIN: 2,
  NORMAL_SALES: 3,
  PRIMARY_SALES: 4,
  SUPER_SALES: 5,
  ACCOUNTANT: 6,
  DESIGNER_3D: 7,
  DESIGNER_2D: 8,
  EXECUTOR_2D: 9,
  CONTACT_INITIATOR: 10,
};

describe("legacy user profile migration", () => {
  it("maps sales flags and all retained role types", () => {
    expect(deriveLegacyProfileKeys({ role: "STAFF" }).current).toBe("NORMAL_SALES");
    expect(deriveLegacyProfileKeys({ role: "STAFF", isPrimary: true }).current).toBe(
      "PRIMARY_SALES",
    );
    expect(deriveLegacyProfileKeys({ role: "STAFF", isSuperSales: true }).current).toBe(
      "SUPER_SALES",
    );
    expect(deriveLegacyProfileKeys({ role: "SUPER_SALES" }).current).toBe("SUPER_SALES");
    expect(deriveLegacyProfileKeys({ role: "THREE_D_DESIGNER" }).current).toBe(
      "DESIGNER_3D",
    );
  });

  it("keeps the base role current and adds sub-role assignments", () => {
    expect(
      planUserProfiles(
        {
          role: "STAFF",
          isPrimary: true,
          subRoles: [{ subRole: "ACCOUNTANT" }, { subRole: "TWO_D_DESIGNER" }],
        },
        PROFILE_IDS,
      ),
    ).toEqual({
      profileIds: [PROFILE_IDS.PRIMARY_SALES, PROFILE_IDS.ACCOUNTANT, PROFILE_IDS.DESIGNER_2D],
      currentProfileId: PROFILE_IDS.PRIMARY_SALES,
    });
  });

  it("fails closed when the profile catalog was not seeded", () => {
    expect(() => planUserProfiles({ role: "ACCOUNTANT" }, {})).toThrow(
      "Missing seeded profiles: ACCOUNTANT",
    );
  });

  it("dry-runs without writes and applies without overwriting an existing current profile", async () => {
    const users = [
      {
        id: 11,
        role: "STAFF",
        isPrimary: false,
        isSuperSales: false,
        currentProfileId: null,
        subRoles: [],
      },
      {
        id: 12,
        role: "ACCOUNTANT",
        isPrimary: false,
        isSuperSales: false,
        currentProfileId: PROFILE_IDS.DESIGNER_2D,
        subRoles: [],
      },
    ];
    const db = {
      profile: {
        findMany: vi.fn().mockResolvedValue(
          Object.entries(PROFILE_IDS).map(([key, id]) => ({ key, id })),
        ),
      },
      user: {
        findMany: vi.fn().mockResolvedValue(users),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      userProfile: { upsert: vi.fn().mockResolvedValue({}) },
    };

    await expect(runUserProfileMigration({ prisma: db })).resolves.toMatchObject({
      mode: "dry-run",
      scannedUsers: 2,
      plannedAssignments: 2,
      usersMissingCurrentProfile: 1,
      assignmentUpserts: 0,
    });
    expect(db.userProfile.upsert).not.toHaveBeenCalled();

    await expect(runUserProfileMigration({ prisma: db, apply: true })).resolves.toMatchObject({
      mode: "apply",
      assignmentUpserts: 2,
      currentProfilesSet: 1,
    });
    expect(db.user.updateMany).toHaveBeenCalledTimes(1);
    expect(db.user.updateMany).toHaveBeenCalledWith({
      where: { id: 11, currentProfileId: null },
      data: { currentProfileId: PROFILE_IDS.NORMAL_SALES },
    });
  });
});

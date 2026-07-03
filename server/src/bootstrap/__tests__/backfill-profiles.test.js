import { describe, it, expect, vi } from "vitest";
import { runProfileBackfill, runLegacyStringProfileBackfill } from "../backfill-profiles.js";
import { runUserProfileMigration } from "../../../../packages/db/scripts/migrate-users-to-profiles.js";

describe("runProfileBackfill", () => {
  it("delegates to the relational user->profile migration", () => {
    expect(runProfileBackfill).toBe(runUserProfileMigration);
  });

  it("assigns UserProfile rows + sets currentProfileId when null", async () => {
    const upserts = [];
    const updates = [];
    const db = {
      profile: { findMany: vi.fn(async () => [{ id: 10, key: "NORMAL_SALES" }, { id: 30, key: "ADMIN" }]) },
      user: {
        findMany: vi.fn(async () => [
          { id: 1, role: "STAFF", isPrimary: false, isSuperSales: false, currentProfileId: null, subRoles: [] },
          { id: 2, role: "ADMIN", isPrimary: false, isSuperSales: false, currentProfileId: 30, subRoles: [] },
        ]),
        update: vi.fn(async ({ where, data }) => { updates.push({ id: where.id, ...data }); }),
      },
      userProfile: { upsert: vi.fn(async ({ create }) => { upserts.push(create); }) },
    };
    const res = await runProfileBackfill({ prisma: db });
    expect(res).toEqual({ scanned: 2, assigned: 2, currentSet: 1 });
    expect(upserts).toEqual([{ userId: 1, profileId: 10 }, { userId: 2, profileId: 30 }]);
    expect(updates).toEqual([{ id: 1, currentProfileId: 10 }]); // user 2 already had a current
  });
});

describe("runLegacyStringProfileBackfill (rollback path)", () => {
  it("still populates the User.profile string column", async () => {
    const users = [{ id: 1, role: "ACCOUNTANT", isPrimary: false, isSuperSales: false, profile: null }];
    const db = {
      user: {
        findMany: vi.fn(async () => users.map((u) => ({ id: u.id, role: u.role, isPrimary: u.isPrimary, isSuperSales: u.isSuperSales }))),
        update: vi.fn(async ({ where, data }) => { users.find((x) => x.id === where.id).profile = data.profile; }),
      },
    };
    const res = await runLegacyStringProfileBackfill({ prisma: db });
    expect(res).toEqual({ scanned: 1, updated: 1 });
    expect(users[0].profile).toBe("ACCOUNTANT");
  });
});

import { describe, it, expect, vi } from "vitest";
import {
  planUserProfiles,
  runUserProfileMigration,
} from "../../../../packages/db/scripts/migrate-users-to-profiles.js";

const ID = { NORMAL_SALES: 10, ACCOUNTANT: 20, ADMIN: 30 };

describe("planUserProfiles", () => {
  it("maps base role + subRoles to profile ids, current = base", () => {
    const p = planUserProfiles({ role: "STAFF", subRoles: [{ subRole: "ACCOUNTANT" }] }, ID);
    expect(p.currentProfileId).toBe(ID.NORMAL_SALES);
    expect(new Set(p.profileIds)).toEqual(new Set([ID.NORMAL_SALES, ID.ACCOUNTANT]));
  });

  it("single role → one id, current == it", () => {
    expect(planUserProfiles({ role: "ADMIN" }, ID)).toEqual({
      profileIds: [ID.ADMIN],
      currentProfileId: ID.ADMIN,
    });
  });

  it("drops unknown profile keys (missing from the id map)", () => {
    const p = planUserProfiles({ role: "STAFF", subRoles: [{ subRole: "SUPER_ADMIN" }] }, ID);
    // SUPER_ADMIN has no id in ID → filtered out; base NORMAL_SALES remains.
    expect(p.profileIds).toEqual([ID.NORMAL_SALES]);
    expect(p.currentProfileId).toBe(ID.NORMAL_SALES);
  });
});

function fakePrisma(users) {
  const state = users.map((u) => ({ isPrimary: false, isSuperSales: false, currentProfileId: null, subRoles: [], ...u }));
  const upserts = [];
  const updates = [];
  return {
    _state: state, _upserts: upserts, _updates: updates,
    profile: { findMany: vi.fn(async () => [
      { id: 10, key: "NORMAL_SALES" }, { id: 20, key: "ACCOUNTANT" }, { id: 30, key: "ADMIN" },
    ]) },
    user: {
      findMany: vi.fn(async () => state.map((u) => ({ id: u.id, role: u.role, isPrimary: u.isPrimary, isSuperSales: u.isSuperSales, currentProfileId: u.currentProfileId, subRoles: u.subRoles }))),
      update: vi.fn(async ({ where, data }) => { updates.push({ id: where.id, ...data }); const u = state.find((x) => x.id === where.id); u.currentProfileId = data.currentProfileId; return u; }),
    },
    userProfile: { upsert: vi.fn(async ({ create }) => { upserts.push(create); return create; }) },
  };
}

describe("runUserProfileMigration (mocked prisma)", () => {
  it("upserts a UserProfile per derived profile and sets current only when null", async () => {
    const db = fakePrisma([
      { id: 1, role: "STAFF", subRoles: [{ subRole: "ACCOUNTANT" }] },
      { id: 2, role: "ADMIN", currentProfileId: 30 },
    ]);
    const r = await runUserProfileMigration({ prisma: db });
    expect(r).toEqual({ scanned: 2, assigned: 3, currentSet: 1 });
    expect(new Set(db._upserts.filter((u) => u.userId === 1).map((u) => u.profileId))).toEqual(new Set([10, 20]));
    expect(db._updates).toEqual([{ id: 1, currentProfileId: 10 }]);
  });

  it("is idempotent — a re-run with currents already set assigns rows but sets 0 currents", async () => {
    const db = fakePrisma([{ id: 1, role: "ADMIN", currentProfileId: 30 }]);
    const r = await runUserProfileMigration({ prisma: db });
    expect(r.currentSet).toBe(0);
  });
});

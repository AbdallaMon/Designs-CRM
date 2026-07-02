import { describe, it, expect, vi } from "vitest";
import { runProfileBackfill } from "../backfill-profiles.js";

function fakePrisma(rows) {
  const users = rows.map((r) => ({ isPrimary: false, isSuperSales: false, profile: null, ...r }));
  return {
    user: {
      findMany: vi.fn(async ({ where }) =>
        users.filter((u) => (where?.profile === null ? u.profile === null : true))
             .map((u) => ({ id: u.id, role: u.role, isPrimary: u.isPrimary, isSuperSales: u.isSuperSales }))),
      update: vi.fn(async ({ where, data }) => {
        const u = users.find((x) => x.id === where.id);
        u.profile = data.profile;
        return u;
      }),
    },
    _users: users,
  };
}

describe("runProfileBackfill", () => {
  it("assigns the derived profile to every unbackfilled user", async () => {
    const prisma = fakePrisma([
      { id: 1, role: "STAFF" },
      { id: 2, role: "STAFF", isPrimary: true },
      { id: 3, role: "STAFF", isSuperSales: true },
      { id: 4, role: "THREE_D_DESIGNER" },
      { id: 5, role: "ACCOUNTANT" },
    ]);
    const res = await runProfileBackfill({ prisma });
    expect(res).toEqual({ scanned: 5, updated: 5 });
    expect(prisma._users.map((u) => u.profile)).toEqual([
      "NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES", "DESIGNER_3D", "ACCOUNTANT",
    ]);
  });

  it("is idempotent — a second run updates nothing", async () => {
    const prisma = fakePrisma([{ id: 1, role: "STAFF" }]);
    await runProfileBackfill({ prisma });
    const second = await runProfileBackfill({ prisma });
    expect(second).toEqual({ scanned: 0, updated: 0 });
  });
});

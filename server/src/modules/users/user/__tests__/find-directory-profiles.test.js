// The designer/staff picker must find every user who HOLDS the requested role —
// from their assigned PROFILES, not from the legacy `role` column (which is
// write-synced from whichever profile they are currently signed in as, and so
// changes under them when they switch profile).
import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();
const findUnique = vi.fn();

vi.mock("../../../../infra/prisma/prisma.js", () => ({
  default: { user: { findMany: (...a) => findMany(...a), findUnique: (...a) => findUnique(...a) } },
}));

import { userRepository } from "../user.repo.js";

/** Pull the OR-clauses the repo built for a given call. */
function whereOf() {
  return findMany.mock.calls[0][0].where;
}

const admin = { id: 1, role: "ADMIN" };

describe("findDirectory — profiles are the source of truth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([]);
  });

  it("matches users holding a profile whose baseRole is the requested role", async () => {
    await userRepository.findDirectory({
      searchParams: { role: "TWO_D_DESIGNER" },
      currentUser: admin,
    });
    expect(whereOf().OR).toContainEqual({
      userProfiles: { some: { profile: { baseRole: "TWO_D_DESIGNER" } } },
    });
  });

  it("still matches the legacy role and subRole columns (not yet retired)", async () => {
    await userRepository.findDirectory({
      searchParams: { role: "TWO_D_DESIGNER" },
      currentUser: admin,
    });
    const or = whereOf().OR;
    expect(or).toContainEqual({ role: "TWO_D_DESIGNER" });
    expect(or).toContainEqual({ subRoles: { some: { subRole: "TWO_D_DESIGNER" } } });
  });

  // The reported bug: a designer holding DESIGNER_3D + DESIGNER_2D whose ACTIVE
  // profile is 3D has role="THREE_D_DESIGNER" and no subRoles, so the legacy-only
  // query missed him on a 2D project.
  it("finds a 3D+2D designer on a 2D project regardless of his active profile", async () => {
    const multiProfileDesigner = {
      id: 7,
      role: "THREE_D_DESIGNER", // synced from his ACTIVE (3D) profile
      subRoles: [], // nothing writes UserSubRole anymore
      userProfiles: [
        { profile: { key: "DESIGNER_3D", baseRole: "THREE_D_DESIGNER" } },
        { profile: { key: "DESIGNER_2D", baseRole: "TWO_D_DESIGNER" } },
      ],
    };
    findMany.mockImplementation(async ({ where }) =>
      // Emulate Prisma OR semantics against the one candidate row.
      where.OR.some(
        (c) =>
          c.role === multiProfileDesigner.role ||
          multiProfileDesigner.subRoles.some((s) => s.subRole === c.subRoles?.some?.subRole) ||
          multiProfileDesigner.userProfiles.some(
            (up) => up.profile.baseRole === c.userProfiles?.some?.profile?.baseRole,
          ),
      )
        ? [multiProfileDesigner]
        : [],
    );

    const found = await userRepository.findDirectory({
      searchParams: { role: "TWO_D_DESIGNER" },
      currentUser: admin,
    });
    expect(found).toHaveLength(1);
    expect(found[0].id).toBe(7);
  });

  it("does NOT offer a 3D-only designer for a 2D project", async () => {
    const threeDOnly = {
      id: 8,
      role: "THREE_D_DESIGNER",
      subRoles: [],
      userProfiles: [{ profile: { key: "DESIGNER_3D", baseRole: "THREE_D_DESIGNER" } }],
    };
    findMany.mockImplementation(async ({ where }) =>
      where.OR.some(
        (c) =>
          c.role === threeDOnly.role ||
          threeDOnly.userProfiles.some(
            (up) => up.profile.baseRole === c.userProfiles?.some?.profile?.baseRole,
          ),
      )
        ? [threeDOnly]
        : [],
    );

    const found = await userRepository.findDirectory({
      searchParams: { role: "TWO_D_DESIGNER" },
      currentUser: admin,
    });
    expect(found).toEqual([]);
  });

  it("exactRole drops the loose subRole clause but keeps profile matching", async () => {
    await userRepository.findDirectory({
      searchParams: { role: "STAFF" },
      currentUser: admin,
      exactRole: true,
    });
    const or = whereOf().OR;
    expect(or).toContainEqual({ role: "STAFF" });
    expect(or).toContainEqual({ userProfiles: { some: { profile: { baseRole: "STAFF" } } } });
    expect(or).not.toContainEqual({ subRoles: { some: { subRole: "STAFF" } } });
  });

  it("builds a non-admin's peer group from every role they hold, incl. profiles", async () => {
    findUnique.mockResolvedValue({
      id: 9,
      role: "THREE_D_DESIGNER",
      subRoles: [{ subRole: "STAFF" }],
      userProfiles: [{ profile: { baseRole: "TWO_D_DESIGNER" } }],
    });
    await userRepository.findDirectory({
      searchParams: { role: "TWO_D_DESIGNER" },
      currentUser: { id: 9, role: "THREE_D_DESIGNER" },
    });
    const or = whereOf().OR;
    // his held 2D profile widens his peer group to 2D designers
    expect(or).toContainEqual({ userProfiles: { some: { profile: { baseRole: "TWO_D_DESIGNER" } } } });
    expect(or).toContainEqual({ role: "THREE_D_DESIGNER" });
    expect(or).toContainEqual({ role: "STAFF" });
  });
});

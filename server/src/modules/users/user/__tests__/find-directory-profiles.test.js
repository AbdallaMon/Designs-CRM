import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();
const findUnique = vi.fn();

vi.mock("../../../../infra/prisma/prisma.js", () => ({
  default: {
    user: {
      findMany: (...args) => findMany(...args),
      findUnique: (...args) => findUnique(...args),
    },
  },
}));

import { userRepository } from "../user.repo.js";

const admin = {
  id: 1,
  currentProfileKey: "ADMIN",
  isAdminTier: true,
};

function whereOf() {
  return findMany.mock.calls[0][0].where;
}

function matchesProfileWhere(user, where) {
  return where.OR.some((clause) => {
    const key = clause.userProfiles?.some?.profile?.key;
    return user.userProfiles.some((entry) => entry.profile.key === key);
  });
}

describe("findDirectory — assigned profiles are the sole source of truth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([]);
  });

  it("matches only users assigned the requested profile", async () => {
    await userRepository.findDirectory({
      searchParams: { profile: "DESIGNER_2D" },
      currentUser: admin,
    });

    expect(whereOf().OR).toEqual([
      { userProfiles: { some: { profile: { key: "DESIGNER_2D" } } } },
    ]);
    expect(whereOf()).not.toHaveProperty("role");
    expect(whereOf()).not.toHaveProperty("subRoles");
  });

  it("finds a multi-profile designer regardless of the active profile", async () => {
    const designer = {
      id: 7,
      currentProfile: { key: "DESIGNER_3D" },
      userProfiles: [
        { profile: { key: "DESIGNER_3D" } },
        { profile: { key: "DESIGNER_2D" } },
      ],
    };
    findMany.mockImplementation(async ({ where }) =>
      matchesProfileWhere(designer, where) ? [designer] : [],
    );

    const found = await userRepository.findDirectory({
      searchParams: { profile: "DESIGNER_2D" },
      currentUser: admin,
    });

    expect(found).toEqual([designer]);
  });

  it("does not offer a 3D-only designer for a 2D profile search", async () => {
    const designer = {
      id: 8,
      currentProfile: { key: "DESIGNER_3D" },
      userProfiles: [{ profile: { key: "DESIGNER_3D" } }],
    };
    findMany.mockImplementation(async ({ where }) =>
      matchesProfileWhere(designer, where) ? [designer] : [],
    );

    const found = await userRepository.findDirectory({
      searchParams: { profile: "DESIGNER_2D" },
      currentUser: admin,
    });

    expect(found).toEqual([]);
  });

  it("builds a non-admin peer group from every assigned profile", async () => {
    findUnique.mockResolvedValue({
      userProfiles: [
        { profile: { key: "DESIGNER_3D" } },
        { profile: { key: "DESIGNER_2D" } },
      ],
    });

    await userRepository.findDirectory({
      searchParams: { profile: "DESIGNER_2D" },
      currentUser: {
        id: 9,
        currentProfileKey: "DESIGNER_3D",
        isAdminTier: false,
      },
    });

    expect(whereOf().OR).toEqual([
      { userProfiles: { some: { profile: { key: "DESIGNER_3D" } } } },
      { userProfiles: { some: { profile: { key: "DESIGNER_2D" } } } },
    ]);
  });
});

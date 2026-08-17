import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn().mockResolvedValue([]);
const count = vi.fn().mockResolvedValue(0);

vi.mock("@dms/db", () => ({
  default: {
    user: { findMany, count },
  },
}));

let userRepository;

beforeEach(async () => {
  vi.clearAllMocks();
  ({ userRepository } = await import("../user.repo.js"));
});

describe("management-list profile hierarchy", () => {
  it("ADMIN can list SUPER_ADMIN and every lower profile", async () => {
    await userRepository.findManagementList({
      searchParams: {},
      currentUser: { id: 1, currentProfileKey: "ADMIN" },
      skip: 0,
      take: 20,
    });

    const where = findMany.mock.calls[0][0].where;
    expect(where.id).toEqual({ not: 1 });
    expect(where.userProfiles).toBeUndefined();
  });

  it("SUPER_ADMIN excludes every user holding ADMIN", async () => {
    await userRepository.findManagementList({
      searchParams: {},
      currentUser: { id: 5, currentProfileKey: "SUPER_ADMIN" },
      skip: 0,
      take: 20,
    });

    expect(findMany.mock.calls[0][0].where.userProfiles).toEqual({
      none: { profile: { key: "ADMIN" } },
    });
  });

  it("SUPER_SALES lists sales-family users but excludes every admin-tier account", async () => {
    await userRepository.findManagementList({
      searchParams: {},
      currentUser: { id: 8, currentProfileKey: "SUPER_SALES" },
      skip: 0,
      take: 20,
    });

    expect(findMany.mock.calls[0][0].where.AND).toEqual([
      { userProfiles: { some: { profile: { family: "SALES" } } } },
      { userProfiles: { none: { profile: { isAdminTier: true } } } },
    ]);
  });
});

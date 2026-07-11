import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lead.repo.js", () => ({
  leadRepository: {
    findColumnLeads: vi.fn().mockResolvedValue([]),
    aggregateColumn: vi.fn().mockResolvedValue({ _sum: { averagePrice: 0 }, _count: { id: 0 } }),
    aggregateExtraServices: vi.fn().mockResolvedValue({ _sum: { price: 0 } }),
  },
}));

import { getClientLeadsColumnStatus } from "../lead.assign-status.usecase.js";

describe("getClientLeadsColumnStatus filters default", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not throw when no filters param is supplied", async () => {
    await expect(
      getClientLeadsColumnStatus({
        searchParams: { status: "NEGOTIATING", type: "STAFF" }, // no `filters`
        isAdmin: true,
        user: { id: 1, role: "ADMIN" },
      }),
    ).resolves.toEqual({
      data: [],
      totalValue: "0.00",
      totalLeads: 0,
    });
  });
});

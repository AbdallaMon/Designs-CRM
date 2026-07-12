// Query-shape tests for the My Day batch cockpit fetch: caller-scoped (userId), status
// allow-list, oldest-touched-first cap, and the same free-text reduction as the single
// findCockpitBundle. Prisma mocked — no DB.
import { describe, it, expect, beforeEach, vi } from "vitest";

const findMany = vi.fn().mockResolvedValue([]);
const count = vi.fn().mockResolvedValue(0);

vi.mock("@dms/db", () => ({
  default: {
    clientLead: { findMany, count },
  },
}));

let leadRepository;
let MY_DAY_LEAD_STATUSES;

beforeEach(async () => {
  vi.clearAllMocks();
  ({ leadRepository, MY_DAY_LEAD_STATUSES } = await import("../lead.repo.js"));
});

describe("findCockpitBundlesForUser", () => {
  it("scopes to the target user, allow-listed statuses, oldest-updated first, capped", async () => {
    await leadRepository.findCockpitBundlesForUser({ userId: 7, take: 50 });
    expect(findMany).toHaveBeenCalledTimes(1);
    const args = findMany.mock.calls[0][0];
    expect(args.where).toEqual({ userId: 7, status: { in: MY_DAY_LEAD_STATUSES } });
    expect(args.orderBy).toEqual({ updatedAt: "asc" });
    expect(args.take).toBe(50);
    // Batch select = the cockpit select + display name (client.name) + updatedAt.
    expect(args.select.updatedAt).toBe(true);
    expect(args.select.client).toEqual({ select: { name: true } });
    expect(args.select.versaModel).toBeTruthy(); // same signal inputs as the single fetch
  });

  it("reduces VERSA free-text to presence booleans (never leaks question text)", async () => {
    findMany.mockResolvedValueOnce([
      {
        id: 5,
        versaModel: [{ v: { question: "secret?", answer: null, clientResponse: "yes" }, e: null, r: null, s: null, a: null }],
      },
    ]);
    const rows = await leadRepository.findCockpitBundlesForUser({ userId: 7 });
    expect(rows[0].versaModel[0].v).toEqual({ hasQuestion: true, hasResponse: true });
    expect(JSON.stringify(rows)).not.toContain("secret?");
  });

  it("MY_DAY_LEAD_STATUSES excludes dead + parked statuses", () => {
    expect(MY_DAY_LEAD_STATUSES).toEqual(
      expect.arrayContaining(["NEW", "IN_PROGRESS", "INTERESTED", "NEEDS_IDENTIFIED", "NEGOTIATING", "FINALIZED", "CONVERTED"]),
    );
    expect(MY_DAY_LEAD_STATUSES).not.toContain("REJECTED");
    expect(MY_DAY_LEAD_STATUSES).not.toContain("ARCHIVED");
    expect(MY_DAY_LEAD_STATUSES).not.toContain("ON_HOLD");
  });

  it("countMyDayLeads counts the same scope", async () => {
    await leadRepository.countMyDayLeads({ userId: 7 });
    expect(count).toHaveBeenCalledWith({
      where: { userId: 7, status: { in: MY_DAY_LEAD_STATUSES } },
    });
  });
});

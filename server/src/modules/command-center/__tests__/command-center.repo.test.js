// Repo-level unit tests for the query SHAPES that carry business meaning (the parts a
// usecase test — which mocks the repo — can't see). Prisma is mocked (no DB); we assert the
// exact `where` / `_sum` args each aggregate is called with. Focus: the "Finalized Value" KPI
// aligns with the dashboard's won-deal definition, and the money boundary stays intact.
import { describe, it, expect, beforeEach, vi } from "vitest";

const aggregate = vi.fn().mockResolvedValue({ _sum: {} });
const commissionAggregate = vi.fn().mockResolvedValue({ _sum: { amount: null } });

vi.mock("@dms/db", () => ({
  default: {
    clientLead: { aggregate },
    commission: { aggregate: commissionAggregate },
  },
}));

let commandCenterRepository;
let FINALIZED_DEAL_STATUSES;

beforeEach(async () => {
  vi.clearAllMocks();
  ({ commandCenterRepository, FINALIZED_DEAL_STATUSES } = await import(
    "../command-center.repo.js"
  ));
});

describe("commandCenterRepository.finalizedValue — won-deal parity with dashboard", () => {
  it("counts only FINALIZED + ARCHIVED as realized value (CONVERTED is a LOST outcome)", () => {
    expect([...FINALIZED_DEAL_STATUSES]).toEqual(["FINALIZED", "ARCHIVED"]);
  });

  it("scopes the aggregate by finalizedDate within the range (NOT createdAt)", () => {
    const from = new Date("2026-07-01T00:00:00Z");
    const to = new Date("2026-07-10T00:00:00Z");
    commandCenterRepository.finalizedValue({ from, to });

    expect(aggregate).toHaveBeenCalledTimes(1);
    const args = aggregate.mock.calls[0][0];
    expect(args._sum).toEqual({ averagePrice: true });
    expect(args.where.status).toEqual({ in: ["FINALIZED", "ARCHIVED"] });
    expect(args.where.finalizedDate).toEqual({ gte: from, lte: to });
    expect(args.where.createdAt).toBeUndefined();
  });

  it("omits the date filter entirely when the range is empty", () => {
    commandCenterRepository.finalizedValue({});
    const args = aggregate.mock.calls[0][0];
    expect(args.where.finalizedDate).toBeUndefined();
    expect(args.where.createdAt).toBeUndefined();
    expect(args.where.status).toEqual({ in: ["FINALIZED", "ARCHIVED"] });
  });
});

describe("commandCenterRepository.commissions — money boundary", () => {
  it("sums only `amount` (drops the unconsumed amountPaid) scoped by createdAt", () => {
    const from = new Date("2026-07-01T00:00:00Z");
    commandCenterRepository.commissions({ from });

    const args = commissionAggregate.mock.calls[0][0];
    expect(args._sum).toEqual({ amount: true });
    expect(args._sum.amountPaid).toBeUndefined();
    expect(args.where.createdAt).toEqual({ gte: from });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    clientLead: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  };
  return {
    tx,
    prisma: {
      clientLead: {
        findUnique: vi.fn(),
        updateMany: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn((work) => work(tx)),
    },
  };
});

vi.mock("../../../../infra/prisma/prisma.js", () => ({
  default: mocks.prisma,
}));

import { paymentsRepository } from "../payments.repo.js";

function pendingLead(overrides = {}) {
  return {
    id: 5,
    paymentStatus: "PENDING",
    paymentSessionId: "cs_bound",
    client: { name: "Client", email: "client@example.com" },
    ...overrides,
  };
}

describe("payments repository fulfillment claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation((work) => work(mocks.tx));
  });

  it("atomically marks paid, binds the session, and saves metadata", async () => {
    mocks.tx.clientLead.findUnique.mockResolvedValue(pendingLead());
    mocks.tx.clientLead.updateMany.mockResolvedValue({ count: 1 });
    const kv = [{ key: "email", value: "client@example.com" }];

    const result = await paymentsRepository.fulfillCheckoutSession({
      clientLeadId: 5,
      sessionId: "cs_bound",
      kv,
    });

    expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mocks.tx.clientLead.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          paymentStatus: "FULLY_PAID",
          paymentSessionId: "cs_bound",
          stripieMetadata: JSON.stringify(kv),
        },
      }),
    );
    expect(result.state).toBe("fulfilled");
  });

  it("rejects a verified session that is not the lead's bound checkout", async () => {
    mocks.tx.clientLead.findUnique.mockResolvedValue(
      pendingLead({ paymentSessionId: "cs_other" }),
    );

    const result = await paymentsRepository.fulfillCheckoutSession({
      clientLeadId: 5,
      sessionId: "cs_bound",
      kv: [],
    });

    expect(result.state).toBe("session_mismatch");
    expect(mocks.tx.clientLead.updateMany).not.toHaveBeenCalled();
  });

  it("does not rewrite an already fulfilled lead", async () => {
    mocks.tx.clientLead.findUnique.mockResolvedValue(
      pendingLead({ paymentStatus: "FULLY_PAID" }),
    );

    const result = await paymentsRepository.fulfillCheckoutSession({
      clientLeadId: 5,
      sessionId: "cs_bound",
      kv: [],
    });

    expect(result.state).toBe("already_fulfilled");
    expect(mocks.tx.clientLead.updateMany).not.toHaveBeenCalled();
  });
});

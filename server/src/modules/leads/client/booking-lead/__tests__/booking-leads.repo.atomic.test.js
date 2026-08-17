import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    clientLead: {
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    client: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  };
  return {
    tx,
    prisma: {
      clientLead: { findFirst: vi.fn() },
      $transaction: vi.fn((work) => work(tx)),
    },
  };
});

vi.mock("../../../../../infra/prisma/prisma.js", () => ({ default: mocks.prisma }));

import { bookingLeadsRepository } from "../booking-leads.repo.js";

describe("booking lead submit claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation((work) => work(mocks.tx));
  });

  it("returns null before client/email side effects when another submit already won", async () => {
    mocks.tx.clientLead.updateMany.mockResolvedValue({ count: 0 });

    const result = await bookingLeadsRepository.submit({
      leadId: 9,
      clientId: 4,
      leadData: {
        bookingRequestStatus: "SUBMITTED",
        bookingSubmittedAt: new Date("2026-08-16T12:00:00Z"),
      },
      clientData: { email: "client@example.com" },
    });

    expect(result).toBeNull();
    expect(mocks.tx.clientLead.findFirst).not.toHaveBeenCalled();
    expect(mocks.tx.client.update).not.toHaveBeenCalled();
  });
});


import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    clientLead: { updateMany: vi.fn(), findUnique: vi.fn() },
    client: { update: vi.fn() },
  };
  return {
    tx,
    prisma: {
      clientLead: {},
      client: {},
      $transaction: vi.fn((work) => work(tx)),
    },
  };
});

vi.mock("../../../../../infra/prisma/prisma.js", () => ({ default: mocks.prisma }));

import { publicLeadRepository } from "../public-lead.repo.js";

describe("public lead completion claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.$transaction.mockImplementation((work) => work(mocks.tx));
  });

  it("updates the client only for the request that claims the draft", async () => {
    mocks.tx.clientLead.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.clientLead.findUnique.mockResolvedValue({ id: 7, clientId: 3 });

    const result = await publicLeadRepository.completeRegistrationDraft({
      id: 7,
      clientId: 3,
      leadData: { description: "DESIGN APARTMENT" },
      clientData: { name: "Client" },
    });

    expect(mocks.tx.clientLead.updateMany).toHaveBeenCalledWith({
      where: { id: 7, description: "Didn't complete register yet" },
      data: { description: "DESIGN APARTMENT" },
    });
    expect(mocks.tx.client.update).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: 7 });
  });

  it("returns null and performs no dependent writes when the draft was already claimed", async () => {
    mocks.tx.clientLead.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      publicLeadRepository.completeRegistrationDraft({
        id: 7,
        clientId: 3,
        leadData: { description: "DESIGN APARTMENT" },
        clientData: { name: "Client" },
      }),
    ).resolves.toBeNull();
    expect(mocks.tx.client.update).not.toHaveBeenCalled();
    expect(mocks.tx.clientLead.findUnique).not.toHaveBeenCalled();
  });
});


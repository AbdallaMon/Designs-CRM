import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    deliverySchedule: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    project: { findUnique: vi.fn() },
    meetingReminder: { findUnique: vi.fn() },
  },
}));

vi.mock("../../../infra/prisma/prisma.js", () => ({ default: prismaMock }));

import { DeliveryRepository } from "../delivery/delivery.repo.js";

describe("delivery schedules from contract stages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps manual schedules and excludes schedules owned by cancelled contracts", async () => {
    prismaMock.deliverySchedule.findMany.mockResolvedValue([]);
    const repository = new DeliveryRepository();

    await repository.findByProject({ projectId: 31 });

    expect(prismaMock.deliverySchedule.findMany).toHaveBeenCalledWith({
      where: {
        projectId: 31,
        OR: [
          { stageId: null },
          {
            stage: {
              is: {
                stageStatus: { not: "NOT_STARTED" },
                contract: { is: { status: { not: "CANCELLED" } } },
              },
            },
          },
        ],
      },
      include: { meeting: true, createdBy: true },
      orderBy: { deliveryAt: "asc" },
    });
  });
});

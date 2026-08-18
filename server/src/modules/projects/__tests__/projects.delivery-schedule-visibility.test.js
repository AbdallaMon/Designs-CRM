import { beforeEach, describe, expect, it, vi } from "vitest";

const { projectFindMany } = vi.hoisted(() => ({ projectFindMany: vi.fn().mockResolvedValue([]) }));

vi.mock("../../../infra/prisma/prisma.js", () => ({
  default: { project: { findMany: projectFindMany } },
}));

import { ProjectRepository } from "../project/project.repo.js";

describe("project delivery-schedule visibility", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps manual schedules but hides not-started and cancelled-contract stage schedules", async () => {
    const repository = new ProjectRepository();
    await repository.findProjectsWithSchedules({ clientLeadId: 100 });

    const scheduleWhere = projectFindMany.mock.calls[0][0].include.deliverySchedules.where;
    expect(scheduleWhere.AND[1]).toEqual({
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
    });
  });
});

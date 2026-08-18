import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => {
  const model = () => ({
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  });
  return {
    prismaMock: {
      $transaction: vi.fn(),
      contract: model(),
      contractPayment: model(),
      contractStage: model(),
      contractDrawing: model(),
      contractSpecialItem: model(),
      project: model(),
      autoAssignment: model(),
      client: model(),
      deliverySchedule: model(),
    },
  };
});

vi.mock("../../../infra/prisma/prisma.js", () => ({ default: prismaMock }));
vi.mock("../../projects/project/project.usecase.js", () => ({
  assignProjectToUser: vi.fn(),
}));

import {
  createContract,
  createNewContractPayment,
  deleteContractPayment,
  updateContractBasics,
  updateContractDrwaing,
  updateContractPayment,
  updateContractSpecialItem,
  updateContractStage,
  checkIfProjectHasStagesAndUpdateNextAndPrevious,
  updateSecondStageAfterFirstPayment,
  overrideContractStageStatus,
} from "../contract/contract.workflow.repo.js";

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation((task) => task(prismaMock));
});

describe("contract workflow transactional writes", () => {
  it("keeps the complete create graph inside one rollback boundary", async () => {
    prismaMock.contract.create.mockResolvedValue({ id: 7 });
    prismaMock.contractPayment.create.mockResolvedValue({ id: 11 });
    prismaMock.contractStage.create.mockRejectedValue(new Error("stage insert failed"));

    await expect(
      createContract({
        payload: {
          clientLeadId: 100,
          title: "Villa",
          payments: [{ amount: 100, condition: "SIGNATURE" }],
          stages: [{ levelEnum: "LEVEL_1", deliveryDays: 1, deptDeliveryDays: 1 }],
        },
      }),
    ).rejects.toThrow("stage insert failed");

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.contract.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.contractPayment.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.contractStage.create).toHaveBeenCalledTimes(1);
  });

  it("reassigns every linked stage and payment by contractId to the target lead/group", async () => {
    prismaMock.contract.findUnique.mockResolvedValue({ id: 7, clientLeadId: 100 });
    prismaMock.contractStage.findMany.mockResolvedValue([
      { id: 1, project: { type: "2D_Study" } },
      { id: 2, project: { type: "3D_Designer" } },
    ]);
    prismaMock.contractPayment.findMany.mockResolvedValue([
      { id: 3, project: { type: "2D_Study" } },
      { id: 4, project: { type: "3D_Designer" } },
    ]);
    prismaMock.project.findFirst.mockImplementation(async ({ where }) => ({
      id: where.type === "2D_Study" ? 201 : 202,
    }));
    prismaMock.contractStage.update.mockResolvedValue({});
    prismaMock.contractPayment.update.mockResolvedValue({});
    prismaMock.contract.update.mockResolvedValue({});

    await updateContractBasics({ contractId: 7, projectGroupId: 22 });

    expect(prismaMock.contractStage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { contractId: 7, projectId: { not: null } },
      }),
    );
    expect(prismaMock.contractPayment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { contractId: 7, projectId: { not: null } },
      }),
    );
    expect(prismaMock.project.findFirst).toHaveBeenCalledTimes(4);
    for (const [{ where }] of prismaMock.project.findFirst.mock.calls) {
      expect(where).toMatchObject({ groupId: 22, clientLeadId: 100 });
    }
    expect(prismaMock.contractStage.update).toHaveBeenCalledTimes(2);
    expect(prismaMock.contractPayment.update).toHaveBeenCalledTimes(2);
  });

  it("keeps payment create/update/delete and total recomputation in their transactions", async () => {
    prismaMock.contract.findUnique
      .mockResolvedValueOnce({
        id: 7,
        clientLeadId: 100,
        projectGroupId: 22,
        amount: 10,
        taxRate: 5,
      })
      .mockResolvedValueOnce({ id: 7, taxRate: 5, paymentsNew: [{ amount: 25 }] });
    prismaMock.contractPayment.create.mockResolvedValue({ id: 1, amount: 25 });
    prismaMock.contract.update.mockResolvedValue({});
    await createNewContractPayment({
      contractId: 7,
      payment: { amount: 25, condition: "SIGNATURE" },
    });

    prismaMock.contractPayment.findUnique
      .mockResolvedValueOnce({
        id: 1,
        contractId: 7,
        contract: { clientLeadId: 100, projectGroupId: 22 },
        project: null,
      })
      .mockResolvedValueOnce({ id: 2, contractId: 7, paymentCondition: "MILESTONE" });
    prismaMock.contract.findUnique
      .mockResolvedValueOnce({ id: 7, taxRate: 5, paymentsNew: [{ amount: 0 }] })
      .mockResolvedValueOnce({ id: 7, taxRate: 5, paymentsNew: [] });
    prismaMock.contractPayment.update.mockResolvedValue({});
    prismaMock.contractPayment.delete.mockResolvedValue({});
    await updateContractPayment({ paymentId: 1, newPayment: { amount: 0 } });
    await deleteContractPayment({ paymentId: 2 });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(3);
    expect(prismaMock.contract.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { amount: 0, totalAmount: 0 } }),
    );
  });
});

describe("contract workflow explicit clears and zero values", () => {
  it("does not silently ignore nullable clears or legitimate zero values", async () => {
    prismaMock.contractPayment.findUnique.mockResolvedValue({
      id: 1,
      contractId: 7,
      contract: { clientLeadId: 100, projectGroupId: 22 },
      project: null,
    });
    prismaMock.contract.findUnique.mockResolvedValue({
      id: 7,
      taxRate: 5,
      paymentsNew: [{ amount: 0 }],
    });
    prismaMock.contractPayment.update.mockResolvedValue({});
    prismaMock.contract.update.mockResolvedValue({});
    await updateContractPayment({
      paymentId: 1,
      newPayment: { amount: 0, note: null, conditionId: null, type: null },
    });
    expect(prismaMock.contractPayment.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { amount: 0, note: null, conditionId: null, projectId: null },
    });

    prismaMock.contractStage.update.mockResolvedValue({});
    await updateContractStage({ stageId: 2, newStage: { deliveryDays: 0, deptDeliveryDays: null } });
    expect(prismaMock.contractStage.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { deliveryDays: 0, deptDeliveryDays: null },
    });

    prismaMock.contractDrawing.update.mockResolvedValue({});
    await updateContractDrwaing({ drawId: 3, newDrawing: { fileName: null } });
    expect(prismaMock.contractDrawing.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { fileName: null },
    });

    prismaMock.contractSpecialItem.update.mockResolvedValue({});
    await updateContractSpecialItem({
      specialItemId: 4,
      newSpecialItem: { labelAr: null, labelEn: "" },
    });
    expect(prismaMock.contractSpecialItem.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { labelAr: null, labelEn: "" },
    });
  });

  it("recalculates an existing internal schedule from the stage activation time", async () => {
    prismaMock.contractStage.findUnique.mockResolvedValue({
      startDate: new Date("2026-08-01T00:00:00.000Z"),
      deliverySchedule: { id: 9, createdAt: new Date("2026-07-15T00:00:00.000Z") },
    });
    prismaMock.deliverySchedule.update.mockResolvedValue({});
    prismaMock.contractStage.update.mockResolvedValue({});

    await updateContractStage({ stageId: 2, newStage: { deptDeliveryDays: 5 } });

    expect(prismaMock.deliverySchedule.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { deliveryAt: new Date("2026-08-06T00:00:00.000Z") },
    });
  });
});

describe("contract stage chain", () => {
  it.each([
    ["2D_Study", "LEVEL_2"],
    ["3D_Designer", "LEVEL_3"],
    ["2D_Final_Plans", "LEVEL_4"],
    ["2D_Quantity_Calculation", "LEVEL_5"],
  ])("maps completed %s to active %s", async (projectType, expectedLevel) => {
    prismaMock.contractStage.findMany.mockResolvedValue([]);

    await checkIfProjectHasStagesAndUpdateNextAndPrevious({
      projectId: 201,
      status: "Completed",
      projectType,
      clientLeadId: 100,
      groupId: 22,
    });

    expect(prismaMock.contractStage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ title: expectedLevel, stageStatus: "IN_PROGRESS" }),
      }),
    );
  });

  it("completes the matching active level and skips to the next configured level", async () => {
    prismaMock.contractStage.findMany.mockResolvedValue([
      { id: 20, contractId: 7, title: "LEVEL_2", order: 2, stageStatus: "IN_PROGRESS" },
    ]);
    prismaMock.contractStage.findFirst.mockResolvedValue({
      id: 40,
      contractId: 7,
      title: "LEVEL_4",
      order: 4,
      stageStatus: "NOT_STARTED",
    });
    prismaMock.contractStage.findUnique.mockResolvedValue({
      id: 40,
      title: "LEVEL_4",
      deptDeliveryDays: 6,
      startDate: new Date("2026-08-18T00:00:00.000Z"),
      contract: { clientLeadId: 100, projectGroupId: 22 },
    });
    prismaMock.project.findFirst.mockResolvedValue({ id: 304 });
    prismaMock.contractStage.update.mockResolvedValue({});
    prismaMock.deliverySchedule.upsert.mockResolvedValue({ id: 1 });

    const transitioned = await checkIfProjectHasStagesAndUpdateNextAndPrevious({
      projectId: 201,
      status: "Completed",
      projectType: "2D_Study",
      clientLeadId: 100,
      groupId: 22,
    });

    expect(transitioned).toBe(true);
    expect(prismaMock.contractStage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ title: "LEVEL_2", stageStatus: "IN_PROGRESS" }),
      }),
    );
    expect(prismaMock.contractStage.findFirst).toHaveBeenCalledWith({
      where: { contractId: 7, order: { gt: 2 }, stageStatus: "NOT_STARTED" },
      orderBy: { order: "asc" },
    });
    expect(prismaMock.contractStage.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: 20 },
        data: expect.objectContaining({ stageStatus: "COMPLETED", endDate: expect.any(Date) }),
      }),
    );
    expect(prismaMock.contractStage.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: 40 },
        data: expect.objectContaining({ stageStatus: "IN_PROGRESS", startDate: expect.any(Date) }),
      }),
    );
    expect(prismaMock.deliverySchedule.upsert).toHaveBeenCalledWith({
      where: { stageId: 40 },
      update: { deliveryAt: expect.any(Date), projectId: 304 },
      create: { deliveryAt: expect.any(Date), projectId: 304, stageId: 40 },
    });
  });

  it("closes a terminal stage and completes the contract when payments are settled", async () => {
    prismaMock.contractStage.findMany.mockResolvedValue([
      { id: 50, contractId: 7, title: "LEVEL_5", order: 5, stageStatus: "IN_PROGRESS" },
    ]);
    prismaMock.contractStage.findFirst.mockResolvedValue(null);
    prismaMock.contractStage.count.mockResolvedValue(0);
    prismaMock.contractPayment.count.mockResolvedValue(0);
    prismaMock.contractStage.update.mockResolvedValue({});
    prismaMock.contract.update.mockResolvedValue({});

    await checkIfProjectHasStagesAndUpdateNextAndPrevious({
      projectId: 205,
      status: "Completed",
      projectType: "2D_Quantity_Calculation",
      clientLeadId: 100,
      groupId: 22,
    });

    expect(prismaMock.contractStage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 50 },
        data: expect.objectContaining({ stageStatus: "COMPLETED" }),
      }),
    );
    expect(prismaMock.contract.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { status: "COMPLETED" },
    });
  });

  it("is idempotent when the project has no matching active level", async () => {
    prismaMock.contractStage.findMany.mockResolvedValue([]);

    const transitioned = await checkIfProjectHasStagesAndUpdateNextAndPrevious({
      projectId: 201,
      status: "Completed",
      projectType: "2D_Study",
      clientLeadId: 100,
      groupId: 22,
    });

    expect(transitioned).toBe(false);
    expect(prismaMock.contractStage.update).not.toHaveBeenCalled();
  });

  it("signature payment completes LEVEL_1 and skips a missing LEVEL_2", async () => {
    prismaMock.contract.findUnique.mockResolvedValue({
      id: 7,
      status: "IN_PROGRESS",
      clientLeadId: 100,
      projectGroupId: 22,
      stages: [
        { id: 10, contractId: 7, title: "LEVEL_1", order: 1, stageStatus: "IN_PROGRESS" },
        { id: 30, contractId: 7, title: "LEVEL_3", order: 3, stageStatus: "NOT_STARTED" },
      ],
    });
    prismaMock.contractStage.findFirst.mockResolvedValue({
      id: 30,
      contractId: 7,
      title: "LEVEL_3",
      order: 3,
      stageStatus: "NOT_STARTED",
    });
    prismaMock.contractStage.findUnique.mockResolvedValue({
      id: 30,
      title: "LEVEL_3",
      deptDeliveryDays: 4,
      startDate: new Date(),
      contract: { clientLeadId: 100, projectGroupId: 22 },
    });
    prismaMock.project.findFirst.mockResolvedValue({ id: 303 });
    prismaMock.contractStage.update.mockResolvedValue({});
    prismaMock.deliverySchedule.upsert.mockResolvedValue({ id: 1 });

    await updateSecondStageAfterFirstPayment({ contractId: 7 });

    expect(prismaMock.contractStage.findFirst).toHaveBeenCalledWith({
      where: { contractId: 7, order: { gt: 1 }, stageStatus: "NOT_STARTED" },
      orderBy: { order: "asc" },
    });
    expect(prismaMock.contractStage.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { id: 30 }, data: expect.objectContaining({ stageStatus: "IN_PROGRESS" }) }),
    );
  });

  it("admin override reconciles the chain to one active stage", async () => {
    prismaMock.contract.findUnique.mockResolvedValue({
      id: 7,
      status: "COMPLETED",
      clientLeadId: 100,
      projectGroupId: 22,
      stages: [
        { id: 10, contractId: 7, title: "LEVEL_1", order: 1, stageStatus: "COMPLETED", startDate: new Date(), endDate: new Date() },
        { id: 30, contractId: 7, title: "LEVEL_3", order: 3, stageStatus: "COMPLETED", startDate: new Date(), endDate: new Date() },
        { id: 50, contractId: 7, title: "LEVEL_5", order: 5, stageStatus: "COMPLETED", startDate: new Date(), endDate: new Date() },
      ],
    });
    prismaMock.contractStage.findUnique.mockResolvedValue({
      id: 30,
      title: "LEVEL_3",
      deptDeliveryDays: 4,
      startDate: new Date(),
      contract: { clientLeadId: 100, projectGroupId: 22 },
    });
    prismaMock.project.findFirst.mockResolvedValue({ id: 303 });
    prismaMock.contractStage.update.mockResolvedValue({});
    prismaMock.contract.update.mockResolvedValue({});
    prismaMock.deliverySchedule.upsert.mockResolvedValue({ id: 1 });

    const result = await overrideContractStageStatus({ contractId: 7, stageId: 30, status: "IN_PROGRESS" });

    expect(result.previousStatus).toBe("COMPLETED");
    expect(result.activeStage).toMatchObject({ id: 30, stageStatus: "IN_PROGRESS" });
    const resultingStatuses = prismaMock.contractStage.update.mock.calls.map(([call]) => call.data.stageStatus);
    expect(resultingStatuses).toEqual(["COMPLETED", "IN_PROGRESS", "NOT_STARTED"]);
    expect(prismaMock.contract.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { status: "IN_PROGRESS" } });
  });

  it("rejects stage repair on a cancelled contract", async () => {
    prismaMock.contract.findUnique.mockResolvedValue({
      id: 7,
      status: "CANCELLED",
      clientLeadId: 100,
      projectGroupId: 22,
      stages: [{ id: 10, contractId: 7, title: "LEVEL_1", order: 1, stageStatus: "IN_PROGRESS" }],
    });

    await expect(
      overrideContractStageStatus({ contractId: 7, stageId: 10, status: "COMPLETED" }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "CONTRACT_STAGE_OVERRIDE_CANCELLED",
    });
    expect(prismaMock.contractStage.update).not.toHaveBeenCalled();
  });
});

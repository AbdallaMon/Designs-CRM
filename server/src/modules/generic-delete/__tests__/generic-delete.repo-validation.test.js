import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  const delegate = () => ({
    findUnique: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    findMany: vi.fn(),
  });
  const prisma = {
    note: delegate(),
    file: delegate(),
    priceOffers: delegate(),
    extraService: delegate(),
    meetingReminder: delegate(),
    callReminder: delegate(),
    clientLeadUpdate: delegate(),
    deliverySchedule: delegate(),
    contract: delegate(),
    contractPaymentCondition: delegate(),
    task: delegate(),
    availableSlot: delegate(),
    project: delegate(),
    contractPayment: delegate(),
    contractDrawing: delegate(),
    contractSpecialItem: delegate(),
    contractStage: delegate(),
    sharedUpdate: delegate(),
  };
  prisma.$transaction = vi.fn(async (operation) => {
    if (typeof operation === "function") return operation(prisma);
    return Promise.all(operation);
  });
  return prisma;
});

vi.mock("../../../infra/prisma/prisma.js", () => ({ default: db }));
vi.mock("../../../infra/google/google-calendar.client.js", () => ({
  deleteCalendarEvent: vi.fn(),
}));
vi.mock("../../notes/note.usecase.js", () => ({
  checkNoteDeletionAccess: vi.fn(),
}));
vi.mock("../../leads/lead/lead.repo.js", () => ({
  leadRepository: {},
}));
vi.mock("../../projects/project/project.repo.js", () => ({
  projectRepository: {},
}));

import {
  DELETABLE_MODELS,
  GENERIC_DELETE_MODEL_MAP,
} from "../generic-delete.config.js";
import { genericDeleteRepository } from "../generic-delete.repo.js";
import { genericDeleteRouter } from "../generic-delete.route.js";
import { genericDeleteSchemas } from "../generic-delete.validation.js";

const EXPECTED_DELEGATES = {
  Note: "note",
  File: "file",
  PriceOffers: "priceOffers",
  ExtraService: "extraService",
  MeetingReminder: "meetingReminder",
  CallReminder: "callReminder",
  ClientLeadUpdate: "clientLeadUpdate",
  DeliverySchedule: "deliverySchedule",
  contract: "contract",
  Contract: "contract",
  contractPaymentCondition: "contractPaymentCondition",
  ContractPaymentCondition: "contractPaymentCondition",
};

describe("generic delete model mapping and validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps every allowed compatibility name to the intended Prisma delegate", async () => {
    expect(DELETABLE_MODELS).toEqual(Object.keys(EXPECTED_DELEGATES));

    for (const [model, delegateName] of Object.entries(EXPECTED_DELEGATES)) {
      db[delegateName].findUnique.mockResolvedValueOnce({ createdAt: new Date() });
      await genericDeleteRepository.findModelCreatedAt({ model, id: 9 });
      expect(GENERIC_DELETE_MODEL_MAP[model].delegate).toBe(delegateName);
      expect(db[delegateName].findUnique).toHaveBeenLastCalledWith({
        where: { id: 9 },
        select: { createdAt: true },
      });
    }
  });

  it("rejects an unknown model before repository dispatch", () => {
    const result = genericDeleteSchemas.remove.safeParse({ model: "User" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("MODEL_NOT_DELETABLE");
  });

  it("keeps Task mapped for its dedicated endpoint without exposing it publicly", async () => {
    expect(DELETABLE_MODELS).not.toContain("Task");
    expect(GENERIC_DELETE_MODEL_MAP.Task.delegate).toBe("task");
    db.task.findUnique.mockResolvedValue({ createdAt: new Date() });

    await genericDeleteRepository.findModelCreatedAt({ model: "Task", id: 6 });

    expect(db.task.findUnique).toHaveBeenCalledWith({
      where: { id: 6 },
      select: { createdAt: true },
    });
  });

  it.each(["0", "-1", "abc", "1.5"])(
    "rejects invalid id %s as a validation error",
    (id) => {
      expect(genericDeleteSchemas.idParam.safeParse({ id }).success).toBe(false);
    },
  );

  it("wires the positive-id validator into the route and yields 422", () => {
    const routeLayer = genericDeleteRouter.stack.find((layer) => layer.route);
    const idValidation = routeLayer.route.stack[1].handle;
    const next = vi.fn();

    idValidation({ params: { id: "abc" } }, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 422, code: "VALIDATION_ERROR" }),
    );
  });
});

describe("generic delete transactional teardown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("frees a meeting slot and deletes the reminder in one transaction", async () => {
    const meeting = {
      availableSlotId: 14,
      googleEventId: "google-1",
      userId: 3,
      adminId: null,
    };
    db.meetingReminder.findUnique.mockResolvedValue(meeting);
    db.availableSlot.update.mockResolvedValue({});
    db.meetingReminder.delete.mockResolvedValue({ id: 7 });

    await expect(
      genericDeleteRepository.deleteMeetingReminderWithCleanup({ id: 7 }),
    ).resolves.toEqual(meeting);

    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(db.availableSlot.update).toHaveBeenCalledWith({
      where: { id: 14 },
      data: { isBooked: false, meetingReminderId: null },
    });
    expect(db.meetingReminder.delete).toHaveBeenCalledWith({ where: { id: 7 } });
  });

  it("keeps projects while tearing a contract down in its existing transaction", async () => {
    await genericDeleteRepository.deleteContractWithDependents({ id: 21 });

    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Array));
    expect(db.project.updateMany).toHaveBeenCalledWith({
      where: { contractId: 21 },
      data: { contractId: null },
    });
    expect(db.contract.delete).toHaveBeenCalledWith({ where: { id: 21 } });
  });

  it("tears a client update and its scoped children down transactionally", async () => {
    db.sharedUpdate.findMany.mockResolvedValue([{ id: 31 }, { id: 32 }]);
    db.clientLeadUpdate.delete.mockResolvedValue({ id: 12 });

    await genericDeleteRepository.deleteClientLeadUpdateWithDependents({ id: 12 });

    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(db.note.deleteMany).toHaveBeenNthCalledWith(1, {
      where: { updateId: 12 },
    });
    expect(db.note.deleteMany).toHaveBeenNthCalledWith(2, {
      where: { sharedUpdateId: { in: [31, 32] } },
    });
    expect(db.sharedUpdate.deleteMany).toHaveBeenCalledWith({
      where: { updateId: 12 },
    });
    expect(db.clientLeadUpdate.delete).toHaveBeenCalledWith({ where: { id: 12 } });
  });
});

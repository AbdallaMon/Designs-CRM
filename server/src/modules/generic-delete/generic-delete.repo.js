// Generic-delete Prisma I/O. Client model names resolve through an explicit server-owned
// delegate map; scope, time windows, and side-effect sequencing stay in the usecase.
import prisma from "../../infra/prisma/prisma.js";
import { getGenericDeleteDefinition } from "./generic-delete.config.js";

const PRISMA_DELEGATES = Object.freeze({
  note: (client) => client.note,
  file: (client) => client.file,
  priceOffers: (client) => client.priceOffers,
  extraService: (client) => client.extraService,
  meetingReminder: (client) => client.meetingReminder,
  callReminder: (client) => client.callReminder,
  clientLeadUpdate: (client) => client.clientLeadUpdate,
  deliverySchedule: (client) => client.deliverySchedule,
  contract: (client) => client.contract,
  contractPaymentCondition: (client) => client.contractPaymentCondition,
  task: (client) => client.task,
});

function resolveDelegate({ model, client = prisma }) {
  const definition = getGenericDeleteDefinition(model);
  const resolve = definition && PRISMA_DELEGATES[definition.delegate];
  return resolve ? resolve(client) : null;
}

class GenericDeleteRepository {
  async resolveTarget({ model, id }) {
    const targetId = Number(id);
    const definition = getGenericDeleteDefinition(model);
    const delegate = resolveDelegate({ model });
    if (!definition || !delegate || definition.scope === "note") return null;

    if (definition.scope === "lead") {
      const row = await delegate.findUnique({
        where: { id: targetId },
        select: { clientLeadId: true },
      });
      return row && { kind: "lead", clientLeadId: row.clientLeadId };
    }
    if (definition.scope === "project") {
      const row = await delegate.findUnique({
        where: { id: targetId },
        select: { projectId: true },
      });
      return row && { kind: "project", projectId: row.projectId };
    }

    const row = await delegate.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    return row && { kind: "site-utility" };
  }

  // createdAt supports the delete-window guard.
  findModelCreatedAt({ model, id }) {
    const delegate = resolveDelegate({ model });
    if (!delegate) return null;
    return delegate.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        createdAt: true,
      },
    });
  }

  deleteModel({ model, id }) {
    const delegate = resolveDelegate({ model });
    if (!delegate) return null;
    return delegate.delete({
      where: {
        id: Number(id),
      },
    });
  }

  // Slot cleanup and MeetingReminder deletion are one database transaction. Google
  // Calendar deletion is intentionally not here; the usecase performs it post-commit.
  deleteMeetingReminderWithCleanup({ id }) {
    const meetingId = Number(id);
    return prisma.$transaction(async (tx) => {
      const meeting = await tx.meetingReminder.findUnique({
        where: { id: meetingId },
        select: {
          availableSlotId: true,
          googleEventId: true,
          userId: true,
          adminId: true,
        },
      });
      if (!meeting) return null;

      if (meeting.availableSlotId) {
        await tx.availableSlot.update({
          where: { id: meeting.availableSlotId },
          data: {
            isBooked: false,
            meetingReminderId: null,
          },
        });
      }
      await tx.meetingReminder.delete({ where: { id: meetingId } });
      return meeting;
    });
  }

  // Contract delete needs an explicit, FK-ordered teardown: several tables reference a
  // Contract (or its stages) with RESTRICT foreign keys, so a plain delete is rejected
  // (P2003). Per product decision "keep projects only": projects survive (contractId
  // nulled), delivery schedules survive (their stage link nulled), and the contract's own
  // scoped data (notes, payments, stages, drawings, special items) is removed with it.
  // Ordered inside a single transaction so RESTRICT FKs are satisfied at every step:
  // payments before stages (payment.stageId → stage is RESTRICT); schedules unlinked from
  // stages before stages are deleted (schedule.stageId → stage is RESTRICT).
  async deleteContractWithDependents({ id }) {
    const contractId = Number(id);
    return prisma.$transaction([
      prisma.project.updateMany({
        where: { contractId },
        data: { contractId: null },
      }),
      prisma.deliverySchedule.updateMany({
        where: { stage: { contractId } },
        data: { stageId: null },
      }),
      prisma.note.deleteMany({ where: { contractId } }),
      prisma.contractPayment.deleteMany({ where: { contractId } }),
      prisma.contractDrawing.deleteMany({ where: { contractId } }),
      prisma.contractSpecialItem.deleteMany({ where: { contractId } }),
      prisma.contractStage.deleteMany({ where: { contractId } }),
      prisma.contract.delete({ where: { id: contractId } }),
    ]);
  }

  // A ClientLeadUpdate is referenced by SharedUpdate (required FK, RESTRICT) and by Note
  // (updateId, RESTRICT); Notes can also hang off those SharedUpdates (sharedUpdateId,
  // RESTRICT). A plain delete is therefore rejected (P2003). Tear the update's own scoped
  // children down in FK-safe order inside one transaction: notes on the update and notes on
  // its shared-updates first, then the shared-updates, then the update itself. Scope is the
  // update's own sub-tree only — the server decides the cascade (the client cannot).
  async deleteClientLeadUpdateWithDependents({ id }) {
    const updateId = Number(id);
    return prisma.$transaction(async (tx) => {
      const sharedUpdates = await tx.sharedUpdate.findMany({
        where: { updateId },
        select: { id: true },
      });
      const sharedUpdateIds = sharedUpdates.map((sharedUpdate) => sharedUpdate.id);
      await tx.note.deleteMany({ where: { updateId } });
      await tx.note.deleteMany({
        where: { sharedUpdateId: { in: sharedUpdateIds } },
      });
      await tx.sharedUpdate.deleteMany({ where: { updateId } });
      return tx.clientLeadUpdate.delete({ where: { id: updateId } });
    });
  }
}

export const genericDeleteRepository = new GenericDeleteRepository();
export { GenericDeleteRepository };

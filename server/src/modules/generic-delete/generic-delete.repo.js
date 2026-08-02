// Generic-delete Prisma I/O. The caller resolves an allow-listed Prisma delegate name;
// scope, time windows, cleanup orchestration, and sequencing stay in the usecase.
import prisma from "../../infra/prisma/prisma.js";

class GenericDeleteRepository {
  async resolveTarget({ model, id }) {
    const targetId = Number(id);
    switch (model) {
      case "File":
        return prisma.file.findUnique({
          where: { id: targetId },
          select: { clientLeadId: true },
        }).then((row) => row && ({ kind: "lead", clientLeadId: row.clientLeadId }));
      case "PriceOffers":
        return prisma.priceOffers.findUnique({
          where: { id: targetId },
          select: { clientLeadId: true },
        }).then((row) => row && ({ kind: "lead", clientLeadId: row.clientLeadId }));
      case "ExtraService":
        return prisma.extraService.findUnique({
          where: { id: targetId },
          select: { clientLeadId: true },
        }).then((row) => row && ({ kind: "lead", clientLeadId: row.clientLeadId }));
      case "MeetingReminder":
        return prisma.meetingReminder.findUnique({
          where: { id: targetId },
          select: { clientLeadId: true },
        }).then((row) => row && ({ kind: "lead", clientLeadId: row.clientLeadId }));
      case "CallReminder":
        return prisma.callReminder.findUnique({
          where: { id: targetId },
          select: { clientLeadId: true },
        }).then((row) => row && ({ kind: "lead", clientLeadId: row.clientLeadId }));
      case "ClientLeadUpdate":
        return prisma.clientLeadUpdate.findUnique({
          where: { id: targetId },
          select: { clientLeadId: true },
        }).then((row) => row && ({ kind: "lead", clientLeadId: row.clientLeadId }));
      case "DeliverySchedule":
        return prisma.deliverySchedule.findUnique({
          where: { id: targetId },
          select: { projectId: true },
        }).then((row) => row && ({ kind: "project", projectId: row.projectId }));
      case "contract":
        return prisma.contract.findUnique({
          where: { id: targetId },
          select: { clientLeadId: true },
        }).then((row) => row && ({ kind: "lead", clientLeadId: row.clientLeadId }));
      case "contractPaymentCondition":
        return prisma.contractPaymentCondition.findUnique({
          where: { id: targetId },
          select: { id: true },
        }).then((row) => row && ({ kind: "site-utility" }));
      default:
        return null;
    }
  }

  // createdAt supports the delete-window guard.
  findModelCreatedAt({ model, id }) {
    return prisma[model].findUnique({
      where: {
        id: Number(id),
      },
      select: {
        createdAt: true,
      },
    });
  }

  // MeetingReminder detail for calendar cleanup.
  findMeetingReminder({ id }) {
    return prisma.meetingReminder.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        availableSlotId: true,
        googleEventId: true,
        userId: true,
        adminId: true,
      },
    });
  }

  // Free the booked slot when a MeetingReminder is deleted.
  freeAvailableSlot({ availableSlotId }) {
    return prisma.availableSlot.update({
      where: {
        id: availableSlotId,
      },
      data: {
        isBooked: false,
        meetingReminderId: null,
      },
    });
  }

  deleteModel({ model, id }) {
    return prisma[model].delete({
      where: {
        id: Number(id),
      },
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
    const sharedUpdates = await prisma.sharedUpdate.findMany({
      where: { updateId },
      select: { id: true },
    });
    const sharedUpdateIds = sharedUpdates.map((s) => s.id);
    return prisma.$transaction([
      prisma.note.deleteMany({ where: { updateId } }),
      prisma.note.deleteMany({ where: { sharedUpdateId: { in: sharedUpdateIds } } }),
      prisma.sharedUpdate.deleteMany({ where: { updateId } }),
      prisma.clientLeadUpdate.delete({ where: { id: updateId } }),
    ]);
  }
}

export const genericDeleteRepository = new GenericDeleteRepository();
export { GenericDeleteRepository };

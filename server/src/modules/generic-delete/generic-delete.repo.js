// generic-delete repository — Prisma I/O ONLY (no business rules, no side effects). Relocated
// verbatim from the legacy `shared/legacy/note-services.js` `deleteAModel` Prisma calls. The
// model name is an allow-listed Prisma delegate name resolved by the caller; the time-window
// guards, the MeetingReminder calendar cleanup orchestration, and the delete sequencing stay
// in the usecase. Behavior-preserving: every query object is copied verbatim.
import prisma from "../../infra/prisma/prisma.js";

class GenericDeleteRepository {
  // createdAt of the target row (legacy deleteAModel guard read).
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

  // Pre-main cascade delete for one spec entry (legacy deleteModelesBeforeMain loop).
  deleteManyBySpec({ name, where }) {
    return prisma[name].deleteMany({ where });
  }

  // MeetingReminder detail (legacy MeetingReminder calendar-cleanup branch).
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

  // Free the booked slot when a MeetingReminder is deleted (legacy branch).
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

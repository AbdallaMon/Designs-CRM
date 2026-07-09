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
}

export const genericDeleteRepository = new GenericDeleteRepository();
export { GenericDeleteRepository };

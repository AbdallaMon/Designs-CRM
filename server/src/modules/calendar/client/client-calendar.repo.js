// calendar/client repository — Prisma I/O ONLY for the PUBLIC client booking surface. The
// booking orchestration + side effects (notification / mail / Google sync) live in
// client-calendar.usecase.js; the token→context shaping lives in calendar.dto.js. Every raw
// read/write those need is a thin method here, ported verbatim from the legacy
// client-calendar-service.js.
import prisma from "../../../infra/prisma/prisma.js";

class ReminderAlreadyReservedError extends Error {}

class ClientCalendarRepository {
  model = prisma.meetingReminder;

  // verifySlotIsAvailableAndNotBooked read (guard applied by the usecase).
  findSlotById(slotId) {
    return prisma.availableSlot.findUnique({
      where: { id: Number(slotId) },
      include: {
        availableDay: {
          select: { userId: true, date: true },
        },
      },
    });
  }

  // verifyAndExtractCalendarToken read — the booking-relevant fields only (no secrets).
  findReminderByToken(token) {
    return prisma.meetingReminder.findUnique({
      where: { token },
      select: {
        id: true,
        userId: true,
        clientLeadId: true,
        adminId: true,
        time: true,
        userTimezone: true,
        availableSlot: {
          select: {
            startTime: true,
            endTime: true,
            userTimezone: true,
          },
        },
      },
    });
  }

  async reserveSlotAndUpdateReminder({
    slotId,
    meetingReminderId,
    expectedOwnerId,
    requestedDateStart,
    requestedDateEnd,
    userTimezone,
  }) {
    try {
      return await prisma.$transaction(async (tx) => {
        const slot = await tx.availableSlot.findFirst({
          where: {
            id: Number(slotId),
            startTime: { gte: requestedDateStart, lt: requestedDateEnd },
            availableDay: {
              userId: Number(expectedOwnerId),
              date: { gte: requestedDateStart, lt: requestedDateEnd },
            },
          },
        });

        if (!slot) return { outcome: "not-found" };

        const slotClaim = await tx.availableSlot.updateMany({
          where: {
            id: slot.id,
            isBooked: false,
            meetingReminderId: null,
          },
          data: {
            isBooked: true,
            meetingReminderId: Number(meetingReminderId),
            userTimezone,
          },
        });
        if (slotClaim.count !== 1) return { outcome: "already-booked" };

        const reminderClaim = await tx.meetingReminder.updateMany({
          where: {
            id: Number(meetingReminderId),
            availableSlotId: null,
          },
          data: {
            availableSlotId: slot.id,
            time: slot.startTime,
            userTimezone,
          },
        });
        if (reminderClaim.count !== 1) throw new ReminderAlreadyReservedError();

        const reminder = await tx.meetingReminder.findUnique({
          where: { id: Number(meetingReminderId) },
          include: {
            clientLead: {
              select: {
                client: { select: { name: true, email: true } },
              },
            },
          },
        });

        return { outcome: "booked", reminder, slot };
      });
    } catch (error) {
      if (error instanceof ReminderAlreadyReservedError) {
        return { outcome: "already-booked" };
      }
      throw error;
    }
  }
}

export const clientCalendarRepository = new ClientCalendarRepository();
export { ClientCalendarRepository };

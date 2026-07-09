// calendar/client repository — Prisma I/O ONLY for the PUBLIC client booking surface. The
// booking orchestration + side effects (notification / mail / Google sync) live in
// client-calendar.usecase.js; the token→context shaping lives in calendar.dto.js. Every raw
// read/write those need is a thin method here, ported verbatim from the legacy
// client-calendar-service.js.
import prisma from "../../../infra/prisma/prisma.js";

class ClientCalendarRepository {
  model = prisma.meetingReminder;

  // verifySlotIsAvailableAndNotBooked read (guard applied by the usecase).
  findSlotById(slotId) {
    return prisma.availableSlot.findUnique({
      where: { id: Number(slotId) },
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

  // updateMeetingReminderTime — Prisma-only (verbatim): read (unused), update, refetch.
  async updateMeetingReminderTime({ reminderId, time, userTimezone }) {
    reminderId = Number(reminderId);
    const reminder = await prisma.meetingReminder.findUnique({
      where: { id: reminderId },
    });

    const updatedReminder = await prisma.meetingReminder.update({
      where: { id: reminderId },
      data: { time, userTimezone },
    });

    return await prisma.meetingReminder.findUnique({
      where: { id: updatedReminder.id },
    });
  }

  // bookAMeeting notification/email context read.
  findReminderForBooking(reminderId) {
    return prisma.meetingReminder.findUnique({
      where: {
        id: Number(reminderId),
      },
      select: {
        userTimezone: true,
        id: true,
        time: true,
        clientLead: {
          select: {
            client: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  // assignSlotToMeeting reads/writes.
  findSlotForAssign(slotId) {
    return prisma.availableSlot.findUnique({
      where: { id: Number(slotId) },
    });
  }

  assignSlotToReminder({ meetingReminderId, slotId }) {
    return prisma.meetingReminder.update({
      where: { id: Number(meetingReminderId) },
      data: { availableSlotId: Number(slotId) },
    });
  }

  markSlotBooked({ slotId, meetingReminderId, userTimezone }) {
    return prisma.availableSlot.update({
      where: { id: Number(slotId) },
      data: { isBooked: true, meetingReminderId, userTimezone },
    });
  }
}

export const clientCalendarRepository = new ClientCalendarRepository();
export { ClientCalendarRepository };

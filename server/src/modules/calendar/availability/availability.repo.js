// calendar/availability repository — Prisma I/O ONLY (no business rules, no tz math, no
// AppError). The availability/slot generation + month-view + reminders LOGIC (timezone math,
// mapping, guards, orchestration) lives in the usecases (availability.usecase.js +
// month-view.usecase.js); every raw Prisma read/write those usecases need is a thin method
// here. Ported verbatim from the legacy calendar services — same selects/wheres/orderings.
//
// NOTE on the legacy DELETE /days/:id behavior preserved 1:1: the mounted route first deletes
// the day's slots (deleteMany by availableDayId) and then the day itself — it does NOT guard
// against booked slots (unlike the richer service-level `deleteADay`). `deleteDayWithSlots`
// reproduces that no-guard two-step delete; `deleteADay` (usecase) keeps the guarded variant.
import prisma from "../../../infra/prisma/prisma.js";

class AvailabilityRepository {
  model = prisma.availableDay;

  // ── available days ────────────────────────────────────────────────────────
  // getAvailableDays read (where + CLIENT slot filter built by the usecase).
  async findAvailableDays(where) {
    return prisma.availableDay.findMany({
      where,
      select: {
        id: true,
        date: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        slots: {
          select: {
            isBooked: true,
            meetingReminderId: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });
  }

  // createAvailableDay existence check (Date value) — includes slots for the booked guard.
  async findDayByUserDate({ userId, date }) {
    return prisma.availableDay.findUnique({
      where: { userId_date: { userId, date } },
      include: { slots: true },
    });
  }

  // createAvailableDatesForMoreThanOneDay existence check — legacy passed a dayjs value
  // (localMidnight) directly and did NOT include slots. Kept verbatim (distinct from above).
  async findDayByUserDateRaw({ userId, date }) {
    return prisma.availableDay.findUnique({
      where: { userId_date: { userId, date } },
    });
  }

  // updateAvailableDay existence read — includes slots for the meeting-reminder guard.
  async findDayByIdWithSlots(dayId) {
    return prisma.availableDay.findUnique({
      where: { id: dayId },
      include: { slots: true },
    });
  }

  async createDay({ userId, date }) {
    return prisma.availableDay.create({
      data: {
        userId,
        date: date,
      },
    });
  }

  async createSlots(slots) {
    return prisma.availableSlot.createMany({
      data: slots,
    });
  }

  async deleteSlotsByDayId(availableDayId) {
    return prisma.availableSlot.deleteMany({
      where: { availableDayId },
    });
  }

  async deleteDayById(id) {
    return prisma.availableDay.delete({
      where: { id },
    });
  }

  // ── slots for a day ───────────────────────────────────────────────────────
  async findDayById(dayId) {
    return prisma.availableDay.findUnique({
      where: { id: Number(dayId) },
    });
  }

  async findFirstDayByDateRange({ startDate, endDate, adminId }) {
    return prisma.availableDay.findFirst({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        userId: Number(adminId),
      },
    });
  }

  async findSlots(where) {
    return prisma.availableSlot.findMany({ where });
  }

  async findSlotsForDayOrdered({ availableDayId, slotWhere }) {
    return prisma.availableSlot.findMany({
      where: {
        availableDayId,
        ...slotWhere,
      },
      orderBy: { startTime: "asc" },
    });
  }

  // ── slot / day deletes (guarded service variants) ─────────────────────────
  async findSlotById(slotId) {
    return prisma.availableSlot.findUnique({
      where: { id: Number(slotId) },
    });
  }

  // deleteASlot — hard delete returning the deleted row (service variant; guarded by usecase).
  async deleteSlotByIdReturning(slotId) {
    return prisma.availableSlot.delete({
      where: { id: Number(slotId) },
    });
  }

  // deleteADay booked-slot guard read.
  async findFirstBookedSlot(dayId) {
    return prisma.availableSlot.findFirst({
      where: {
        availableDayId: Number(dayId),
        isBooked: true,
      },
    });
  }

  // Legacy DELETE /days/:id — delete the day's slots, then the day. No booked-slot guard
  // (matching the legacy route handler, not the service-level deleteADay).
  async deleteDayWithSlots({ dayId }) {
    const id = Number(dayId);
    await prisma.availableSlot.deleteMany({ where: { availableDayId: id } });
    await prisma.availableDay.delete({ where: { id } });
    return true;
  }

  // Legacy DELETE /slots/:id — hard delete a single slot by id (no guard, matching legacy).
  async deleteSlot({ slotId }) {
    await prisma.availableSlot.delete({ where: { id: Number(slotId) } });
    return true;
  }

  // ── custom date (addCutsomDate) ───────────────────────────────────────────
  async findDayDate(dayId) {
    return prisma.availableDay.findUnique({
      where: { id: dayId },
      select: { date: true },
    });
  }

  async findOverlappingSlots({ dayId, startTimeUtc, endTimeUtc }) {
    return prisma.availableSlot.findMany({
      where: {
        availableDayId: dayId,
        OR: [
          {
            startTime: { lt: endTimeUtc },
            endTime: { gt: startTimeUtc },
          },
        ],
      },
    });
  }

  async createCustomSlot({ dayId, startTimeUtc, endTimeUtc }) {
    return prisma.availableSlot.create({
      data: {
        availableDayId: dayId,
        startTime: startTimeUtc,
        endTime: endTimeUtc,
      },
    });
  }

  // ── month view (getCalendarDataForMonth) ──────────────────────────────────
  async findMonthMeetings(where) {
    return prisma.meetingReminder.findMany({
      where,
      select: {
        id: true,
        time: true,
        status: true,
      },
      orderBy: {
        time: "asc",
      },
    });
  }

  async findMonthCalls(where) {
    return prisma.callReminder.findMany({
      where,
      select: {
        id: true,
        time: true,
        status: true,
      },
      orderBy: {
        time: "asc",
      },
    });
  }

  // ── reminders for a day (getRemindersForDay) ──────────────────────────────
  async findDayMeetings(where) {
    return prisma.meetingReminder.findMany({
      where,
      orderBy: { time: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clientLead: {
          select: {
            id: true,
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  async findDayCalls(where) {
    return prisma.callReminder.findMany({
      where,
      orderBy: { time: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clientLead: {
          select: {
            id: true,
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }
}

export const availabilityRepository = new AvailabilityRepository();
export { AvailabilityRepository };

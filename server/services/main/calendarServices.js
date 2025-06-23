import { addMinutes, isBefore } from "date-fns";
import prisma from "../../prisma/prisma.js";
import { verifyToken } from "./utility.js";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(utc);

export async function getAvailableDays({ month, userId }) {
  const start = dayjs(month).utc().startOf("month");
  const end = dayjs(month).utc().endOf("month");

  if (!userId) {
    const mockDays = [];
    for (let i = 0; i <= end.date() - 1; i++) {
      const date = start.add(i, "day").toDate();
      mockDays.push({
        id: `mock-${i}`,
        date,
        createdAt: date,
        slots: [],
        fullyBooked: false,
      });
    }
    return mockDays;
  }

  const availableDays = await prisma.availableDay.findMany({
    where: {
      userId: Number(userId),
      date: {
        gte: start.toDate(),
        lte: end.toDate(),
      },
    },
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
        },
      },
    },
    orderBy: { date: "asc" },
  });

  return availableDays.map((day) => {
    const fullyBooked = day.slots?.every(
      (d) => d.isBooked && d.meetingReminderId
    );
    return { ...day, fullyBooked };
  });
}

export async function createAvailableDatesForMoreThanOneDay({
  userId,
  days,
  fromHour,
  toHour,
  duration,
  breakMinutes,
}) {
  userId = Number(userId);
  days.forEach(async (day) => {
    const existing = await prisma.availableDay.findUnique({
      where: { userId_date: { userId, date: new Date(day) } },
    });
    if (existing)
      await updateAvailableDay({
        dayId: existing.id,
        date: day,
        fromHour,
        toHour,
        duration,
        breakMinutes,
      });
    else
      await createAvailableDay({
        userId,
        date: day,
        fromHour,
        toHour,
        duration,
        breakMinutes,
      });
  });
  return true;
}
export async function createAvailableDay({
  userId,
  date,
  fromHour,
  toHour,
  duration,
  breakMinutes,
}) {
  userId = Number(userId);
  const existing = await prisma.availableDay.findUnique({
    where: { userId_date: { userId, date: new Date(date) } },
  });
  if (existing) throw new Error("Day already exists");

  const day = await prisma.availableDay.create({
    data: {
      userId,
      date: new Date(date),
    },
  });
  await createSlotsForDay({
    date,
    fromHour,
    toHour,
    duration,
    breakMinutes,
    day,
  });
  return true;
}
async function createSlotsForDay({
  date,
  fromHour,
  toHour,
  duration,
  breakMinutes,
  day,
}) {
  const baseDateStr = dayjs(date).format("YYYY-MM-DD"); // '2025-06-22'
  const fromTimeStr = `${baseDateStr} ${fromHour}`; // '2025-06-22 09:00'
  const toTimeStr = `${baseDateStr} ${toHour}`; // '2025-06-22 20:00'

  const from = dayjs.tz(fromTimeStr, "Asia/Dubai").utc().toDate();
  const to = dayjs.tz(toTimeStr, "Asia/Dubai").utc().toDate();

  let current = new Date(from);
  const slots = [];
  while (isBefore(addMinutes(current, duration), to)) {
    const end = addMinutes(current, duration);
    slots.push({
      startTime: current,
      endTime: end,
      availableDayId: day.id,
    });
    current = addMinutes(end, breakMinutes);
  }
  await prisma.availableSlot.createMany({
    data: slots,
  });
}
export async function updateAvailableDay({
  dayId,
  date,
  fromHour,
  toHour,
  duration,
  breakMinutes,
}) {
  dayId = Number(dayId);
  const existingDay = await prisma.availableDay.findUnique({
    where: { id: dayId },
    include: { slots: true },
  });
  if (existingDay.slots.some((s) => s.meetingReminderId !== null)) {
    throw new Error("Cannot update date: related meetings exist");
  }

  await prisma.availableSlot.deleteMany({
    where: {
      availableDayId: existingDay.id,
    },
  });

  await createSlotsForDay({
    date,
    fromHour,
    toHour,
    duration,
    breakMinutes,
    day: existingDay,
  });

  return true;
}

export async function getAvailableSlotsForDay({ date, userId, dayId }) {
  if (!userId) {
    const mockDate = new Date(); // or use the actual date of dayId if you can extract it
    mockDate.setUTCHours(8, 0, 0, 0);
    const slots = [];
    let current = new Date(mockDate);

    while (
      isBefore(
        addMinutes(current, 60),
        new Date(mockDate.getTime() + 12 * 60 * 60 * 1000)
      )
    ) {
      const end = addMinutes(current, 60);
      slots.push({
        id: `mock-${current.toISOString()}`,
        startTime: current,
        endTime: end,
        isBooked: false,
        meetingReminderId: null,
      });
      current = addMinutes(end, 15);
    }

    return slots;
  }
  const startOfDay = dayjs(date).utc().startOf("day").toDate();
  const endOfDay = dayjs(date).utc().endOf("day").toDate();
  const day = dayId
    ? await prisma.availableDay.findUnique({
        where: {
          id: Number(dayId),
        },
      })
    : await prisma.availableDay.findFirst({
        where: {
          date: {
            gte: new Date(startOfDay),
            lte: new Date(endOfDay),
          },
          userId: Number(userId),
        },
      });
  if (!day) {
    return []; // No available day found for the given date
  }
  return await prisma.availableSlot.findMany({
    where: {
      availableDayId: day.id,
    },
    orderBy: { startTime: "asc" },
  });
}

export async function assignSlotToMeeting({ slotId, meetingReminderId }) {
  slotId = Number(slotId);
  meetingReminderId = Number(meetingReminderId);

  const slot = await prisma.availableSlot.findUnique({
    where: { id: slotId },
  });

  if (!slot || slot.isBooked)
    throw new Error("Day already booked book another");

  await prisma.meetingReminder.update({
    where: { id: meetingReminderId },
    data: { availableSlotId: slotId },
  });

  return await prisma.availableSlot.update({
    where: { id: slotId },
    data: { isBooked: true, meetingReminderId },
  });
}

export async function deleteASlot({ slotId }) {
  slotId = Number(slotId);
  const slot = await prisma.availableSlot.findUnique({
    where: { id: slotId },
  });

  if (!slot) throw new Error("Slot not found");

  if (slot.isBooked) {
    throw new Error("Cannot delete a booked slot");
  }

  return await prisma.availableSlot.delete({
    where: { id: slotId },
  });
}
export async function verifyAndExtractCalendarToken(token) {
  return true;
  if (!token) throw new Error("No token provided");

  // Assuming a function to verify the token and extract userId
  const tokenData = await verifyToken(token);

  return {
    reminderId: tokenData.reminderId,
    userId: tokenData.userId,
    clientLeadId: tokenData.clientLeadId,
    adminId: tokenData.adminId,
  };
}

export async function addCutsomDate({ fromHour, toHour, dayId }) {
  dayId = Number(dayId);
  if (!fromHour || !toHour || !dayId) {
    throw new Error("fromHour, toHour, and dayId are required");
  }

  const availableDay = await prisma.availableDay.findUnique({
    where: { id: dayId },
    select: { date: true },
  });
  if (!availableDay) {
    throw new Error("Available day not found");
  }
  const dateStr = dayjs(availableDay.date).format("YYYY-MM-DD");
  const tz = "Asia/Dubai";
  const startTimeUtc = dayjs
    .tz(`${dateStr} ${fromHour}`, "YYYY-MM-DD HH:mm", tz)
    .utc()
    .toDate();
  const endTimeUtc = dayjs
    .tz(`${dateStr} ${toHour}`, "YYYY-MM-DD HH:mm", tz)
    .utc()
    .toDate();

  const overlappingSlots = await prisma.availableSlot.findMany({
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
  console.log(overlappingSlots, "overlappingSlots");
  if (overlappingSlots.length > 0) {
    throw new Error("This time slot conflicts with an existing one.");
  }

  await prisma.availableSlot.create({
    data: {
      availableDayId: dayId,
      startTime: startTimeUtc,
      endTime: endTimeUtc,
    },
  });
}

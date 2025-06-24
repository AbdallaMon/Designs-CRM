import { addMinutes, endOfDay, isBefore, startOfDay } from "date-fns";
import prisma from "../../prisma/prisma.js";
import { verifyToken } from "./utility.js";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { newCallNotification } from "../notification.js";

dayjs.extend(utc);
dayjs.extend(utc);

export async function getAvailableDays({ month, adminId, role = true }) {
  const start = dayjs(month).utc().startOf("month");
  const end = dayjs(month).utc().endOf("month");
  if (!role && !adminId) {
    throw new Error("AdminId is required");
  }

  if (!adminId && role) {
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
      userId: Number(adminId),
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

export async function getAvailableSlotsForDay({
  date,
  adminId,
  dayId,
  role = true,
}) {
  if (!role && !adminId) {
    throw new Error("AdminId is required");
  }
  if (!adminId && role) {
    const now = dayjs(); // or specific date if needed
    const mockDate = dayjs
      .tz(`${now.format("YYYY-MM-DD")} 08:00`, "Asia/Dubai")
      .utc()
      .toDate();
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
        type: "MOCK",
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
          userId: Number(adminId),
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
  if (!token) throw new Error("No token provided");

  const tokenData = await prisma.meetingReminder.findUnique({
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
  const returnData = {
    reminderId: tokenData.id,
    userId: tokenData.userId,
    clientLeadId: tokenData.clientLeadId,
    adminId: tokenData.adminId,
    ...tokenData,
  };
  if (tokenData.availableSlot) {
    returnData.selectedSlot = tokenData.availableSlot;
    if (tokenData.availableSlot.userTimezone) {
      returnData.selectedTimezone = tokenData.availableSlot.userTimezone;
    }
  }
  if (tokenData.time) {
    returnData.selectedDate = dayjs(tokenData.time).utc().toDate();
  }
  if (tokenData.userTimezone) {
    returnData.selectedTimezone = tokenData.userTimezone;
  }
  return returnData;
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

export async function bookAMeeting({
  reminderId,
  clientLeadId,
  clientName,
  selectedSlot,
  selectedTimezone = "Asia/Dubai",
}) {
  const time = selectedSlot.startTime;
  const reminder = await updateMeetingReminderTime({
    reminderId,
    time,
    userTimezone: selectedTimezone,
  });
  if (selectedSlot.type !== "MOCK") {
    await assignSlotToMeeting({
      slotId: selectedSlot.id,
      meetingReminderId: reminderId,
      userTimezone: selectedTimezone,
    });
  }
  const lead = await prisma.clientLead.findUnique({
    where: { id: Number(clientLeadId) },
    select: {
      client: {
        select: {
          id: true,
        },
      },
    },
  });
  const updateClientEmail = await prisma.client.update({
    where: { id: lead.client.id },
    data: { email: clientName },
  });

  await newCallNotification(Number(clientLeadId), reminder);

  return true;
}

export async function updateMeetingReminderTime({
  reminderId,
  time,
  userTimezone,
}) {
  reminderId = Number(reminderId);
  const reminder = await prisma.meetingReminder.findUnique({
    where: { id: reminderId },
  });

  const updatedReminder = await prisma.meetingReminder.update({
    where: { id: reminderId },
    data: { time, userTimezone },
  });

  return updatedReminder;
}
export async function assignSlotToMeeting({
  slotId,
  meetingReminderId,
  userTimezone,
}) {
  slotId = Number(slotId);
  meetingReminderId = Number(meetingReminderId);

  const slot = await prisma.availableSlot.findUnique({
    where: { id: slotId },
  });

  if (!slot || slot.isBooked)
    throw new Error("Time already booked book another");

  await prisma.meetingReminder.update({
    where: { id: meetingReminderId },
    data: { availableSlotId: slotId },
  });

  return await prisma.availableSlot.update({
    where: { id: slotId },
    data: { isBooked: true, meetingReminderId, userTimezone },
  });
}

export async function getCalendarDataForMonth({
  year,
  month,
  adminId = null,
  userId = null,
}) {
  console.log(adminId, "adminId");
  console.log(userId, "userId");
  try {
    const timezone = "UTC";
    // Create start and end dates using dayjs with timezone
    const startOfMonth = dayjs.tz(
      `${year}-${month.toString().padStart(2, "0")}-01`,
      timezone
    );
    const endOfMonth = startOfMonth.endOf("month");

    // Convert to UTC for database queries
    const startDate = startOfMonth.utc().toDate();
    const endDate = endOfMonth.utc().toDate();

    // Build where clauses
    const meetingWhere = {
      time: {
        gte: startDate,
        lte: endDate,
      },
      ...(userId && {
        clientLead: {
          userId: Number(userId),
        },
      }),
    };

    const callWhere = {
      time: {
        gte: startDate,
        lte: endDate,
      },
      ...(userId && {
        clientLead: {
          userId: Number(userId),
        },
      }),
    };

    if (adminId) {
      meetingWhere.OR = [
        { adminId: Number(adminId) },
        { userId: Number(userId) },
      ];

      callWhere.userId = Number(adminId);
    }
    // Fetch meetings and calls
    const [meetings, calls] = await Promise.all([
      prisma.meetingReminder.findMany({
        where: meetingWhere,
        select: {
          id: true,
          time: true,
          status: true,
        },
        orderBy: {
          time: "asc",
        },
      }),
      prisma.callReminder.findMany({
        where: callWhere,
        select: {
          id: true,
          time: true,
          status: true,
        },
        orderBy: {
          time: "asc",
        },
      }),
    ]);

    // Group activities by day
    const calendarData = {};

    // Process meetings
    meetings.forEach((meeting) => {
      const meetingTime = dayjs(meeting.time).tz(timezone);
      const dayKey = meetingTime.format("YYYY-MM-DD");

      if (!calendarData[dayKey]) {
        calendarData[dayKey] = {
          date: dayKey,
          meetings: [],
          calls: [],
        };
      }

      calendarData[dayKey].meetings.push({
        ...meeting,
        time: meetingTime.toISOString(), // Return in ISO format
        formattedTime: meetingTime.format("HH:mm"), // Formatted time for display
      });
    });

    // Process calls
    calls.forEach((call) => {
      const callTime = dayjs(call.time).tz(timezone);
      const dayKey = callTime.format("YYYY-MM-DD");

      if (!calendarData[dayKey]) {
        calendarData[dayKey] = {
          date: dayKey,
          meetings: [],
          calls: [],
        };
      }

      calendarData[dayKey].calls.push({
        ...call,
        time: callTime.toISOString(), // Return in ISO format
        formattedTime: callTime.format("HH:mm"), // Formatted time for display
      });
    });

    // Fill in empty days for the month (optional - frontend can handle this)
    const daysInMonth = endOfMonth.date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = startOfMonth.date(day).format("YYYY-MM-DD");
      if (!calendarData[dayKey]) {
        calendarData[dayKey] = {
          date: dayKey,
          meetings: [],
          calls: [],
        };
      }
    }

    return calendarData;
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    throw new Error("Failed to fetch calendar data");
  }
}
export async function getRemindersForDay({ date, userId, adminId }) {
  const dayStart = startOfDay(new Date(date));
  const dayEnd = endOfDay(new Date(date));
  const meetingWhere = {
    time: {
      gte: dayStart,
      lte: dayEnd,
    },
    ...(userId && {
      clientLead: {
        userId: Number(userId),
      },
    }),
  };
  const callWhere = {
    time: {
      gte: dayStart,
      lte: dayEnd,
    },
    ...(userId && {
      clientLead: {
        userId: Number(userId),
      },
    }),
  };
  if (adminId) {
    meetingWhere.OR = [
      { adminId: Number(adminId) },
      { userId: Number(userId) },
    ];

    callWhere.userId = Number(adminId);
  }
  const meetings = await prisma.meetingReminder.findMany({
    where: meetingWhere,
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

  const calls = await prisma.callReminder.findMany({
    where: callWhere,
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

  return { meetings, calls };
}

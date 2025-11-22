// services/calendarService.js
import prisma from "../../prisma/prisma.js";
import { addMinutes, isBefore } from "date-fns";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// ----------------- Helpers -----------------

// Normalize date string: supports "YYYY-MM-DD" and "DD/MM/YYYY"
function normalizeDateString(dateStr) {
  if (!dateStr) return null;

  // If it has '/', assume DD/MM/YYYY
  if (dateStr.includes("/")) {
    const [d, m, y] = dateStr.split(/[\/]/);
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const d = dayjs(dateStr);
  if (!d.isValid()) return null;
  return d.format("YYYY-MM-DD");
}

// Build UTC Date from a local date string + local time string + timezone
function buildUtcDateTime({ dateStr, timeStr, tz }) {
  const normalizedDate = normalizeDateString(dateStr);
  if (!normalizedDate) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }

  // timeStr like "09:00" or "09:00 AM"
  const local = dayjs.tz(`${normalizedDate} ${timeStr}`, tz);
  if (!local.isValid()) {
    throw new Error(`Invalid local datetime: ${normalizedDate} ${timeStr}`);
  }

  return local.utc().toDate();
}

// ----------------- Get full calendar month -----------------

export async function getAvailableDays({
  month,
  adminId,
  userId,
  type, // "ADMIN" | "CLIENT" | "STAFF"
  timezone: tz = "Asia/Dubai",
}) {
  if (!adminId) {
    adminId = userId;
    if (!userId) {
      throw new Error("AdminId is required");
    }
  }

  const normalizedMonth =
    normalizeDateString(month) || dayjs(month).format("YYYY-MM-DD");

  // Month in user's timezone
  const monthLocal = dayjs.tz(normalizedMonth, tz);
  const monthStartLocal = monthLocal.startOf("month");
  const monthEndLocal = monthLocal.endOf("month");

  // Calendar grid: full weeks (Sun–Sat)
  const gridStartLocal = monthStartLocal.startOf("week");
  const gridEndLocal = monthEndLocal.endOf("week");

  const startUtc = gridStartLocal.utc().toDate();
  const endUtc = gridEndLocal.utc().toDate();

  const where = {
    userId: Number(adminId),
    date: {
      gte: startUtc,
      lte: endUtc,
    },
  };

  const now = new Date();

  if (type === "CLIENT") {
    // still نضمن إن اليوم نفسه فيه على الأقل slot متاح
    where.slots = {
      some: {
        isBooked: false,
        startTime: {
          gt: now,
        },
      },
    };
  }

  const days = await prisma.availableDay.findMany({
    where,
    select: {
      id: true,
      date: true, // UTC midnight
      slots: {
        select: {
          id: true,
          isBooked: true,
          meetingReminderId: true,
          startTime: true,
          endTime: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });

  const metaMap = {}; // key = "YYYY-MM-DD"

  for (const day of days) {
    const slots = day.slots || [];

    for (const slot of slots) {
      // لو user CLIENT ومش عايزين slots قديمة أو محجوزة ممكن نفلتر هنا كمان
      if (type === "CLIENT" && (slot.isBooked || slot.startTime <= now)) {
        continue;
      }

      // اليوم المحلي في timezone المستخدم بناءً على startTime بتاع الـ slot
      const localDateStr = dayjs(slot.startTime).tz(tz).format("YYYY-MM-DD");
      if (!metaMap[localDateStr]) {
        metaMap[localDateStr] = {
          availableDayIds: new Set(),
          totalSlots: 0,
          bookedWithReminder: 0,
          hasAvailableSlots: false,
        };
      }

      const entry = metaMap[localDateStr];

      entry.availableDayIds.add(day.id);
      entry.totalSlots += 1;

      if (!slot.isBooked) {
        entry.hasAvailableSlots = true;
      }

      if (slot.isBooked && slot.meetingReminderId) {
        entry.bookedWithReminder += 1;
      }
    }
  }

  // بعد ما خلصنا كل الـ slots نحسب fullyBooked per-local-day
  Object.keys(metaMap).forEach((dateStr) => {
    const entry = metaMap[dateStr];
    const allBookedWithReminder =
      entry.totalSlots > 0 && entry.bookedWithReminder === entry.totalSlots;

    entry.fullyBooked = allBookedWithReminder && !entry.hasAvailableSlots;
    // ناخد أي availableDayId (في الغالب واحد بس)
    entry.id = Array.from(entry.availableDayIds)[0] || null;
  });

  const weeks = [];
  let current = gridStartLocal;
  const todayLocal = dayjs().tz(tz).startOf("day");

  while (
    current.isBefore(gridEndLocal, "day") ||
    current.isSame(gridEndLocal, "day")
  ) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const isoDate = current.format("YYYY-MM-DD");
      const meta = metaMap[isoDate];

      const isCurrentMonth =
        current.month() === monthStartLocal.month() &&
        current.year() === monthStartLocal.year();
      const isPast = current.isBefore(todayLocal, "day");

      week.push({
        isoDate, // local date in tz
        label: current.date(),
        isCurrentMonth,
        isPast,
        hasAvailableSlots: meta ? meta.hasAvailableSlots : false,
        fullyBooked: meta ? meta.fullyBooked : false,
        availableDay:
          meta && meta.id
            ? {
                id: meta.id,
                hasAvailableSlots: meta.hasAvailableSlots,
                fullyBooked: meta.fullyBooked,
              }
            : null,
      });

      current = current.add(1, "day");
    }
    weeks.push(week);
  }

  return {
    month: monthStartLocal.format("YYYY-MM"),
    weeks,
  };
}

// ----------------- Get available slots for a given day -----------------

export async function getAvailableSlotsForDay({
  date, // 'YYYY-MM-DD' or 'DD/MM/YYYY' or ISO, we normalize
  adminId,
  dayId,
  userId,
  timezone: tz = "Asia/Dubai",
  type, // "ADMIN" | "CLIENT"
}) {
  if (!adminId) {
    adminId = userId;
    if (!userId) {
      throw new Error("AdminId is required");
    }
  }
  const now = new Date();
  if (date) {
    const normalized = normalizeDateString(date);
    if (!normalized) {
      throw new Error(`Invalid date string: ${date}`);
    }

    const localStart = dayjs.tz(normalized, tz).startOf("day");
    const localEnd = localStart.add(1, "day");

    const startUtc = localStart.utc().toDate();
    const endUtc = localEnd.utc().toDate();

    const whereSlots = {
      startTime: {
        gte: startUtc,
        lte: endUtc,
      },
      availableDay: {
        userId: Number(adminId),
      },
      ...(type === "CLIENT"
        ? {
            isBooked: false,
            startTime: {
              gte: startUtc,
              lte: endUtc,
              gt: now,
            },
          }
        : {}),
    };
    const slots = await prisma.availableSlot.findMany({
      where: whereSlots,
      orderBy: { startTime: "asc" },
    });

    return slots;
  }

  if (!dayId) {
    throw new Error("Either date or dayId is required");
  }

  let whereSlots = {
    availableDayId: Number(dayId),
  };

  if (type === "CLIENT") {
    whereSlots.startTime = {
      gt: now,
    };
  }

  const slots = await prisma.availableSlot.findMany({
    where: whereSlots,
    orderBy: { startTime: "asc" },
  });

  return slots;
}

// ----------------- Create / regenerate available day + slots -----------------

export async function createOrUpdateAvailableDay({
  userId,
  date, // "21/11/2025" or "2025-11-21"
  fromTime, // "09:00"
  toTime, // "17:00"
  duration, // minutes
  breakMinutes,
  timeZone, // e.g. "Asia/Dubai"
}) {
  userId = Number(userId);
  const normalizedDate = normalizeDateString(date);
  if (!normalizedDate) {
    throw new Error("Invalid date");
  }

  // Midnight in local tz → store as UTC
  const localMidnight = dayjs.tz(normalizedDate, timeZone).startOf("day");
  const dateUtc = localMidnight.utc().toDate();

  const existing = await prisma.availableDay.findUnique({
    where: { userId_date: { userId, date: dateUtc } },
    include: { slots: true },
  });

  if (existing) {
    const hasBookedSlots = existing.slots.some((slot) => slot.isBooked);

    if (hasBookedSlots) {
      throw new Error(
        "You cannot regenerate this day. It contains booked slots."
      );
    } else {
      await prisma.availableSlot.deleteMany({
        where: { availableDayId: existing.id },
      });
      await prisma.availableDay.delete({
        where: { id: existing.id },
      });
    }
  }

  const day = await prisma.availableDay.create({
    data: {
      userId,
      date: dateUtc,
    },
  });

  await createSlotsForDay({
    date: normalizedDate,
    fromTime,
    toTime,
    duration,
    breakMinutes,
    day,
    timeZone,
  });

  return day;
}

export async function createSlotsForDay({
  date, // normalized "YYYY-MM-DD"
  fromTime,
  toTime,
  duration,
  breakMinutes,
  day,
  timeZone,
}) {
  const fromUtc = buildUtcDateTime({
    dateStr: date,
    timeStr: fromTime,
    tz: timeZone,
  });
  const toUtc = buildUtcDateTime({
    dateStr: date,
    timeStr: toTime,
    tz: timeZone,
  });

  let current = new Date(fromUtc);
  const slots = [];

  while (isBefore(addMinutes(current, duration), toUtc)) {
    const end = addMinutes(current, duration);

    slots.push({
      startTime: current,
      endTime: end,
      availableDayId: day.id,
      userTimezone: timeZone,
    });

    current = addMinutes(end, breakMinutes);
  }

  if (slots.length > 0) {
    await prisma.availableSlot.createMany({ data: slots });
  }

  return true;
}

// Multiple dates generation (for multi-select)
export async function createOrUpdateMultipleDays({
  userId,
  dates, // array of date strings
  fromTime,
  toTime,
  duration,
  breakMinutes,
  timeZone,
}) {
  const results = [];

  for (const date of dates) {
    const res = await createOrUpdateAvailableDay({
      userId,
      date,
      fromTime,
      toTime,
      duration,
      breakMinutes,
      timeZone,
    });
    results.push(res);
  }

  return results;
}

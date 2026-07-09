// calendar/availability usecase — business orchestration + timezone math + mapping (NO direct
// Prisma; all reads/writes go through availabilityRepository). Behavior is ported 1:1 from the
// legacy staff calendar surface (routes/calendar/calendar.js) + the availability/slot service
// + the meeting/call month-view service (formerly legacy/calendar-services.js). The heavy
// tz/slot-generation logic now lives HERE as the `*Impl` functions the usecase invokes; the
// pure Prisma lives in the repo; month-view lives in month-view.usecase.js.
//
// The acting user comes from the authenticated session (authUser) exactly as legacy used
// `getCurrentUser(req)`. The adminId/userId resolution (default adminId → caller's id) is
// preserved verbatim. Role-derived month-view filtering (admins see all; others see own;
// isSuperSales sees own) is reproduced from the legacy route handlers.
//
// The `this.legacy` seam is retained so the tests can inject stubs; in production it defaults
// to the relocated `*Impl` functions below (which the client-booking surface also reuses).
import { addMinutes, isBefore } from "date-fns";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import { availabilityRepository } from "./availability.repo.js";
import { getCalendarDataForMonth } from "./month-view.usecase.js";

dayjs.extend(timezone);
dayjs.extend(utc);

const DEFAULT_TZ = "Asia/Dubai";

// ════════════════════════════════════════════════════════════════════════════
//  Relocated availability/slot logic (formerly legacy/calendar-services.js).
//  Prisma → availabilityRepository; timezone math + mapping stays here. Verbatim.
// ════════════════════════════════════════════════════════════════════════════

export async function getAvailableDaysImpl({ month, adminId, type, userId }) {
  const start = dayjs(month).utc().startOf("month");
  const end = dayjs(month).utc().endOf("month");
  if (!adminId) {
    adminId = userId;
    if (!userId) {
      throw new Error("AdminId is required");
    }
  }

  const where = {
    userId: Number(adminId),
    date: {
      gte: start.toDate(),
      lte: end.toDate(),
    },
  };
  if (type === "CLIENT") {
    const now = dayjs().toDate();
    where.slots = {
      some: {
        isBooked: false,
        startTime: {
          gt: now,
        },
      },
    };
  }

  const availableDays = await availabilityRepository.findAvailableDays(where);

  return availableDays.map((day) => {
    const fullyBooked = day.slots?.every(
      (d) => d.isBooked && d.meetingReminderId
    );
    return { ...day, fullyBooked };
  });
}

export async function createAvailableDatesForMoreThanOneDayImpl({
  userId,
  days,
  fromHour,
  toHour,
  duration,
  breakMinutes,
  timeZone,
}) {
  userId = Number(userId);

  days.forEach(async (day) => {
    const submittedUtcDate = dayjs.utc(day);
    const offsetInMinutes = dayjs().tz(timeZone).utcOffset();
    const correctedDate = submittedUtcDate.add(offsetInMinutes, "minute");

    const localMidnight = correctedDate.startOf("day");
    const existing = await availabilityRepository.findDayByUserDateRaw({
      userId,
      date: localMidnight,
    });
    if (existing)
      await updateAvailableDayImpl({
        dayId: existing.id,
        date: day,
        fromHour,
        toHour,
        duration,
        breakMinutes,
        timeZone,
        userId,
      });
    else
      await createAvailableDayImpl({
        userId,
        date: day,
        fromHour,
        toHour,
        duration,
        breakMinutes,
        timeZone,
      });
  });
  return true;
}

export async function createAvailableDayImpl({
  userId,
  date,
  fromHour,
  toHour,
  duration,
  breakMinutes,
  timeZone,
}) {
  userId = Number(userId);
  const submittedUtcDate = dayjs.utc(date);
  const offsetInMinutes = dayjs().tz(timeZone).utcOffset();
  const correctedDate = submittedUtcDate.add(offsetInMinutes, "minute");

  const localMidnight = correctedDate.startOf("day");

  date = localMidnight.toDate();

  const existing = await availabilityRepository.findDayByUserDate({ userId, date });

  if (existing) {
    const hasBookedSlots = existing.slots.some((slot) => slot.isBooked);

    if (hasBookedSlots) {
      throw new Error("You cannot delete this day. It contains booked slots.");
    } else {
      await availabilityRepository.deleteSlotsByDayId(existing.id);
      await availabilityRepository.deleteDayById(existing.id);
    }
  }

  const day = await availabilityRepository.createDay({ userId, date });
  await createSlotsForDayImpl({
    date,
    fromHour,
    toHour,
    duration,
    breakMinutes,
    day,
    timeZone,
  });
  return true;
}

async function createSlotsForDayImpl({
  date,
  fromHour,
  toHour,
  duration,
  breakMinutes,
  day,
  timeZone,
}) {
  const baseDateStr = dayjs(date).format("YYYY-MM-DD");
  const fromTimeStr = `${baseDateStr} ${fromHour}`;
  const toTimeStr = `${baseDateStr} ${toHour}`;
  const from = dayjs.tz(fromTimeStr, timeZone).utc().toDate();
  const to = dayjs.tz(toTimeStr, timeZone).utc().toDate();

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
  await availabilityRepository.createSlots(slots);
}

export async function updateAvailableDayImpl({
  dayId,
  date,
  fromHour,
  toHour,
  duration,
  breakMinutes,
  timeZone,
  userId,
}) {
  dayId = Number(dayId);
  const existingDay = await availabilityRepository.findDayByIdWithSlots(dayId);
  if (existingDay.slots.some((s) => s.meetingReminderId !== null)) {
    throw new Error("Cannot update date: related meetings exist");
  }

  await availabilityRepository.deleteSlotsByDayId(existingDay.id);
  await availabilityRepository.deleteDayById(existingDay.id);
  await createAvailableDayImpl({
    date,
    fromHour,
    toHour,
    duration,
    breakMinutes,
    userId: userId,
    timeZone: timeZone,
  });
  return true;
}

export async function getAvailableSlotsForDayImpl({
  date,
  adminId,
  dayId,
  userId,
  role = true,
  timezone = "Asia/Dubai",
  type,
}) {
  if (!adminId) {
    adminId = userId;
    if (!userId) {
      throw new Error("AdminId is required");
    }
  }

  const start = dayjs.utc(date);
  const startDate = start.toDate();

  const endDate = start.add(24, "hour").toDate();

  const day = !date
    ? await availabilityRepository.findDayById(dayId)
    : await availabilityRepository.findFirstDayByDateRange({
        startDate,
        endDate,
        adminId,
      });

  const now = dayjs().toDate();
  let slotWhere = {};
  if (type === "CLIENT") {
    slotWhere.startTime = {
      gt: now,
    };
  }
  if (date) {
    slotWhere = {
      startTime: {
        gte: startDate,
        lte: endDate,
      },
      availableDay: {
        userId: Number(adminId),
      },
    };
  }
  return date
    ? await availabilityRepository.findSlots(slotWhere)
    : await availabilityRepository.findSlotsForDayOrdered({
        availableDayId: day.id,
        slotWhere,
      });
}

export async function deleteASlotImpl({ slotId }) {
  slotId = Number(slotId);
  const slot = await availabilityRepository.findSlotById(slotId);

  if (!slot) throw new Error("Slot not found");

  if (slot.isBooked) {
    throw new Error("Cannot delete a booked slot");
  }

  return await availabilityRepository.deleteSlotByIdReturning(slotId);
}

export async function deleteADayImpl({ dayId }) {
  const check = await availabilityRepository.findFirstBookedSlot(dayId);
  if (check) {
    throw new Error("Cant delete the day cause there is a booked slot");
  }

  await availabilityRepository.deleteSlotsByDayId(Number(dayId));
  await availabilityRepository.deleteDayById(Number(dayId));
  return true;
}

export async function addCutsomDateImpl({ fromHour, toHour, dayId, timeZone }) {
  dayId = Number(dayId);
  if (!fromHour || !toHour || !dayId) {
    throw new Error("fromHour, toHour, and dayId are required");
  }

  const availableDay = await availabilityRepository.findDayDate(dayId);
  if (!availableDay) {
    throw new Error("Available day not found");
  }

  // Format the date to YYYY-MM-DD
  const dateStr = dayjs(availableDay.date).format("YYYY-MM-DD");

  // Combine date + time in user's local time zone
  const startTimeUtc = dayjs
    .tz(`${dateStr} ${fromHour}`, "YYYY-MM-DD HH:mm", timeZone)
    .utc()
    .toDate();

  const endTimeUtc = dayjs
    .tz(`${dateStr} ${toHour}`, "YYYY-MM-DD HH:mm", timeZone)
    .utc()
    .toDate();

  const overlappingSlots = await availabilityRepository.findOverlappingSlots({
    dayId,
    startTimeUtc,
    endTimeUtc,
  });

  if (overlappingSlots.length > 0) {
    throw new Error("This time slot conflicts with an existing one.");
  }

  await availabilityRepository.createCustomSlot({ dayId, startTimeUtc, endTimeUtc });
}

export async function getRemindersForDayImpl({ date, userId, adminId }) {
  const submittedUtcDate = dayjs.utc(date);

  const localMidnight = submittedUtcDate.startOf("day");
  const localEndOfDay = submittedUtcDate.endOf("day");

  // Convert those to UTC for DB filtering
  const dayStart = localMidnight.utc().toDate();
  const dayEnd = localEndOfDay.utc().toDate();

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
  const meetings = await availabilityRepository.findDayMeetings(meetingWhere);
  const calls = await availabilityRepository.findDayCalls(callWhere);

  return { meetings, calls };
}

// ════════════════════════════════════════════════════════════════════════════
//  Usecase — the `this.legacy` seam wires the request-shaped methods to the
//  relocated *Impl functions (production) or to injected stubs (tests). The
//  create adapters translate fromTime/toTime/dates → fromHour/toHour/days.
// ════════════════════════════════════════════════════════════════════════════
const legacyDefaults = {
  getAvailableDays: (a) => getAvailableDaysImpl(a),
  getAvailableSlotsForDay: (a) => getAvailableSlotsForDayImpl(a),
  createOrUpdateAvailableDay: ({ fromTime, toTime, ...rest }) =>
    createAvailableDayImpl({ ...rest, fromHour: fromTime, toHour: toTime }),
  createOrUpdateMultipleDays: ({ dates, fromTime, toTime, ...rest }) =>
    createAvailableDatesForMoreThanOneDayImpl({
      ...rest,
      days: dates,
      fromHour: fromTime,
      toHour: toTime,
    }),
  getCalendarDataForMonth: (a) => getCalendarDataForMonth(a),
  getRemindersForDay: (a) => getRemindersForDayImpl(a),
};

// Reproduce the legacy role gate used inside the month-view route handlers verbatim:
// userId filter is applied for non-admin / non-superSales users; admins/superSales pass
// `false` (legacy short-circuit) so the service does not filter by userId.
function isAdminRole(role) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export class AvailabilityUsecase {
  constructor(repository, legacy = {}) {
    this.repo = repository;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // GET available-days — legacy resolved adminId (default → caller id), passed userId +
  // type ("ADMIN" default) + timezone ("Asia/Dubai" default).
  getAvailableDays({ query, authUser }) {
    let { month, adminId, timezone, type } = query;
    if (!adminId || adminId === "undefined") adminId = authUser.id;
    return this.legacy.getAvailableDays({
      month,
      adminId,
      userId: authUser.id,
      type: type || "ADMIN",
      timezone: timezone || DEFAULT_TZ,
    });
  }

  // GET slots — same adminId resolution; passes date/dayId + type/timezone defaults.
  getSlots({ query, authUser }) {
    let { date, adminId, dayId, timezone, type } = query;
    if (!adminId || adminId === "undefined") adminId = authUser.id;
    return this.legacy.getAvailableSlotsForDay({
      date,
      adminId,
      dayId,
      userId: authUser.id,
      timezone: timezone || DEFAULT_TZ,
      type: type || "ADMIN",
    });
  }

  // POST available-days (single) — legacy mapped body {date, fromHour, toHour, duration,
  // breakMinutes} + query.timezone → service args (fromTime/toTime/timeZone). userId from
  // the session (never the client body).
  createOrUpdateAvailableDay({ body, timezone, authUser }) {
    const { date, fromHour, toHour, duration, breakMinutes } = body;
    return this.legacy.createOrUpdateAvailableDay({
      userId: authUser.id,
      date,
      fromTime: fromHour,
      toTime: toHour,
      duration,
      breakMinutes,
      timeZone: timezone || DEFAULT_TZ,
    });
  }

  // POST available-days/multiple — legacy mapped body {days, ...} → service `dates`.
  createOrUpdateMultipleDays({ body, timezone, authUser }) {
    const { days, fromHour, toHour, duration, breakMinutes } = body;
    return this.legacy.createOrUpdateMultipleDays({
      userId: authUser.id,
      dates: days,
      fromTime: fromHour,
      toTime: toHour,
      duration,
      breakMinutes,
      timeZone: timezone || DEFAULT_TZ,
    });
  }

  // DELETE days/:id — inline Prisma moved to the repo (slots-then-day, no booked guard;
  // matches the legacy route exactly).
  deleteDay({ dayId }) {
    return this.repo.deleteDayWithSlots({ dayId });
  }

  // DELETE slots/:id — inline Prisma moved to the repo.
  deleteSlot({ slotId }) {
    return this.repo.deleteSlot({ slotId });
  }

  // GET dates/month — meeting/call month-view. Legacy applied: userId filter for non-
  // admin/non-superSales; adminId = caller id when query.isAdmin === "true"; isSuperSales
  // + superSalesId passed through.
  getCalendarMonth({ query, authUser }) {
    const isAdmin = isAdminRole(authUser.role);
    return this.legacy.getCalendarDataForMonth({
      year: query.year,
      month: query.month,
      userId: !isAdmin && !authUser.isSuperSales && authUser.id,
      adminId: query.isAdmin === "true" ? authUser.id : null,
      isSuperSales: authUser.isSuperSales,
      superSalesId: authUser.id,
    });
  }

  // GET dates/day — reminders for a day. Legacy: userId filter for non-admin; adminId =
  // caller id when query.isAdmin === "true".
  getRemindersForDay({ query, authUser }) {
    const isAdmin = isAdminRole(authUser.role);
    return this.legacy.getRemindersForDay({
      date: query.date,
      userId: !isAdmin && authUser.id,
      adminId: query.isAdmin === "true" && authUser.id,
    });
  }
}

export const availabilityUsecase = new AvailabilityUsecase(availabilityRepository);

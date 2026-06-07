// calendar/availability usecase — business orchestration ONLY (no Prisma directly; repo
// calls + lazy legacy adapters). Behavior is ported 1:1 from the legacy staff calendar
// router (routes/calendar/calendar.js) + the availability service
// (routes/calendar/new-calendar.js — a SERVICE file despite living under routes/) + the
// meeting/call month-view service (services/main/calendar/calendarServices.js).
//
// The acting user comes from the authenticated session (authUser) exactly as legacy used
// `getCurrentUser(req)`. The adminId/userId resolution (default adminId → caller's id) is
// preserved verbatim. Role-derived month-view filtering (admins see all; others see own;
// isSuperSales sees own) is reproduced from the legacy route handlers.
import { availabilityRepository } from "./availability.repository.js";

const DEFAULT_TZ = "Asia/Dubai";

// new-calendar.js is the availability/slot SERVICE (getAvailableDays/getAvailableSlotsForDay/
// createOrUpdateAvailableDay/createOrUpdateMultipleDays). The month-view + reminders come
// from the calendar service. Heavy logic is NOT duplicated — only invoked.
const legacyDefaults = {
  getAvailableDays: (a) =>
    import("../../../../routes/calendar/new-calendar.js").then((m) => m.getAvailableDays(a)),
  getAvailableSlotsForDay: (a) =>
    import("../../../../routes/calendar/new-calendar.js").then((m) => m.getAvailableSlotsForDay(a)),
  createOrUpdateAvailableDay: (a) =>
    import("../../../../routes/calendar/new-calendar.js").then((m) => m.createOrUpdateAvailableDay(a)),
  createOrUpdateMultipleDays: (a) =>
    import("../../../../routes/calendar/new-calendar.js").then((m) => m.createOrUpdateMultipleDays(a)),
  getCalendarDataForMonth: (a) =>
    import("../../../../services/main/calendar/calendarServices.js").then((m) =>
      m.getCalendarDataForMonth(a),
    ),
  getRemindersForDay: (a) =>
    import("../../../../services/main/calendar/calendarServices.js").then((m) =>
      m.getRemindersForDay(a),
    ),
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

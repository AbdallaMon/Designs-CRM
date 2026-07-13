import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module mocks (hoisted above imports) ──────────────────────────────────────────────
// After DI removal the usecases call their repos / infra side-effects / the month-view
// function directly (no constructor injection), so the test seams move to vi.mock(). Factories
// must not reference outer vars — declare inline vi.fn()s and configure them per-test.
vi.mock("../availability/availability.repo.js", () => ({
  availabilityRepository: {
    findAvailableDays: vi.fn(),
    findDayByUserDate: vi.fn(),
    findDayByUserDateRaw: vi.fn(),
    findDayByIdWithSlots: vi.fn(),
    createDay: vi.fn(),
    createSlots: vi.fn(),
    deleteSlotsByDayId: vi.fn(),
    deleteDayById: vi.fn(),
    findDayById: vi.fn(),
    findFirstDayByDateRange: vi.fn(),
    findSlots: vi.fn(),
    findSlotsForDayOrdered: vi.fn(),
    findSlotById: vi.fn(),
    deleteSlotByIdReturning: vi.fn(),
    findFirstBookedSlot: vi.fn(),
    deleteDayWithSlots: vi.fn(),
    deleteSlot: vi.fn(),
    findDayDate: vi.fn(),
    findOverlappingSlots: vi.fn(),
    createCustomSlot: vi.fn(),
    findMonthMeetings: vi.fn(),
    findMonthCalls: vi.fn(),
    findDayMeetings: vi.fn(),
    findDayCalls: vi.fn(),
  },
}));

// The month-view function is a SEPARATE module, so the availability usecase's delegation to it
// stays mockable exactly as before (the old `{ getCalendarDataForMonth }` injection).
vi.mock("../availability/month-view.usecase.js", () => ({
  getCalendarDataForMonth: vi.fn(),
}));

vi.mock("../client/client-calendar.repo.js", () => ({
  clientCalendarRepository: {
    findSlotById: vi.fn(),
    findReminderByToken: vi.fn(),
    updateMeetingReminderTime: vi.fn(),
    findReminderForBooking: vi.fn(),
    findSlotForAssign: vi.fn(),
    assignSlotToReminder: vi.fn(),
    markSlotBooked: vi.fn(),
  },
}));

vi.mock("../../../infra/notifications/index.js", () => ({
  newMeetingNotification: vi.fn(),
}));

vi.mock("../../../infra/mail/email-templates.js", () => ({
  sendReminderCreatedToClient: vi.fn(),
}));

// Google infra client — provides both the OAuth adapters the google usecase lazily imports
// AND createCalendarEvent (used by the client booking side-effect).
vi.mock("../../../infra/google/google-calendar.client.js", () => ({
  getAuthUrl: vi.fn(),
  handleOAuthCallback: vi.fn(),
  disconnectGoogleCalendar: vi.fn(),
  isGoogleCalendarConnected: vi.fn(),
  createCalendarEvent: vi.fn(),
}));

vi.mock("../google/google.repo.js", () => ({
  googleCalendarRepository: {
    findConnectionStatus: vi.fn(),
  },
}));

import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  PERMISSIONS,
  getEffectivePermissions,
  USER_ROLES,
  authMessagesCodes,
  calendarMessagesCodes,
} from "@dms/shared";

import { availabilityUsecase } from "../availability/availability.usecase.js";
import { availabilityRepository } from "../availability/availability.repo.js";
import { getCalendarDataForMonth } from "../availability/month-view.usecase.js";
import { AvailabilityValidation } from "../availability/availability.validation.js";
import { googleCalendarUsecase } from "../google/google.usecase.js";
import { googleCalendarRepository } from "../google/google.repo.js";
import {
  getAuthUrl,
  isGoogleCalendarConnected,
} from "../../../infra/google/google-calendar.client.js";
import { clientCalendarUsecase } from "../client/client-calendar.usecase.js";
import { clientCalendarRepository } from "../client/client-calendar.repo.js";
import { newMeetingNotification } from "../../../infra/notifications/index.js";
import { ClientCalendarValidation } from "../client/client-calendar.validation.js";

const P = PERMISSIONS.CALENDAR;

beforeEach(() => {
  vi.clearAllMocks();
});

function makeReq(role, isSuperSales = false) {
  const { permissions, permissionsByModule } = getEffectivePermissions({ role, isSuperSales });
  return { auth: { id: 1, role, isSuperSales, permissions, permissionsByModule } };
}

// Every authed role behind the legacy SHARED gate.
const SHARED_ROLES = [
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.STAFF,
  USER_ROLES.THREE_D_DESIGNER,
  USER_ROLES.TWO_D_DESIGNER,
  USER_ROLES.TWO_D_EXECUTOR,
  USER_ROLES.ACCOUNTANT,
  USER_ROLES.SUPER_SALES,
  USER_ROLES.CONTACT_INITIATOR,
];

// ════════════════════════════════════════════════════════════════════════════
//  PERMISSION GATE — role parity (legacy SHARED gate = every authed role)
// ════════════════════════════════════════════════════════════════════════════
describe("calendar route permission gate (SHARED parity: every authed role allowed)", () => {
  for (const role of SHARED_ROLES) {
    it(`${role} passes the calendar VIEW gate`, () => {
      const req = makeReq(role);
      const next = vi.fn();
      AuthMiddleware.requirePermissions([P.VIEW])(req, {}, next);
      expect(next).toHaveBeenCalledWith();
    });

    it(`${role} passes the calendar MANAGE gate`, () => {
      const req = makeReq(role);
      const next = vi.fn();
      AuthMiddleware.requirePermissions([P.MANAGE])(req, {}, next);
      expect(next).toHaveBeenCalledWith();
    });

    it(`${role} passes the calendar GOOGLE_MANAGE gate`, () => {
      const req = makeReq(role);
      const next = vi.fn();
      AuthMiddleware.requirePermissions([P.GOOGLE_MANAGE])(req, {}, next);
      expect(next).toHaveBeenCalledWith();
    });
  }

  it("an unauthenticated request (no req.auth) is 401'd on a calendar gate", () => {
    const next = vi.fn();
    AuthMiddleware.requirePermissions([P.VIEW])({}, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it("holding only VIEW does NOT satisfy the MANAGE gate (read/write split)", () => {
    const req = { auth: { id: 1, permissions: [P.VIEW] } };
    const next = vi.fn();
    AuthMiddleware.requirePermissions([P.MANAGE])(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe(authMessagesCodes.PERMISSION_DENIED);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  AVAILABILITY VALIDATION — reject malformed slot-generation bodies
// ════════════════════════════════════════════════════════════════════════════
describe("availability body validation", () => {
  const valid = {
    date: "2026-06-10",
    fromHour: "09:00",
    toHour: "17:00",
    duration: 30,
    breakMinutes: 5,
  };

  it("createDay: accepts a valid body (coerces numeric strings)", () => {
    const r = AvailabilityValidation.createDay.safeParse({ ...valid, duration: "30", breakMinutes: "0" });
    expect(r.success).toBe(true);
    expect(r.data.duration).toBe(30);
    expect(r.data.breakMinutes).toBe(0);
  });

  it("createDay: rejects a zero/negative duration", () => {
    expect(AvailabilityValidation.createDay.safeParse({ ...valid, duration: 0 }).success).toBe(false);
    expect(AvailabilityValidation.createDay.safeParse({ ...valid, duration: -10 }).success).toBe(false);
  });

  it("createDay: rejects a NaN duration", () => {
    expect(AvailabilityValidation.createDay.safeParse({ ...valid, duration: "abc" }).success).toBe(false);
  });

  it("createDay: rejects a negative breakMinutes", () => {
    expect(AvailabilityValidation.createDay.safeParse({ ...valid, breakMinutes: -1 }).success).toBe(false);
  });

  it("createDay: .strict() rejects an unexpected extra field (mass-assignment defense)", () => {
    const r = AvailabilityValidation.createDay.safeParse({ ...valid, userId: 999 });
    expect(r.success).toBe(false);
  });

  it("createMultipleDays: requires a non-empty days array", () => {
    const base = { fromHour: "09:00", toHour: "17:00", duration: 30, breakMinutes: 5 };
    expect(
      AvailabilityValidation.createMultipleDays.safeParse({ ...base, days: [] }).success,
    ).toBe(false);
    expect(
      AvailabilityValidation.createMultipleDays.safeParse({ ...base, days: ["2026-06-10"] }).success,
    ).toBe(true);
  });

  it("idParams: rejects a non-numeric id", () => {
    expect(AvailabilityValidation.idParams.safeParse({ id: "abc" }).success).toBe(false);
    expect(AvailabilityValidation.idParams.safeParse({ id: "7" }).success).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  AVAILABILITY USECASE — adminId default + month-view role filtering parity
//  (DI removed: the usecase now drives the real *Impl functions, so the assertions
//  observe the same behavior at the mocked repo / month-view boundary.)
// ════════════════════════════════════════════════════════════════════════════
describe("AvailabilityUsecase delegation + legacy parity", () => {
  it("getAvailableDays defaults adminId to the caller and forwards type/timezone defaults", async () => {
    availabilityRepository.findAvailableDays.mockResolvedValue([]);
    await availabilityUsecase.getAvailableDays({ query: { month: "2026-06" }, authUser: { id: 42, role: "STAFF" } });
    const where = availabilityRepository.findAvailableDays.mock.calls[0][0];
    // adminId defaulted to the caller (42) → reached the day query as userId.
    expect(where.userId).toBe(42);
    // type "ADMIN" (default, not CLIENT) → no future-unbooked slot filter is applied.
    expect(where.slots).toBeUndefined();
  });

  it("getAvailableDays keeps an explicit adminId from the query", async () => {
    availabilityRepository.findAvailableDays.mockResolvedValue([]);
    await availabilityUsecase.getAvailableDays({
      query: { month: "2026-06", adminId: "9" },
      authUser: { id: 42, role: "STAFF" },
    });
    // the explicit adminId ("9") wins over the caller id (42).
    expect(availabilityRepository.findAvailableDays.mock.calls[0][0].userId).toBe(9);
  });

  it("month-view: a non-admin sees ONLY their own userId (legacy role filter preserved)", async () => {
    getCalendarDataForMonth.mockResolvedValue({});
    await availabilityUsecase.getCalendarMonth({
      query: { year: "2026", month: "6" },
      authUser: { id: 7, role: "STAFF", isSuperSales: false },
    });
    expect(getCalendarDataForMonth.mock.calls[0][0].userId).toBe(7);
  });

  it("month-view: an ADMIN is NOT userId-filtered (sees all)", async () => {
    getCalendarDataForMonth.mockResolvedValue({});
    await availabilityUsecase.getCalendarMonth({
      query: { year: "2026", month: "6" },
      authUser: { id: 1, role: "ADMIN", isSuperSales: false },
    });
    expect(getCalendarDataForMonth.mock.calls[0][0].userId).toBe(false);
  });

  it("createOrUpdateAvailableDay takes userId from the session, never the body", async () => {
    availabilityRepository.findDayByUserDate.mockResolvedValue(null);
    availabilityRepository.createDay.mockResolvedValue({ id: 1 });
    availabilityRepository.createSlots.mockResolvedValue(undefined);
    await availabilityUsecase.createOrUpdateAvailableDay({
      body: { date: "2026-06-10", fromHour: "09:00", toHour: "17:00", duration: 30, breakMinutes: 5 },
      timezone: "Asia/Dubai",
      authUser: { id: 99 },
    });
    // userId comes from the session (99) at both the existence check and the create.
    expect(availabilityRepository.findDayByUserDate.mock.calls[0][0].userId).toBe(99);
    expect(availabilityRepository.createDay.mock.calls[0][0].userId).toBe(99);
  });

  it("deleteDay delegates to the repo (inline Prisma moved out of the route)", async () => {
    availabilityRepository.deleteDayWithSlots.mockResolvedValue(true);
    await availabilityUsecase.deleteDay({ dayId: "3" });
    expect(availabilityRepository.deleteDayWithSlots).toHaveBeenCalledWith({ dayId: "3" });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  GOOGLE USECASE — already-connected guard + self-scoping + no token leakage
// ════════════════════════════════════════════════════════════════════════════
describe("GoogleCalendarUsecase", () => {
  it("connect throws GOOGLE_ALREADY_CONNECTED (400) when already connected", async () => {
    isGoogleCalendarConnected.mockResolvedValue(true);
    await expect(googleCalendarUsecase.connect({ authUser: { id: 1 } })).rejects.toMatchObject({
      statusCode: 400,
      message: calendarMessagesCodes.GOOGLE_ALREADY_CONNECTED,
    });
  });

  it("connect returns the auth URL for the CALLER's id when not connected", async () => {
    isGoogleCalendarConnected.mockResolvedValue(false);
    getAuthUrl.mockResolvedValue("https://accounts.google.com/o/oauth2/...");
    const res = await googleCalendarUsecase.connect({ authUser: { id: 55 } });
    expect(getAuthUrl).toHaveBeenCalledWith(55);
    expect(res).toEqual({ isConnected: false, authUrl: "https://accounts.google.com/o/oauth2/..." });
  });

  it("status exposes ONLY connection metadata, never tokens", async () => {
    googleCalendarRepository.findConnectionStatus.mockResolvedValue({
      // Real schema fields — there is NO googleCalendarConnected column. `connected` is
      // derived from the presence of a stored refresh token, which must NOT leak out.
      googleRefreshToken: "1//refresh-secret",
      googleCalendarId: "primary@x",
      googleTokenExpiresAt: new Date(Date.now() + 3600_000),
    });
    const res = await googleCalendarUsecase.getGoogleStatus({ authUser: { id: 8 } });
    expect(googleCalendarRepository.findConnectionStatus).toHaveBeenCalledWith({ userId: 8 });
    expect(res).toEqual({ connected: true, calendarId: "primary@x", tokenExpired: false });
    // No secret VALUES leak: the response carries no access/refresh-token fields.
    expect(res).not.toHaveProperty("googleAccessToken");
    expect(res).not.toHaveProperty("googleRefreshToken");
    expect(JSON.stringify(res)).not.toMatch(/refreshToken|accessToken|googleAccessToken|googleRefreshToken/i);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  CLIENT (PUBLIC) BOOKING — token is the credential; body cannot override it
// ════════════════════════════════════════════════════════════════════════════
describe("ClientCalendarUsecase (public, token-based)", () => {
  it("book ALWAYS derives reminder/lead from the verified token (body cannot override)", async () => {
    // The verified token (via the real dto shaping of this repo row) yields reminderId 10 /
    // clientLeadId 20 — NOT the malicious body's 999 / 888.
    clientCalendarRepository.findReminderByToken.mockResolvedValue({
      id: 10,
      userId: 40,
      clientLeadId: 20,
      adminId: 30,
    });
    clientCalendarRepository.updateMeetingReminderTime.mockResolvedValue({ id: 10 });
    clientCalendarRepository.findSlotForAssign.mockResolvedValue({ id: 5, isBooked: false });
    clientCalendarRepository.assignSlotToReminder.mockResolvedValue({ id: 10 });
    clientCalendarRepository.markSlotBooked.mockResolvedValue({ id: 5, isBooked: true });
    clientCalendarRepository.findReminderForBooking.mockResolvedValue({
      id: 10,
      time: new Date(),
      userTimezone: "Asia/Dubai",
      clientLead: { client: { email: "c@x.com", name: "Client" } },
    });

    // A malicious body tries to hijack the booking onto another reminder/lead.
    await clientCalendarUsecase.bookMeeting({
      token: "tok",
      body: { reminderId: 999, clientLeadId: 888, selectedSlot: { id: 5, startTime: "x" } },
    });

    // token spread comes AFTER the body spread, so the verified ids win: the reminder time
    // update targets reminderId 10 and the notification fires for clientLeadId 20.
    expect(clientCalendarRepository.updateMeetingReminderTime.mock.calls[0][0].reminderId).toBe(10);
    expect(newMeetingNotification).toHaveBeenCalledWith(20, expect.anything());
  });

  it("book validation STRIPS body fields outside selectedSlot/selectedTimezone (parity: FE posts its whole session object)", () => {
    // The FE posts its entire booking session (selectedDate, dayId, token, reminderId, ...).
    // These are dropped, not rejected — a 422 here would break the public booking flow.
    const r = ClientCalendarValidation.book.safeParse({
      selectedSlot: { id: 5, startTime: "2026-06-10T09:00:00Z" },
      selectedDate: "2026-06-10",
      dayId: 3,
      token: "tok",
      reminderId: 999,
      clientLeadId: 888,
      userTimezone: "Asia/Dubai",
    });
    expect(r.success).toBe(true);
    // The mass-assignment vector is closed by stripping: those keys never reach the usecase.
    expect(r.data).not.toHaveProperty("reminderId");
    expect(r.data).not.toHaveProperty("clientLeadId");
    expect(Object.keys(r.data)).toEqual(["selectedSlot"]);
  });

  it("book validation accepts the legitimate slot + timezone body", () => {
    const r = ClientCalendarValidation.book.safeParse({
      selectedSlot: { id: 5, startTime: "2026-06-10T09:00:00Z", type: "REAL" },
      selectedTimezone: "Asia/Dubai",
    });
    expect(r.success).toBe(true);
  });

  it("timezones returns a non-empty grouped IANA list (pure, no token)", () => {
    const list = clientCalendarUsecase.getTimezones();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty("value");
    expect(list[0]).toHaveProperty("label");
  });
});

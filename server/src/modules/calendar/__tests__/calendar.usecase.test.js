import { describe, it, expect, vi } from "vitest";

import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  PERMISSIONS,
  getEffectivePermissions,
  USER_ROLES,
  authMessagesCodes,
  calendarMessagesCodes,
} from "@dms/shared";

import { AvailabilityUsecase } from "../availability/availability.usecase.js";
import { AvailabilityValidation } from "../availability/availability.validation.js";
import { GoogleCalendarUsecase } from "../google/google.usecase.js";
import { ClientCalendarUsecase } from "../client/client-calendar.usecase.js";
import { ClientCalendarValidation } from "../client/client-calendar.validation.js";

const C = calendarMessagesCodes;
const P = PERMISSIONS.CALENDAR;

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
    expect(err.message).toBe(authMessagesCodes.FORBIDDEN);
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
// ════════════════════════════════════════════════════════════════════════════
describe("AvailabilityUsecase delegation + legacy parity", () => {
  it("getAvailableDays defaults adminId to the caller and forwards type/timezone defaults", async () => {
    const getAvailableDays = vi.fn().mockResolvedValue({ weeks: [] });
    const uc = new AvailabilityUsecase({}, { getAvailableDays });
    await uc.getAvailableDays({ query: { month: "2026-06" }, authUser: { id: 42, role: "STAFF" } });
    const arg = getAvailableDays.mock.calls[0][0];
    expect(arg.adminId).toBe(42);
    expect(arg.userId).toBe(42);
    expect(arg.type).toBe("ADMIN");
    expect(arg.timezone).toBe("Asia/Dubai");
  });

  it("getAvailableDays keeps an explicit adminId from the query", async () => {
    const getAvailableDays = vi.fn().mockResolvedValue({});
    const uc = new AvailabilityUsecase({}, { getAvailableDays });
    await uc.getAvailableDays({ query: { month: "2026-06", adminId: "9" }, authUser: { id: 42, role: "STAFF" } });
    expect(getAvailableDays.mock.calls[0][0].adminId).toBe("9");
  });

  it("month-view: a non-admin sees ONLY their own userId (legacy role filter preserved)", async () => {
    const getCalendarDataForMonth = vi.fn().mockResolvedValue({});
    const uc = new AvailabilityUsecase({}, { getCalendarDataForMonth });
    await uc.getCalendarMonth({
      query: { year: "2026", month: "6" },
      authUser: { id: 7, role: "STAFF", isSuperSales: false },
    });
    expect(getCalendarDataForMonth.mock.calls[0][0].userId).toBe(7);
  });

  it("month-view: an ADMIN is NOT userId-filtered (sees all)", async () => {
    const getCalendarDataForMonth = vi.fn().mockResolvedValue({});
    const uc = new AvailabilityUsecase({}, { getCalendarDataForMonth });
    await uc.getCalendarMonth({
      query: { year: "2026", month: "6" },
      authUser: { id: 1, role: "ADMIN", isSuperSales: false },
    });
    expect(getCalendarDataForMonth.mock.calls[0][0].userId).toBe(false);
  });

  it("createOrUpdateAvailableDay takes userId from the session, never the body", async () => {
    const createOrUpdateAvailableDay = vi.fn().mockResolvedValue({ id: 5 });
    const uc = new AvailabilityUsecase({}, { createOrUpdateAvailableDay });
    await uc.createOrUpdateAvailableDay({
      body: { date: "2026-06-10", fromHour: "09:00", toHour: "17:00", duration: 30, breakMinutes: 5 },
      timezone: "Asia/Dubai",
      authUser: { id: 99 },
    });
    const arg = createOrUpdateAvailableDay.mock.calls[0][0];
    expect(arg.userId).toBe(99);
    expect(arg.fromTime).toBe("09:00");
    expect(arg.toTime).toBe("17:00");
    expect(arg.timeZone).toBe("Asia/Dubai");
  });

  it("deleteDay delegates to the repo (inline Prisma moved out of the route)", async () => {
    const deleteDayWithSlots = vi.fn().mockResolvedValue(true);
    const uc = new AvailabilityUsecase({ deleteDayWithSlots }, {});
    await uc.deleteDay({ dayId: "3" });
    expect(deleteDayWithSlots).toHaveBeenCalledWith({ dayId: "3" });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  GOOGLE USECASE — already-connected guard + self-scoping + no token leakage
// ════════════════════════════════════════════════════════════════════════════
describe("GoogleCalendarUsecase", () => {
  it("connect throws GOOGLE_ALREADY_CONNECTED (400) when already connected", async () => {
    const uc = new GoogleCalendarUsecase(
      {},
      { isGoogleCalendarConnected: vi.fn().mockResolvedValue(true), getAuthUrl: vi.fn() },
    );
    await expect(uc.connect({ authUser: { id: 1 } })).rejects.toMatchObject({
      statusCode: 400,
      message: C.GOOGLE_ALREADY_CONNECTED,
    });
  });

  it("connect returns the auth URL for the CALLER's id when not connected", async () => {
    const getAuthUrl = vi.fn().mockResolvedValue("https://accounts.google.com/o/oauth2/...");
    const uc = new GoogleCalendarUsecase(
      {},
      { isGoogleCalendarConnected: vi.fn().mockResolvedValue(false), getAuthUrl },
    );
    const res = await uc.connect({ authUser: { id: 55 } });
    expect(getAuthUrl).toHaveBeenCalledWith(55);
    expect(res).toEqual({ isConnected: false, authUrl: "https://accounts.google.com/o/oauth2/..." });
  });

  it("status exposes ONLY connection metadata, never tokens", async () => {
    const findConnectionStatus = vi.fn().mockResolvedValue({
      // Real schema fields — there is NO googleCalendarConnected column. `connected` is
      // derived from the presence of a stored refresh token, which must NOT leak out.
      googleRefreshToken: "1//refresh-secret",
      googleCalendarId: "primary@x",
      googleTokenExpiresAt: new Date(Date.now() + 3600_000),
    });
    const uc = new GoogleCalendarUsecase({ findConnectionStatus }, {});
    const res = await uc.status({ authUser: { id: 8 } });
    expect(findConnectionStatus).toHaveBeenCalledWith({ userId: 8 });
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
    const verifyAndExtractCalendarToken = vi
      .fn()
      .mockResolvedValue({ reminderId: 10, clientLeadId: 20, adminId: 30, userId: 40 });
    const bookAMeeting = vi.fn().mockResolvedValue(true);
    const uc = new ClientCalendarUsecase({ verifyAndExtractCalendarToken, bookAMeeting });

    // A malicious body tries to hijack the booking onto another reminder/lead.
    await uc.book({
      token: "tok",
      body: { reminderId: 999, clientLeadId: 888, selectedSlot: { id: 5, startTime: "x" } },
    });

    const arg = bookAMeeting.mock.calls[0][0];
    // token spread comes AFTER the body spread, so the verified ids win.
    expect(arg.reminderId).toBe(10);
    expect(arg.clientLeadId).toBe(20);
  });

  it("book validation (.strict) rejects body fields outside selectedSlot/selectedTimezone", () => {
    const r = ClientCalendarValidation.book.safeParse({
      selectedSlot: { id: 5, startTime: "2026-06-10T09:00:00Z" },
      reminderId: 999,
    });
    expect(r.success).toBe(false);
  });

  it("book validation accepts the legitimate slot + timezone body", () => {
    const r = ClientCalendarValidation.book.safeParse({
      selectedSlot: { id: 5, startTime: "2026-06-10T09:00:00Z", type: "REAL" },
      selectedTimezone: "Asia/Dubai",
    });
    expect(r.success).toBe(true);
  });

  it("timezones returns a non-empty grouped IANA list (pure, no token)", () => {
    const uc = new ClientCalendarUsecase({});
    const list = uc.timezones();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty("value");
    expect(list[0]).toHaveProperty("label");
  });
});

// calendar/google routes — Google Calendar OAuth integration. Legacy:
// routes/calendar/google.js, a SUB-ROUTER of calendar.js mounted at `/google`, so it sat
// behind the SAME SHARED router-level authentication as the rest of calendar.js
// (i.e. `/shared/calendar/google/*` and `/shared/calendar-management/google/*`, any authed
// role). Mounted here under the v2 calendar aggregate at `/google` → `/v2/calendar/google/*`
// and `/v2/calendar-management/google/*`. Authentication is mounted ONCE at the calendar
// aggregate router; each route declares its CALENDAR.GOOGLE_* code (granted to every authed
// role via CALENDAR_AUTHED — reproducing the legacy SHARED gate exactly).
//
// SCOPE: all Google actions are self-scoped to the caller (req.auth.id); connect/disconnect/
// status act only on the caller's own connection, so the code is the gate (no object-scope
// checker). The OAuth callback identifies the user from the `state` query param (=userId)
// set when the auth URL was generated — token handling is owned by the frozen googleCalendar
// service and is never logged/leaked here.
//
// NOTE on the callback gate: in LEGACY the callback inherited the SHARED auth gate (it is a
// sub-route of the authed calendar router). To preserve observable behavior 1:1 it stays
// authed here under the same aggregate. It is gated GOOGLE_VIEW (any authed role).
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { PERMISSIONS } from "@dms/shared";
import { googleCalendarController } from "./google.controller.js";

const P = PERMISSIONS.CALENDAR;
const router = Router();

router.get(
  "/connect",
  AuthMiddleware.requirePermissions([P.GOOGLE_VIEW]),
  asyncHandler(googleCalendarController.connectGet),
);
router.post(
  "/connect",
  AuthMiddleware.requirePermissions([P.GOOGLE_MANAGE]),
  asyncHandler(googleCalendarController.connectPost),
);
router.get(
  "/callback",
  AuthMiddleware.requirePermissions([P.GOOGLE_VIEW]),
  asyncHandler(googleCalendarController.callback),
);
router.post(
  "/disconnect",
  AuthMiddleware.requirePermissions([P.GOOGLE_MANAGE]),
  asyncHandler(googleCalendarController.disconnect),
);
router.get(
  "/status",
  AuthMiddleware.requirePermissions([P.GOOGLE_VIEW]),
  asyncHandler(googleCalendarController.status),
);

export { router as googleCalendarRouter };

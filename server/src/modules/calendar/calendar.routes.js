// calendar — aggregate router for the AUTHED staff calendar surface (legacy
// routes/calendar/calendar.js, the SHARED router double-mounted at `/shared/calendar` and
// `/shared/calendar-management`). This aggregate is mounted TWICE under v2 (at
// `/v2/calendar` and `/v2/calendar-management`) to mirror the legacy double-mount exactly;
// legacy routers stay mounted in parallel during the strangler window.
//
// Authentication is mounted ONCE here. Each sub-router declares its per-route CALENDAR.*
// permission code, granted to EVERY authed role via CALENDAR_AUTHED — exactly reproducing
// the legacy SHARED gate (VERIFIED: the "SHARED" param of verifyTokenAndHandleAuthorization
// admits all 9 authed roles; the isAdmin early-return fires only for the "ADMIN" param).
//
// Sub-surface → mount (legacy → v2):
//   /shared/calendar(-management)/available-days|slots|dates/*|days/:id|slots/:id
//                                       → /v2/calendar(-management)/*           (availability)
//   /shared/calendar(-management)/google/*
//                                       → /v2/calendar(-management)/google/*    (google OAuth)
//
// The PUBLIC client booking surface (legacy /client/calendar) is a SEPARATE ungated router
// (client-calendar.routes.js) and is NOT mounted here.
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { availabilityRouter } from "./availability/availability.route.js";
import { googleCalendarRouter } from "./google/google.route.js";

const router = Router();

// Authentication mounted once for the whole authed calendar surface.
router.use(AuthMiddleware.requireAuth);

// Google OAuth sub-router (legacy calendar.js `router.use("/google", googleRoutes)`).
router.use("/google", googleCalendarRouter);
// Availability + month-views at the calendar root.
router.use("/", availabilityRouter);

export { router as calendarRouter };

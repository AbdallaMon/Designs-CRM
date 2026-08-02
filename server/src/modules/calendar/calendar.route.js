// Authenticated calendar API. Authentication is applied once here and every sub-router
// declares its action-specific CALENDAR permission.
//
// Sub-surface → mount (legacy → v2):
//   /shared/calendar(-management)/available-days|slots|dates/*|days/:id|slots/:id
//                                       → /v2/calendar(-management)/*           (availability)
//   /shared/calendar(-management)/google/*
//                                       → /v2/calendar(-management)/google/*    (google OAuth)
//
// The PUBLIC client booking surface (legacy /client/calendar) is a SEPARATE ungated router
// (client-calendar.route.js) and is NOT mounted here.
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

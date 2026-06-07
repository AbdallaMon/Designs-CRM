// calendar/availability routes — the staff availability/slots + meeting/call month-view
// surface. Legacy: routes/calendar/calendar.js (the SHARED router, double-mounted at
// `/shared/calendar` and `/shared/calendar-management`). Mounted under the v2 calendar
// aggregate (→ `/v2/calendar/*` and `/v2/calendar-management/*`). Authentication is mounted
// ONCE at the calendar aggregate router; each route declares its CALENDAR.* permission code
// (granted to EVERY authed role via CALENDAR_AUTHED — exactly reproducing the legacy SHARED
// gate).
//
// SCOPE: legacy availability rows / month-views have NO per-owner object scope (any authed
// user could read/mutate any adminId's availability via a query param; the month-view
// filters by role INSIDE the service). There is no per-record owner to scope-check, so the
// permission CODE is the gate — matching legacy exactly. No `requireSpecialChecker` is wired.
//
// PATHS are preserved 1:1 vs legacy calendar.js (no renames; these are plain reads/writes,
// not workflow status changes):
//   GET    available-days        GET  slots
//   POST   available-days        POST available-days/multiple
//   DELETE days/:id              DELETE slots/:id
//   GET    dates/month           GET  dates/day
// ROUTE ORDER: `available-days/multiple` is declared BEFORE the bare `available-days` POST
// is irrelevant (different verb), but the literal paths are declared before none conflict.
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { availabilityController } from "./availability.controller.js";
import { AvailabilityValidation } from "./availability.validation.js";

const P = PERMISSIONS.CALENDAR;
const router = Router();

// ── reads ──────────────────────────────────────────────────────────────────────────
router.get(
  "/available-days",
  AuthMiddleware.requirePermissions([P.VIEW]),
  asyncHandler(availabilityController.getAvailableDays),
);
router.get(
  "/slots",
  AuthMiddleware.requirePermissions([P.VIEW]),
  asyncHandler(availabilityController.getSlots),
);
router.get(
  "/dates/month",
  AuthMiddleware.requirePermissions([P.VIEW]),
  asyncHandler(availabilityController.getCalendarMonth),
);
router.get(
  "/dates/day",
  AuthMiddleware.requirePermissions([P.VIEW]),
  asyncHandler(availabilityController.getRemindersForDay),
);

// ── availability writes ──────────────────────────────────────────────────────────────
router.post(
  "/available-days/multiple",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AvailabilityValidation.createMultipleDays),
  asyncHandler(availabilityController.createMultipleDays),
);
router.post(
  "/available-days",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AvailabilityValidation.createDay),
  asyncHandler(availabilityController.createDay),
);
router.delete(
  "/days/:id",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AvailabilityValidation.idParams, "params"),
  asyncHandler(availabilityController.deleteDay),
);
router.delete(
  "/slots/:id",
  AuthMiddleware.requirePermissions([P.MANAGE]),
  validate(AvailabilityValidation.idParams, "params"),
  asyncHandler(availabilityController.deleteSlot),
);

export { router as availabilityRouter };

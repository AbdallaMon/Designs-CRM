// calendar/client routes — the PUBLIC client booking surface. Legacy:
// routes/calendar/client-calendar.js, mounted at `/client/calendar` via
// routes/clients/clients.js with NO authentication middleware (the clients router has no
// router-level auth; each client route authenticates the client by its own means — here a
// per-meeting token). Mounted under v2 at `/v2/client/calendar`.
//
// PUBLIC BY DESIGN — NO `requireAuth`, NO `requirePermissions`, NO permission code. Every
// endpoint is token-based (MeetingReminder.token) exactly like the booking funnel and
// /files/client/*. Gating these would break the public client booking flow (a prospective
// client has no session). The token is verified inside the usecase via the frozen
// verifyAndExtractCalendarToken service; reminderId/clientLeadId/adminId are derived from the
// token, never trusted from the body.
//
// PATHS preserved 1:1 vs legacy:
//   GET  /meeting-data    GET /available-days    GET /slots    GET /slots/details
//   POST /book            GET /timezones
import { Router } from "express";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { clientCalendarController } from "./client-calendar.controller.js";
import { ClientCalendarValidation } from "./client-calendar.validation.js";

const router = Router();

// ── public reads ─────────────────────────────────────────────────────────────────────
router.get("/meeting-data", asyncHandler(clientCalendarController.meetingData));
router.get("/available-days", asyncHandler(clientCalendarController.availableDays));
// `/slots/details` MUST be declared before `/slots` so the literal sub-path wins.
router.get("/slots/details", asyncHandler(clientCalendarController.slotDetails));
router.get("/slots", asyncHandler(clientCalendarController.slots));
router.get("/timezones", asyncHandler(clientCalendarController.timezones));

// ── public booking write ───────────────────────────────────────────────────────────────
router.post("/book", validate(ClientCalendarValidation.book), asyncHandler(clientCalendarController.book));

export { router as clientCalendarRouter };

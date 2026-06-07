// leads/lead routes — the authenticated lead-management surface (legacy
// `/shared/client-leads`). Mounted under `/v2/leads` (legacy router stays mounted in
// parallel during the strangler window). Auth once at the router; each route declares
// its permission code(s); every object-scoped `/:id/...` route ALSO carries the
// object-scope checker (requireSpecialChecker) — this is the IDOR fix the legacy
// routes lacked. The status change moves from `PUT /:id/status` to
// `POST /:id/actions/change-status` per the workflow convention.
//
// ROUTE ORDER: literal paths are declared BEFORE the `/:id` catch-all so they are not
// shadowed (Express matches in declaration order).
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { leadController } from "./lead.controller.js";
import { LeadValidation } from "./lead.validation.js";

const P = PERMISSIONS.LEAD;
const router = Router();

router.use(AuthMiddleware.requireAuth);

// ── list surfaces (pool-scoped reads; no object-scope checker — these are lists) ──
router.get("/", AuthMiddleware.requirePermissions([P.LIST]), asyncHandler(leadController.list));
router.get("/deals", AuthMiddleware.requirePermissions([P.LIST]), asyncHandler(leadController.deals));
router.get("/columns", AuthMiddleware.requirePermissions([P.LIST]), asyncHandler(leadController.columns));
router.get("/calls", AuthMiddleware.requirePermissions([P.LIST]), asyncHandler(leadController.listCalls));
router.get("/meetings", AuthMiddleware.requirePermissions([P.LIST]), asyncHandler(leadController.listMeetings));

// ── assign / convert (collection-level mutations) ────────────────────────────────
router.put(
  "/bulk-convert",
  AuthMiddleware.requirePermissions([P.ASSIGN_OTHER]),
  validate(LeadValidation.bulkConvert),
  asyncHandler(leadController.bulkConvert),
);
router.put(
  "/convert",
  AuthMiddleware.requirePermissions([P.CONVERT]),
  validate(LeadValidation.convert),
  asyncHandler(leadController.convert),
);
// PUT / — assign to self (ASSIGN_SELF) OR to another user (ASSIGN_OTHER, admin-tier).
// The usecase enforces the self-vs-other split exactly as legacy did.
router.put(
  "/",
  AuthMiddleware.requirePermissions([], [P.ASSIGN_SELF, P.ASSIGN_OTHER]),
  validate(LeadValidation.assign),
  asyncHandler(leadController.assign),
);

// ── meeting-reminder sub-resources (literal-prefixed; before /:id) ────────────────
router.get(
  "/meeting-reminders/:meetingId",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(LeadValidation.meetingIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanAccessMeetingReminder),
  asyncHandler(leadController.getMeetingById),
);
router.put(
  "/meeting-reminders/:id",
  AuthMiddleware.requirePermissions([P.MEETING_MANAGE]),
  validate(LeadValidation.reminderIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanMutateMeetingReminder),
  validate(LeadValidation.updateMeeting),
  asyncHandler(leadController.updateMeeting),
);

// ── call-reminder sub-resources ────────────────────────────────────────────────
router.put(
  "/call-reminders/:id",
  AuthMiddleware.requirePermissions([P.CALL_MANAGE]),
  validate(LeadValidation.reminderIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanMutateCallReminder),
  validate(LeadValidation.updateCall),
  asyncHandler(leadController.updateCall),
);

// ── price-offer status change (body carries priceOfferId) ────────────────────────
router.post(
  "/price-offers/change-status",
  AuthMiddleware.requirePermissions([P.PRICE_OFFER_MANAGE]),
  validate(LeadValidation.changePriceOfferStatus),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanMutatePriceOffer),
  asyncHandler(leadController.changePriceOfferStatus),
);

// ── allowed-to-take-country check (literal :userId before /:id is fine — distinct
//    method: POST) ──────────────────────────────────────────────────────────────
router.post(
  "/:userId/countries",
  AuthMiddleware.requirePermissions([P.COUNTRY_CHECK]),
  validate(LeadValidation.userIdParams, "params"),
  validate(LeadValidation.countryCheck),
  asyncHandler(leadController.checkCountry),
);

// ── field updates ────────────────────────────────────────────────────────────────
router.put(
  "/update/:id",
  AuthMiddleware.requirePermissions([P.EDIT]),
  validate(LeadValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanMutateLead),
  validate(LeadValidation.fieldUpdate),
  asyncHandler(leadController.updateField),
);
router.put(
  "/lead/update/:id",
  AuthMiddleware.requirePermissions([P.EDIT]),
  validate(LeadValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanMutateLead),
  validate(LeadValidation.fieldUpdate),
  asyncHandler(leadController.updateField),
);

// ── lead detail (object-scoped READ) ─────────────────────────────────────────────
router.get(
  "/:id",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(LeadValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanAccessLead),
  asyncHandler(leadController.getById),
);

// ── status change → workflow action (was PUT /:id/status) ────────────────────────
router.post(
  "/:id/actions/change-status",
  AuthMiddleware.requirePermissions([P.CHANGE_STATUS]),
  validate(LeadValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanMutateLead),
  validate(LeadValidation.changeStatus),
  asyncHandler(leadController.changeStatus),
);

// ── meeting reminders for a lead ─────────────────────────────────────────────────
router.get(
  "/:clientLeadId/meeting-reminders",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(LeadValidation.clientLeadIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanAccessLead),
  asyncHandler(leadController.getMeetingRemindersByLead),
);
router.post(
  "/:id/meeting-reminders/token",
  AuthMiddleware.requirePermissions([P.MEETING_MANAGE]),
  validate(LeadValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanMutateLead),
  validate(LeadValidation.createMeeting),
  asyncHandler(leadController.createMeetingWithToken),
);
router.post(
  "/:id/meeting-reminders",
  AuthMiddleware.requirePermissions([P.MEETING_MANAGE]),
  validate(LeadValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanMutateLead),
  validate(LeadValidation.createMeeting),
  asyncHandler(leadController.createMeeting),
);

// ── call reminders for a lead ────────────────────────────────────────────────────
router.post(
  "/:id/call-reminders",
  AuthMiddleware.requirePermissions([P.CALL_MANAGE]),
  validate(LeadValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanMutateLead),
  validate(LeadValidation.createCall),
  asyncHandler(leadController.createCall),
);

// ── price offers / payments / files / notes ──────────────────────────────────────
router.post(
  "/:id/price-offers",
  AuthMiddleware.requirePermissions([P.PRICE_OFFER_MANAGE]),
  validate(LeadValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanMutateLead),
  validate(LeadValidation.createPriceOffer),
  asyncHandler(leadController.createPriceOffer),
);
router.post(
  "/:id/payments",
  AuthMiddleware.requirePermissions([P.PAYMENT_MANAGE]),
  validate(LeadValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanMutateLead),
  validate(LeadValidation.makePayments),
  asyncHandler(leadController.makePayments),
);
router.post(
  "/:id/files",
  AuthMiddleware.requirePermissions([P.FILE_MANAGE]),
  validate(LeadValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanMutateLead),
  validate(LeadValidation.createFile),
  asyncHandler(leadController.createFile),
);
router.post(
  "/:id/notes",
  AuthMiddleware.requirePermissions([P.NOTE_MANAGE]),
  validate(LeadValidation.idParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanMutateLead),
  validate(LeadValidation.createNote),
  asyncHandler(leadController.createNote),
);

// ── reminder triggers (payment / complete-register) ──────────────────────────────
router.post(
  "/:clientLeadId/payment-reminder",
  AuthMiddleware.requirePermissions([P.REMINDER_SEND]),
  validate(LeadValidation.clientLeadIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanMutateLead),
  asyncHandler(leadController.sendPaymentReminder),
);
router.post(
  "/:clientLeadId/complete-register",
  AuthMiddleware.requirePermissions([P.REMINDER_SEND]),
  validate(LeadValidation.clientLeadIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(leadController.checkIfUserCanMutateLead),
  asyncHandler(leadController.sendCompleteRegisterReminder),
);

export { router as leadRouter };

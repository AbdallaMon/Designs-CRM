// leads/client/public-lead routes — the PUBLIC website lead funnel. Legacy
// `routes/client/leads.js`, mounted PATHLESS under `/client` via `routes/clients/clients.js`
// with NO auth. Mounted under v2 at `/v2/client/leads` (paths below preserved 1:1 underneath).
//
// PUBLIC BY DESIGN — NO user login is required. Draft continuation is instead authorized by
// a short-lived, purpose-scoped capability bound to the lead ID; email/phone alone never grant
// draft or upload access.
//
// This is DISTINCT from `/v2/client/booking-leads` (the step-based booking draft funnel) —
// these are the category/item/price website submissions. No overlap (see report).
//
// Light per-IP rate limiting reuses the booking funnel's limiters (abuse hardening only; does
// not change observable behavior for legitimate submissions).
import { Router } from "express";
import { asyncHandler } from "../../../../shared/middlewares/async-handler.js";
import { validate } from "../../../../shared/middlewares/validate.middleware.js";
import { publicLeadController } from "./public-lead.controller.js";
import { PublicLeadValidation } from "./public-lead.validation.js";
import { AuthMiddleware } from "../../../../shared/middlewares/auth.middleware.js";
import {
  createLeadLimiter,
  generalLeadLimiter,
  submitLeadLimiter,
} from "../booking-lead/booking-lead.rate-limiter.js";

const router = Router();

router.post(
  "/new-lead",
  createLeadLimiter,
  validate(PublicLeadValidation.newLead),
  asyncHandler(publicLeadController.createLead),
);

router.post(
  "/new-lead/register",
  createLeadLimiter,
  validate(PublicLeadValidation.registerLead),
  asyncHandler(publicLeadController.registerLead),
);

router.get(
  "/new-lead/register-status/:leadId",
  generalLeadLimiter,
  validate(PublicLeadValidation.leadIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(publicLeadController.authorizeCompleteRegister),
  asyncHandler(publicLeadController.getRegistrationStatus),
);

router.post(
  "/new-lead/complete-register/:leadId",
  submitLeadLimiter,
  validate(PublicLeadValidation.leadIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(publicLeadController.authorizeCompleteRegister),
  validate(PublicLeadValidation.completeRegister),
  asyncHandler(publicLeadController.completeRegister),
);

router.post(
  "/cooperation-requests",
  createLeadLimiter,
  validate(PublicLeadValidation.cooperationRequest),
  asyncHandler(publicLeadController.createCooperationRequest),
);

export { router as publicLeadRouter };

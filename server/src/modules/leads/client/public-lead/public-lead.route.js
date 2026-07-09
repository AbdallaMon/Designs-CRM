// leads/client/public-lead routes — the PUBLIC website lead funnel. Legacy
// `routes/client/leads.js`, mounted PATHLESS under `/client` via `routes/clients/clients.js`
// with NO auth. Mounted under v2 at `/v2/client/leads` (paths below preserved 1:1 underneath).
//
// PUBLIC BY DESIGN — NO requireAuth / requirePermissions / permission code. A prospective
// website visitor has no session; identity is the email/phone in the body, exactly like the
// booking funnel and `/files/client/*`. Gating these would break the public website forms.
//
// This is DISTINCT from `/v2/client/booking-leads` (the step-based booking draft funnel) —
// these are the category/item/price website submissions. No overlap (see report).
//
// Light per-IP rate limiting reuses the booking funnel's limiters (abuse hardening only; does
// not change observable behavior for legitimate submissions).
import { Router } from "express";
import { asyncHandler } from "../../../../shared/middlewares/async-handler.js";
import { validate } from "../../../../shared/middlewares/validate.middleware.js";
import { publicLeadController as c } from "./public-lead.controller.js";
import { PublicLeadValidation as V } from "./public-lead.validation.js";
import {
  createLeadLimiter,
  generalLeadLimiter,
} from "../booking-lead/booking-lead.rate-limiter.js";

const router = Router();

router.post(
  "/new-lead",
  createLeadLimiter,
  validate(V.newLead),
  asyncHandler(c.createLead),
);

router.post(
  "/new-lead/register",
  createLeadLimiter,
  validate(V.registerLead),
  asyncHandler(c.registerLead),
);

router.post(
  "/new-lead/complete-register/:leadId",
  generalLeadLimiter,
  validate(V.leadIdParams, "params"),
  validate(V.completeRegister),
  asyncHandler(c.completeRegister),
);

router.post(
  "/cooperation-requests",
  generalLeadLimiter,
  validate(V.cooperationRequest),
  asyncHandler(c.cooperationRequest),
);

export { router as publicLeadRouter };

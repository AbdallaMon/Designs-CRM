import { Router } from "express";
import { bookingLeadsController } from "./booking-leads.controller.js";
import { asyncHandler } from "../../../../shared/middlewares/async-handler.js";
import { validate } from "../../../../shared/middlewares/validate.middleware.js";
import { bookingLeadSchemas } from "./booking-leads.validation.js";
import { AuthMiddleware } from "../../../../shared/middlewares/auth.middleware.js";
import {
  createLeadLimiter,
  generalLeadLimiter,
  submitLeadLimiter,
} from "./booking-leads.middleware.js";

const bookingLeadsRouter = Router();

bookingLeadsRouter.post(
  "/",
  createLeadLimiter,
  validate(bookingLeadSchemas.createBookingLead),
  asyncHandler(bookingLeadsController.createBookingLead),
);
bookingLeadsRouter.get(
  "/:leadId",
  generalLeadLimiter,
  validate(bookingLeadSchemas.leadIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(bookingLeadsController.authorizeBookingLead),
  asyncHandler(bookingLeadsController.getBookingLead),
);
bookingLeadsRouter.patch(
  "/:leadId",
  generalLeadLimiter,
  validate(bookingLeadSchemas.leadIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(bookingLeadsController.authorizeBookingLead),
  validate(bookingLeadSchemas.patchBookingLead),
  asyncHandler(bookingLeadsController.updateBookingLead),
);
bookingLeadsRouter.post(
  "/:leadId/actions/submit",
  submitLeadLimiter,
  validate(bookingLeadSchemas.leadIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(bookingLeadsController.authorizeBookingLead),
  validate(bookingLeadSchemas.submitBookingLead),
  asyncHandler(bookingLeadsController.submitBookingLead),
);

export { bookingLeadsRouter };

import { Router } from "express";
import { bookingLeadsController } from "./booking-leads.controller.js";
import { asyncHandler } from "../../../../shared/middlewares/async-handler.js";
import { validate } from "../../../../shared/middlewares/validate.middleware.js";
import { bookingLeadSchemas } from "./booking-leads.validation.js";
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
  asyncHandler(bookingLeadsController.getBookingLead),
);
bookingLeadsRouter.patch(
  "/:leadId",
  generalLeadLimiter,
  validate(bookingLeadSchemas.leadIdParams, "params"),
  validate(bookingLeadSchemas.patchBookingLead),
  asyncHandler(bookingLeadsController.updateBookingLead),
);
bookingLeadsRouter.put(
  "/:leadId/submit",
  submitLeadLimiter,
  validate(bookingLeadSchemas.leadIdParams, "params"),
  validate(bookingLeadSchemas.submitBookingLead),
  asyncHandler(bookingLeadsController.submitBookingLead),
);

export { bookingLeadsRouter };

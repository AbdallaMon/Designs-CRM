import { Router } from "express";
import { BookingLeadsRepository } from "./booking-leads.repository.js";
import { BookingLeadsUsecase } from "./booking-leads.usecase.js";
import { BookingLeadsController } from "./booking-leads.controller.js";
import { asyncHandler } from "../../../../shared/middlewares/async-handler.js";
import { validate } from "../../../../shared/middlewares/validate.middleware.js";
import { bookingLeadSchemas } from "./booking-leads.validation.js";
import {
  createLeadLimiter,
  generalLeadLimiter,
  submitLeadLimiter,
} from "./booking-leads.middleware.js";

const bookingLeadsRepository = new BookingLeadsRepository();
const bookingLeadsUsecase = new BookingLeadsUsecase(bookingLeadsRepository);
const bookingLeadsController = new BookingLeadsController(bookingLeadsUsecase);

const bookingLeadsRouter = Router();

bookingLeadsRouter.post(
  "/",
  createLeadLimiter,
  validate(bookingLeadSchemas.createBookingLead),
  asyncHandler(bookingLeadsController.create),
);
bookingLeadsRouter.get(
  "/:leadId",
  generalLeadLimiter,
  validate(bookingLeadSchemas.leadIdParams, "params"),
  asyncHandler(bookingLeadsController.get),
);
bookingLeadsRouter.patch(
  "/:leadId",
  generalLeadLimiter,
  validate(bookingLeadSchemas.leadIdParams, "params"),
  validate(bookingLeadSchemas.patchBookingLead),
  asyncHandler(bookingLeadsController.update),
);
bookingLeadsRouter.put(
  "/:leadId/submit",
  submitLeadLimiter,
  validate(bookingLeadSchemas.leadIdParams, "params"),
  validate(bookingLeadSchemas.submitBookingLead),
  asyncHandler(bookingLeadsController.submit),
);

export { bookingLeadsRouter };

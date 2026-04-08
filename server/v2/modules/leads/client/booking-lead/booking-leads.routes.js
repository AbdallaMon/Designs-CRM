import { Router } from "express";
import { BookingLeadsRepository } from "./booking-leads.repository.js";
import { BookingLeadsUsecase } from "./booking-leads.usecase.js";
import { BookingLeadsController } from "./booking-leads.controller.js";
import {
  createLeadLimiter,
  generalLeadLimiter,
  submitLeadLimiter,
} from "./booking-lead.rate-limiter.js";

const bookingLeadsRepository = new BookingLeadsRepository();
const bookingLeadsUsecase = new BookingLeadsUsecase(bookingLeadsRepository);
const bookingLeadsController = new BookingLeadsController(bookingLeadsUsecase);

const bookingLeadsRouter = Router();

bookingLeadsRouter.post("/", createLeadLimiter, bookingLeadsController.create);
bookingLeadsRouter.get(
  "/:leadId",
  generalLeadLimiter,
  bookingLeadsController.get,
);
bookingLeadsRouter.patch(
  "/:leadId",
  generalLeadLimiter,
  bookingLeadsController.update,
);
bookingLeadsRouter.put(
  "/:leadId/submit",
  submitLeadLimiter,
  bookingLeadsController.submit,
);

export { bookingLeadsRouter };

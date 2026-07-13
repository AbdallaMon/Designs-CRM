import { ok, created } from "../../../../shared/http/response.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { isLeadField, isClientField } from "./booking-leads.validation.js";
import { bookingLeadsUsecase } from "./booking-leads.usecase.js";

class BookingLeadsController {
  async createBookingLead(req, res) {
    const lead = await bookingLeadsUsecase.createBookingLead(req.body);
    return created(res, lead, "Booking lead created successfully");
  }

  async getBookingLead(req, res) {
    const { leadId } = req.params;
    const lead = await bookingLeadsUsecase.getBookingLead(leadId);
    return ok(res, lead);
  }

  async updateBookingLead(req, res) {
    const { leadId } = req.params;

    // Extract the single field+value pair the usecase expects
    const definedEntries = Object.entries(req.body).filter(
      ([, v]) => v !== undefined,
    );
    if (definedEntries.length !== 1) {
      throw new AppError(
        "PATCH requires exactly one supported field per request",
        400,
      );
    }
    const [field, value] = definedEntries[0];
    if (!isLeadField(field) && !isClientField(field)) {
      throw new AppError(`${field} is not allowed`, 400);
    }

    const lead = await bookingLeadsUsecase.updateBookingLeadStep(leadId, {
      field,
      value,
    });
    return ok(res, lead);
  }

  async submitBookingLead(req, res) {
    const { leadId } = req.params;
    const lead = await bookingLeadsUsecase.submitBookingLead(leadId, req.body);
    return ok(
      res,
      lead,
      "Your request has been submitted successfully. Our team will contact you shortly.",
    );
  }
}

export const bookingLeadsController = new BookingLeadsController();
export { BookingLeadsController };

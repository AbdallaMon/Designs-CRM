import { ok, created } from "../../../../shared/http/response.js";
import { bookingLeadsUsecase } from "./booking-leads.usecase.js";
import { leadsMessagesCodes, messagesNames } from "@dms/shared";

const TK = messagesNames.leadsMessages;

class BookingLeadsController {
  async createBookingLead(req, res) {
    const lead = await bookingLeadsUsecase.createBookingLead(req.body);
    return created(res, lead, leadsMessagesCodes.BOOKING_LEAD_CREATED, TK);
  }

  async getBookingLead(req, res) {
    const { leadId } = req.params;
    const lead = await bookingLeadsUsecase.getBookingLead(leadId);
    return ok(res, lead);
  }

  async updateBookingLead(req, res) {
    const { leadId } = req.params;

    const [entry] = Object.entries(req.body).filter(
      ([, v]) => v !== undefined,
    );
    const [field, value] = entry;

    const lead = await bookingLeadsUsecase.updateBookingLeadStep(leadId, {
      field,
      value,
    });
    return ok(res, lead, leadsMessagesCodes.BOOKING_LEAD_UPDATED, TK);
  }

  async submitBookingLead(req, res) {
    const { leadId } = req.params;
    const lead = await bookingLeadsUsecase.submitBookingLead(leadId, req.body);
    return ok(res, lead, leadsMessagesCodes.BOOKING_LEAD_SUBMITTED, TK);
  }
}

export const bookingLeadsController = new BookingLeadsController();
export { BookingLeadsController };

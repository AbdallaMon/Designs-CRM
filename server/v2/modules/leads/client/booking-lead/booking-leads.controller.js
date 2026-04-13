import {
  validateCreateBookingLeadInput,
  validateLeadIdParam,
  validatePatchBookingLeadInput,
  validateSubmitBookingLeadInput,
} from "./booking-leads.validation.js";

function sendError(res, error) {
  const status = error.status || 500;
  const message = error.message || "Unexpected server error";

  res.status(status).json({ message });
}

export class BookingLeadsController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  create = async (req, res) => {
    try {
      const payload = validateCreateBookingLeadInput(req.body);
      const lead = await this.usecase.createBookingLead(payload);

      res.status(201).json(lead);
    } catch (error) {
      sendError(res, error);
    }
  };

  get = async (req, res) => {
    try {
      const leadId = validateLeadIdParam(req.params.leadId);
      const lead = await this.usecase.getBookingLead(leadId);

      res.status(200).json(lead);
    } catch (error) {
      sendError(res, error);
    }
  };

  update = async (req, res) => {
    try {
      const leadId = validateLeadIdParam(req.params.leadId);
      const payload = validatePatchBookingLeadInput(req.body);
      const lead = await this.usecase.updateBookingLeadStep(leadId, payload);

      res.status(200).json(lead);
    } catch (error) {
      sendError(res, error);
    }
  };

  submit = async (req, res) => {
    try {
      const leadId = validateLeadIdParam(req.params.leadId);
      const payload = validateSubmitBookingLeadInput(req.body);
      const lead = await this.usecase.submitBookingLead(leadId, payload);

      res.status(200).json({
        message:
          "Your request has been submitted successfully. Our team will contact you shortly.",
        lead,
      });
    } catch (error) {
      sendError(res, error);
    }
  };
}

import {
  createBookingLead,
  getBookingLead,
  submitBookingLead,
  updateBookingLeadStep,
} from "./booking-leads.usecase.js";
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

export async function createBookingLeadController(req, res) {
  try {
    const payload = validateCreateBookingLeadInput(req.body);
    const lead = await createBookingLead(payload);

    res.status(201).json(lead);
  } catch (error) {
    sendError(res, error);
  }
}

export async function getBookingLeadController(req, res) {
  try {
    const leadId = validateLeadIdParam(req.params.leadId);
    const lead = await getBookingLead(leadId);

    res.status(200).json(lead);
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateBookingLeadController(req, res) {
  try {
    const leadId = validateLeadIdParam(req.params.leadId);
    const payload = validatePatchBookingLeadInput(req.body);
    const lead = await updateBookingLeadStep(leadId, payload);

    res.status(200).json(lead);
  } catch (error) {
    sendError(res, error);
  }
}

export async function submitBookingLeadController(req, res) {
  try {
    const leadId = validateLeadIdParam(req.params.leadId);
    const payload = validateSubmitBookingLeadInput(req.body);
    const lead = await submitBookingLead(leadId, payload);

    res.status(200).json({
      message:
        "Your request has been submitted successfully. Our team will contact you shortly.",
      lead,
    });
  } catch (error) {
    sendError(res, error);
  }
}

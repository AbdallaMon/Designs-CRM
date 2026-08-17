import { PUBLIC_UPLOAD_PURPOSES, authMessagesCodes, messagesNames } from "@dms/shared";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/AppError.js";
import { JwtService } from "../security/jwt.js";

export const PUBLIC_FUNNEL_PURPOSES = Object.freeze({
  BOOKING_LEAD: "BOOKING_LEAD",
  PUBLIC_REGISTER: "PUBLIC_REGISTER",
  PUBLIC_LEAD_UPLOAD: PUBLIC_UPLOAD_PURPOSES.PUBLIC_LEAD,
});

function invalidCapability() {
  return new AppError({
    code: authMessagesCodes.INVALID_TOKEN,
    statusCode: 401,
    translationKey: messagesNames.authMessages,
  });
}

function normalizeLeadId(value) {
  const leadId = Number(value);
  return Number.isInteger(leadId) && leadId > 0 ? leadId : null;
}

export function issuePublicFunnelCapability({ purpose, leadId }) {
  const subject = normalizeLeadId(leadId);
  if (!subject || !Object.values(PUBLIC_FUNNEL_PURPOSES).includes(purpose)) {
    throw invalidCapability();
  }

  return {
    token: JwtService.signUploadCapability({ purpose, subject: String(subject) }),
    purpose,
    expiresIn: env.JWT_UPLOAD_EXPIRES_IN,
  };
}

export function verifyPublicFunnelCapability(token, { purpose, leadId } = {}) {
  if (!token) throw invalidCapability();

  let payload;
  try {
    payload = JwtService.verifyUploadCapability(token);
  } catch {
    throw invalidCapability();
  }

  const subject = normalizeLeadId(payload.subject);
  const expectedLeadId = leadId === undefined ? null : normalizeLeadId(leadId);
  if (
    !subject ||
    payload.purpose !== purpose ||
    (leadId !== undefined && subject !== expectedLeadId)
  ) {
    throw invalidCapability();
  }

  return { purpose: payload.purpose, leadId: subject };
}

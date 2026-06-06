import { mapTelegramPhone } from "./telegram.dto.js";

/**
 * Normalises the phoneNumber in req.body before validation runs.
 * Strips whitespace so the phone regex works reliably.
 */
export function normalizePhoneNumber(req, res, next) {
  if (req.body?.phoneNumber) {
    req.body.phoneNumber = mapTelegramPhone(req.body.phoneNumber);
  }
  next();
}

import rateLimit from "express-rate-limit";
import { rateLimitResponse } from "../../../../shared/http/rate-limit-response.js";

class BookingLeadRateLimit {
  static createLeadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: rateLimitResponse(),
  });

  static submitLeadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: rateLimitResponse(),
  });

  static generalLeadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: rateLimitResponse(),
  });
}

export const createLeadLimiter = BookingLeadRateLimit.createLeadLimiter;
export const submitLeadLimiter = BookingLeadRateLimit.submitLeadLimiter;
export const generalLeadLimiter = BookingLeadRateLimit.generalLeadLimiter;

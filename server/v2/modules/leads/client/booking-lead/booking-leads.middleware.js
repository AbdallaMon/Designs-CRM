import rateLimit from "express-rate-limit";

class BookingLeadRateLimit {
  static createLeadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many leads created, please try again later" },
  });

  static submitLeadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many submissions, please try again later" },
  });

  static generalLeadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later" },
  });
}

export const createLeadLimiter = BookingLeadRateLimit.createLeadLimiter;
export const submitLeadLimiter = BookingLeadRateLimit.submitLeadLimiter;
export const generalLeadLimiter = BookingLeadRateLimit.generalLeadLimiter;

import rateLimit from "express-rate-limit";

class AuthRateLimit {
  static loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: {
      success: false,
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many attempts. Please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  static forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
      success: false,
      code: "RATE_LIMIT_EXCEEDED",
      message:
        "Too many password reset requests. Please try again after 1 hour.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export { AuthRateLimit };

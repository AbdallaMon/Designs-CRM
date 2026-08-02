import rateLimit from "express-rate-limit";
import { rateLimitResponse } from "../../shared/http/rate-limit-response.js";

class AuthRateLimit {
  static loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: rateLimitResponse(),
    standardHeaders: true,
    legacyHeaders: false,
  });
  static forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: rateLimitResponse(),
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export { AuthRateLimit };

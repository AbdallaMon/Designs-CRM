import rateLimit from "express-rate-limit";
import { rateLimitResponse } from "../../shared/http/rate-limit-response.js";
import { authMessagesCodes } from "@dms/shared";

const authLimiter = ({ windowMs, max }) =>
  rateLimit({
    windowMs,
    max,
    message: rateLimitResponse(authMessagesCodes.RATE_LIMIT_EXCEEDED),
    standardHeaders: true,
    legacyHeaders: false,
  });

class AuthRateLimit {
  static loginLimiter = authLimiter({ windowMs: 15 * 60 * 1000, max: 10 });
  static forgotPasswordLimiter = authLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
  });
  static resetPasswordLimiter = authLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
  });
  static refreshLimiter = authLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
  });
}

export { AuthRateLimit };

import rateLimit from "express-rate-limit";
import { rateLimitResponse } from "../../shared/http/rate-limit-response.js";

export const publicUploadCapabilityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(),
});

export const publicUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(),
});

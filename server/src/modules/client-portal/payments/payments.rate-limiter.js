import rateLimit from "express-rate-limit";
import { rateLimitResponse } from "../../../shared/http/rate-limit-response.js";

export const checkoutCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(),
});

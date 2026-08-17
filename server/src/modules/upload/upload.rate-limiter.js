import rateLimit from "express-rate-limit";
import { rateLimitResponse } from "../../shared/http/rate-limit-response.js";
import { env } from "../../config/env.js";

export const publicUploadCapabilityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(),
});

export const publicUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(),
});

// Asset-heavy pages (especially image sessions) legitimately request hundreds of
// signed files. Keep a separate abuse ceiling so upload throttling cannot break them.
export const assetContentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.ASSET_CONTENT_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(),
});

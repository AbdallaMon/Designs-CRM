// Per-IP rate limiting for the PUBLIC client notes surface (abuse hardening only — does not
// change behavior for legitimate clients). The client portal has no login session, so these
// endpoints are only otherwise guarded by the per-session token object-scope check in the
// usecase; the limiter caps brute-force/spam attempts (e.g. probing selectedImageIds, flooding
// notes). Mirrors the booking-lead limiter pattern (express-rate-limit).
import rateLimit from "express-rate-limit";
import { rateLimitResponse } from "../../../shared/http/rate-limit-response.js";

// Writes are the sensitive path (each creates a Note authored as ADMIN). Keep it modest — a
// real client adds a handful of notes across a session.
export const clientNotesWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(),
});

// Reads happen on every notes-modal open; allow more but still bound enumeration attempts.
export const clientNotesReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(),
});

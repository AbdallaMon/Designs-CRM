import { env } from "./env.js";

const allowedOrigins = env.ALLOW_ORIGIN
  ? env.ALLOW_ORIGIN.split(",").map((o) => o.trim())
  : [];

export const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    // Some proxies concatenate duplicate Origin headers with commas
    if (typeof origin === "string" && origin.includes(",")) {
      origin = origin.split(",")[0].trim();
    }

    // Normalize trailing slashes
    if (origin.endsWith("/")) {
      origin = origin.slice(0, -1);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
};

// Fixes duplicated Origin headers injected by some reverse proxies (e.g. OpenLiteSpeed).
// Must be registered before cors() in app.js.
export function fixDuplicateOrigin(req, res, next) {
  if (req.rawHeaders) {
    const origins = [];
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      if (req.rawHeaders[i]?.toLowerCase() === "origin") {
        origins.push(req.rawHeaders[i + 1]);
      }
    }
    if (origins.length > 0) {
      req.headers.origin = origins[0];
    }
  }
  next();
}

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { corsOptions, fixDuplicateOrigin } from "./config/cors.js";
import {
  notFoundHandler,
  errorHandler,
} from "./shared/errors/error-handler.js";
import v2Routes from "./shared/routes.js";
import { authCsrfProtection } from "./shared/middlewares/auth-csrf.middleware.js";
import { normalizeAssetReferencesInBody } from "./shared/middlewares/asset-reference.middleware.js";

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
// Must run before all route middleware.
// 1. Fixes duplicated Origin headers injected by some reverse proxies (e.g. OpenLiteSpeed)
app.use(fixDuplicateOrigin);
app.use(cookieParser());
app.use(authCsrfProtection);
// Apply CORS after CSRF so browser-origin denials use the standard envelope.
app.use(cors(corsOptions));

// ─── Body parsing ─────────────────────────────────────────────────────────────
// Stripe signature verification requires the exact bytes before express.json mutates them.
app.use(
  "/v2/client/stripe/webhook",
  express.raw({ type: "application/json" }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(normalizeAssetReferencesInBody);

// ─── Static files ─────────────────────────────────────────────────────────────

// ─── Routes ───────────────────────────────────────────────────────────────────

// ─── Error handling ───────────────────────────────────────────────────────────

// ─── Routes ───────────────────────────────────────────────────────────────────
// Canonical modular API surface.
app.use("/v2", v2Routes);

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

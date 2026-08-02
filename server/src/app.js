import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { corsOptions, fixDuplicateOrigin } from "./config/cors.js";
import {
  notFoundHandler,
  errorHandler,
} from "./shared/errors/error-handler.js";
import v2Routes from "./shared/routes.js";
import { env } from "./config/env.js";

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
// Must run before all route middleware.
// 1. Fixes duplicated Origin headers injected by some reverse proxies (e.g. OpenLiteSpeed)
app.use(fixDuplicateOrigin);
// 2. Apply CORS policy
app.use(cors(corsOptions));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static files ─────────────────────────────────────────────────────────────

// ─── Routes ───────────────────────────────────────────────────────────────────

// ─── Error handling ───────────────────────────────────────────────────────────

// ─── Static uploads (local dev only) ─────────────────────────────────────────
if (env.ISLOCAL) {
  app.use(
    "/uploads",
    express.static("C:/home/dreamstudiio.com/public_html/uploads"),
  );
} else {
  app.use("/uploads", express.static(env.UPLOADS_PATH));
}

// ─── Routes ───────────────────────────────────────────────────────────────────
// Canonical modular API surface.
app.use("/v2", v2Routes);

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

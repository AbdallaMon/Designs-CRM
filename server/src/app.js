import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { corsOptions, fixDuplicateOrigin } from "./config/cors.js";
import {
  notFoundHandler,
  errorHandler,
} from "./shared/errors/error-handler.js";
import clientsRoutes from "../routes/clients/clients.js";
import authRoutes from "../routes/auth/auth.js";
import sharedRoutes from "../routes/shared/index.js";
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

app.use("/uploads", express.static(env.UPLOADS_PATH));

// ─── Routes ───────────────────────────────────────────────────────────────────

// ─── Error handling ───────────────────────────────────────────────────────────

// ─── Static uploads (local dev only) ─────────────────────────────────────────
if (env.ISLOCAL) {
  app.use(
    "/uploads",
    express.static("E:/home/dreamstudiio.com/public_html/uploads"),
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────
// Cutover: the /utility, /staff, /admin and /accountant legacy routers were unmounted
// (their @role dashboard frontend is gone). The files remain on disk (reversible).
// /shared and /client stay mounted until legacy client-chat is migrated to v2.
app.use("/shared", sharedRoutes);
app.use("/client", clientsRoutes);
app.use("/v2", v2Routes);

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

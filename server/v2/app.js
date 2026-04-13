import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

// Route imports
import clientsRoutes from "../routes/clients/clients.js";
import authRoutes from "../routes/auth/auth.js";
import sharedRoutes from "../routes/shared/index.js";
import utilityRoutes from "../routes/utility/utility.js";
import staffRoutes from "../routes/staff/staff.js";
import adminRoutes from "../routes/admin/admin.js";
import accountantRoutes from "../routes/accountant/accountant.js";
import v2Routes from "./shared/routes.js";
import { errorHandler } from "./shared/errors/error-handler.js";
import { corsOptions, fixDuplicateOrigin } from "./config/cors.js";
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

// ─── Static uploads (local dev only) ─────────────────────────────────────────
if (env.ISLOCAL) {
  app.use(
    "/uploads",
    express.static("E:/home/dreamstudiio.com/public_html/uploads"),
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/auth", (req, res) => authRoutes(req, res));
app.use("/shared", sharedRoutes);
app.use("/utility", utilityRoutes);
app.use("/staff", staffRoutes);
app.use("/admin", adminRoutes);
app.use("/accountant", accountantRoutes);
app.use("/client", clientsRoutes);
app.use("/v2", v2Routes);

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;

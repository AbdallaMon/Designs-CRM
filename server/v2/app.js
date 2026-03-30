import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./config/env.js";
import { corsOptions, fixDuplicateOrigin } from "./config/cors.js";
import { router } from "./routes.js";
import {
  notFoundHandler,
  errorHandler,
} from "./shared/errors/error-handler.js";

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────

app.use(fixDuplicateOrigin);
app.use(cors(corsOptions));

// ─── Body parsers ─────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static files ─────────────────────────────────────────────────────────────

app.use("/uploads", express.static(env.UPLOADS_PATH));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/v2", router);

// ─── Error handling ───────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

export { app };

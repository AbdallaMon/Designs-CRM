import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./config/env.js";
import { router } from "./routes.js";
import {
  notFoundHandler,
  errorHandler,
} from "./shared/errors/error-handler.js";

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────

const allowedOrigins = env.ALLOW_ORIGIN
  ? env.ALLOW_ORIGIN.split(",").map((o) => o.trim())
  : [];

const corsOptions = {
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

// Fix duplicated Origin headers from proxies — must be before cors()
app.use((req, res, next) => {
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
});

app.use(cors(corsOptions));

// ─── Body parsers ─────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static files ─────────────────────────────────────────────────────────────

if (env.ISLOCAL) {
  app.use("/uploads", express.static("E:/home/dreamstudiio.com/public_html/uploads"));
} else {
  app.use("/uploads", express.static("uploads"));
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/v2", router);

// ─── Error handling ───────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

export { app };

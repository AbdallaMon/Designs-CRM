import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  EMAIL_USERNAME: process.env.EMAIL_USERNAME,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  CLIENT_EMAIL_FROM: process.env.CLIENT_EMAIL_FROM,
  TELE_API_ID: Number(process.env.TELE_API_ID),
  TELE_API_HASH: process.env.TELE_API_HASH,
  TELEGRAM_SESSION: process.env.TELEGRAM_SESSION,
  BACKFILL_SECRET: process.env.BACKFILL_SECRET,
  ALLOWED_DOMAINS: process.env.ALLOWED_DOMAINS,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  ISLOCAL: process.env.ISLOCAL === "true",
  SERVER_URL: process.env.SERVER_URL,
  // Per-frontend public domains (link/asset building).
  CRM_DOMAIN: process.env.CRM_DOMAIN,
  PORTFOLIO_DOMAIN: process.env.PORTFOLIO_DOMAIN,
  CRM_ORIGIN: process.env.CRM_ORIGIN,
  DASHBOARD_ORIGIN: process.env.DASHBOARD_ORIGIN,
  COURSES_ORIGIN: process.env.COURSES_ORIGIN,
  PORTFOLIO_ORIGIN: process.env.PORTFOLIO_ORIGIN,
  CONTACT_ORIGIN: process.env.CONTACT_ORIGIN,
  BOOKING_ORIGIN: process.env.BOOKING_ORIGIN,
  ALLOW_ORIGIN: process.env.ALLOW_ORIGIN,
  UPLOADS_PATH: process.env.UPLOADS_PATH || "uploads",
  JWT_RESET_SECRET: process.env.JWT_RESET_SECRET,
  JWT_RESET_EXPIRES_IN: process.env.JWT_RESET_EXPIRES_IN || "1h",
  JWT_UPLOAD_SECRET:
    process.env.JWT_UPLOAD_SECRET ||
    process.env.JWT_RESET_SECRET ||
    process.env.JWT_ACCESS_SECRET,
  JWT_UPLOAD_EXPIRES_IN: process.env.JWT_UPLOAD_EXPIRES_IN || "10m",
  REDIS_HOST: process.env.REDIS_HOST || "127.0.0.1",
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
  REDIS_USERNAME: process.env.REDIS_USERNAME || undefined,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  TEMP_UPLOAD_DIR: process.env.TEMP_UPLOAD_DIR || "uploads/temp",
  THUMBNAIL_DIR: process.env.THUMBNAIL_DIR || "uploads/thumb",
  MAX_FILE_SIZE: Number(process.env.MAX_FILE_SIZE) || 1024 * 1024 * 1024,
  MAX_FILE_SIZE_FOR_CLIENT:
    Number(process.env.MAX_FILE_SIZE_FOR_CLIENT) || 100 * 1024 * 1024,
  // Runtime ownership flags for the server bootstrap. Default ON (single-instance).
  // On a multi-instance deploy set these to "false" on every instance except the one
  // designated to own BullMQ workers / cron, so jobs are not run / fired more than once.
  RUN_WORKERS: process.env.RUN_WORKERS !== "false",
  RUN_CRON: process.env.RUN_CRON !== "false",
};
// Per-frontend CORS origins (fallback when ALLOW_ORIGIN is unset). One per site.
export const allowedOrigins = [
  env.CRM_ORIGIN,
  env.DASHBOARD_ORIGIN,
  env.COURSES_ORIGIN,
  env.PORTFOLIO_ORIGIN,
  env.CONTACT_ORIGIN,
  env.BOOKING_ORIGIN,
];

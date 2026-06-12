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
  EMAIL_USERNAME: process.env.EMAIL_USERNAME,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  AHMED_EMAIL: process.env.AHMED_EMAIL,
  FTP_HOST: process.env.FTP_HOST,
  FTP_USER: process.env.FTP_USER,
  FTP_PASSWORD: process.env.FTP_PASSWORD,
  FTP_PORT: Number(process.env.FTP_PORT),
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELE_API_ID: Number(process.env.TELE_API_ID),
  TELE_API_HASH: process.env.TELE_API_HASH,
  TELEGRAM_PHONE_NUMBER: process.env.TELEGRAM_PHONE_NUMBER,
  TELEGRAM_SESSION: process.env.TELEGRAM_SESSION,
  SECRET_KEY: process.env.SECRET_KEY,
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
  COURSES_DOMAIN: process.env.COURSES_DOMAIN,
  ALLOW_ORIGIN: process.env.ALLOW_ORIGIN,
  UPLOADS_PATH: process.env.UPLOADS_PATH || "uploads",
  JWT_RESET_SECRET: process.env.JWT_RESET_SECRET,
  JWT_RESET_EXPIRES_IN: process.env.JWT_RESET_EXPIRES_IN || "1h",
  REDIS_HOST: process.env.REDIS_HOST || "127.0.0.1",
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  UPLOAD_DIR: process.env.UPLOAD_DIR,
  TEMP_UPLOAD_DIR: process.env.TEMP_UPLOAD_DIR,
  THUMBNAIL_DIR: process.env.THUMBNAIL_DIR,
  MAX_FILE_SIZE: Number(process.env.MAX_FILE_SIZE), // default 1GB
  MAX_FILE_SIZE_FOR_CLIENT: Number(process.env.MAX_FILE_SIZE_FOR_CLIENT), // default 100MB
  // Runtime ownership flags for the server bootstrap. Default ON (single-instance).
  // On a multi-instance deploy set these to "false" on every instance except the one
  // designated to own BullMQ workers / cron, so jobs are not run / fired more than once.
  RUN_WORKERS: process.env.RUN_WORKERS !== "false",
  RUN_CRON: process.env.RUN_CRON !== "false",
};
// Per-frontend CORS origins (fallback when ALLOW_ORIGIN is unset). One per site.
export const allowedOrigins = [
  process.env.CRM_ORIGIN,
  process.env.LEGACY_DASHBOARD_ORIGIN,
  process.env.COURSES_ORIGIN,
  process.env.PORTFOLIO_ORIGIN,
  process.env.CONTACT_ORIGIN,
  process.env.BOOKING_ORIGIN,
];

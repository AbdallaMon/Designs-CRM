import dotenv from "dotenv";
import os from "node:os";
import path from "node:path";

dotenv.config();

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const assetStorageRoot = path.resolve(
  process.env.ASSET_STORAGE_ROOT ||
    path.join(os.homedir(), ".dreamstudiio-crm", "storage"),
);
const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || path.join(assetStorageRoot, "uploads"),
);

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
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  BACKFILL_SECRET: process.env.BACKFILL_SECRET,
  ALLOWED_DOMAINS: process.env.ALLOWED_DOMAINS,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  INTEGRATION_CREDENTIALS_MASTER_KEY: process.env.INTEGRATION_CREDENTIALS_MASTER_KEY,
  ISLOCAL: process.env.ISLOCAL === "true",
  SERVER_URL: process.env.SERVER_URL,
  IMAGE_DOMAIN: process.env.IMAGE_DOMAIN,
  // Per-frontend public domains (link/asset building).
  CRM_DOMAIN: process.env.CRM_DOMAIN,
  PORTFOLIO_DOMAIN: process.env.PORTFOLIO_DOMAIN,
  DASHBOARD_ORIGIN: process.env.DASHBOARD_ORIGIN,
  COURSES_ORIGIN: process.env.COURSES_ORIGIN,
  PORTFOLIO_ORIGIN: process.env.PORTFOLIO_ORIGIN,
  CONTACT_ORIGIN: process.env.CONTACT_ORIGIN,
  BOOKING_ORIGIN: process.env.BOOKING_ORIGIN,
  ALLOW_ORIGIN: process.env.ALLOW_ORIGIN,
  ASSET_STORAGE_ROOT: assetStorageRoot,
  ASSET_DELIVERY_ORIGIN:
    process.env.ASSET_DELIVERY_ORIGIN || process.env.SERVER_URL,
  ASSET_URL_SIGNING_SECRET:
    process.env.ASSET_URL_SIGNING_SECRET ||
    (process.env.NODE_ENV === "production"
      ? undefined
      : process.env.JWT_UPLOAD_SECRET ||
        process.env.JWT_ACCESS_SECRET ||
        "development-only-asset-signing-secret"),
  ASSET_URL_TTL_SECONDS: positiveInteger(
    process.env.ASSET_URL_TTL_SECONDS,
    60 * 60,
  ),
  ASSET_EMAIL_URL_TTL_SECONDS: positiveInteger(
    process.env.ASSET_EMAIL_URL_TTL_SECONDS,
    7 * 24 * 60 * 60,
  ),
  ASSET_URL_MAX_TTL_SECONDS: positiveInteger(
    process.env.ASSET_URL_MAX_TTL_SECONDS,
    7 * 24 * 60 * 60,
  ),
  ASSET_CONTENT_RATE_LIMIT: positiveInteger(
    process.env.ASSET_CONTENT_RATE_LIMIT,
    3000,
  ),
  UPLOAD_LEGACY_ORIGINS: process.env.UPLOAD_LEGACY_ORIGINS || "",
  UPLOADS_PATH: process.env.UPLOADS_PATH || uploadDir,
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
  UPLOAD_DIR: uploadDir,
  TEMP_UPLOAD_DIR: path.resolve(
    process.env.TEMP_UPLOAD_DIR || path.join(assetStorageRoot, "temp"),
  ),
  THUMBNAIL_DIR: path.resolve(
    process.env.THUMBNAIL_DIR || path.join(uploadDir, "thumb"),
  ),
  MAX_FILE_SIZE: Number(process.env.MAX_FILE_SIZE) || 1024 * 1024 * 1024,
  MAX_FILE_SIZE_FOR_CLIENT:
    Number(process.env.MAX_FILE_SIZE_FOR_CLIENT) || 100 * 1024 * 1024,
  // Runtime ownership flags for the server bootstrap. Default ON (single-instance).
  // On a multi-instance deploy set these to "false" on every instance except the one
  // designated to own BullMQ workers / cron, so jobs are not run / fired more than once.
  RUN_WORKERS: process.env.RUN_WORKERS !== "false",
  RUN_CRON: process.env.RUN_CRON !== "false",
};
// Per-frontend CORS origins are always merged with the optional ALLOW_ORIGIN CSV.
export const allowedOrigins = [
  env.DASHBOARD_ORIGIN,
  env.COURSES_ORIGIN,
  env.PORTFOLIO_ORIGIN,
  env.CONTACT_ORIGIN,
  env.BOOKING_ORIGIN,
];

if (process.env.NODE_ENV === "production") {
  if (
    !env.ASSET_URL_SIGNING_SECRET ||
    env.ASSET_URL_SIGNING_SECRET.length < 32 ||
    env.ASSET_URL_SIGNING_SECRET.startsWith("REPLACE_")
  ) {
    throw new Error(
      "Production ASSET_URL_SIGNING_SECRET must be an independent secret of at least 32 characters",
    );
  }
  try {
    const deliveryUrl = new URL(env.ASSET_DELIVERY_ORIGIN);
    if (
      deliveryUrl.protocol !== "https:" ||
      deliveryUrl.username ||
      deliveryUrl.password ||
      deliveryUrl.pathname !== "/" ||
      deliveryUrl.search ||
      deliveryUrl.hash
    ) {
      throw new Error("HTTPS origin required");
    }
  } catch {
    throw new Error("Production ASSET_DELIVERY_ORIGIN must be a valid HTTPS origin");
  }
}

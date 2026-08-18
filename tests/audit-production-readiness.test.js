import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const productionEnv = {
  NODE_ENV: "production",
  DATABASE_URL: "mysql://user:password@localhost:3306/dream_studio_crm",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
  JWT_RESET_SECRET: "c".repeat(32),
  INTEGRATION_CREDENTIALS_MASTER_KEY: Buffer.alloc(32, 1).toString("base64"),
  ASSET_URL_SIGNING_SECRET: "d".repeat(32),
  SERVER_URL: "https://api.dreamstudiio.com",
  ASSET_DELIVERY_ORIGIN: "https://api.dreamstudiio.com",
  CRM_DOMAIN: "https://crm.dreamstudiio.com",
  DASHBOARD_ORIGIN: "https://crm.dreamstudiio.com",
  COURSES_ORIGIN: "https://courses.dreamstudiio.com",
  BOOKING_ORIGIN: "https://booking.dreamstudiio.com/register",
  ASSET_STORAGE_ROOT: "/home/dreamstudiio-storage",
  UPLOAD_DIR: "/home/dreamstudiio-storage/uploads",
  TEMP_UPLOAD_DIR: "/home/dreamstudiio-storage/uploads/temp",
  THUMBNAIL_DIR: "/home/dreamstudiio-storage/uploads/thumb",
  ASSET_URL_TTL_SECONDS: "3600",
  ASSET_EMAIL_URL_TTL_SECONDS: "604800",
  ASSET_URL_MAX_TTL_SECONDS: "604800",
};

function audit(extraEnv = {}) {
  return spawnSync(process.execPath, ["scripts/audit-production-readiness.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...productionEnv, ...extraEnv },
  });
}

describe("production upload-storage readiness", () => {
  it("does not require the temporary legacy directory after cutover", () => {
    const result = audit();
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain("LEGACY_UPLOAD_DIR");
  });

  it("validates LEGACY_UPLOAD_DIR when a migration source is configured", () => {
    const result = audit({ LEGACY_UPLOAD_DIR: "relative/uploads" });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("FAIL LEGACY_UPLOAD_DIR");
  });
});

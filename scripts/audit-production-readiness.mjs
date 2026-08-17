import path from "node:path";

const failures = [];
const warnings = [];

function placeholder(value) {
  return !value || /^(?:REPLACE_|CHANGE_ME|CHANGEME|TODO|EXAMPLE)/i.test(value);
}

function requireCheck(name, valid, remediation) {
  if (valid) console.log(`PASS ${name}`);
  else {
    failures.push({ name, remediation });
    console.log(`FAIL ${name}: ${remediation}`);
  }
}

function validHttpsOrigin(value) {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      !parsed.username &&
      !parsed.password &&
      parsed.pathname === "/" &&
      !parsed.search &&
      !parsed.hash
    );
  } catch {
    return false;
  }
}

function validHttpsBaseUrl(value) {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash
    );
  } catch {
    return false;
  }
}

function validBase64Key32(value) {
  if (placeholder(value) || !/^[A-Za-z0-9+/]+={0,2}$/u.test(value)) return false;
  try {
    return Buffer.from(value, "base64").length === 32;
  } catch {
    return false;
  }
}

function databaseName(value) {
  try {
    return decodeURIComponent(new URL(value).pathname.replace(/^\/+/, ""));
  } catch {
    return null;
  }
}

function isPosixChild(root, candidate) {
  if (!path.posix.isAbsolute(root) || !path.posix.isAbsolute(candidate)) return false;
  const relative = path.posix.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.posix.isAbsolute(relative));
}

requireCheck("NODE_ENV", process.env.NODE_ENV === "production", "set NODE_ENV=production");
requireCheck(
  "DATABASE_URL",
  !placeholder(process.env.DATABASE_URL) && databaseName(process.env.DATABASE_URL) === "dream_studio_crm",
  "point DATABASE_URL at the imported dream_studio_crm database",
);

for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "JWT_RESET_SECRET"]) {
  requireCheck(
    key,
    !placeholder(process.env[key]) && process.env[key].length >= 32,
    `set an independent ${key} value with at least 32 characters`,
  );
}

requireCheck(
  "INTEGRATION_CREDENTIALS_MASTER_KEY",
  validBase64Key32(process.env.INTEGRATION_CREDENTIALS_MASTER_KEY),
  "set a base64 value that decodes to exactly 32 bytes (openssl rand -base64 32)",
);
requireCheck(
  "ASSET_URL_SIGNING_SECRET",
  !placeholder(process.env.ASSET_URL_SIGNING_SECRET) &&
    process.env.ASSET_URL_SIGNING_SECRET.length >= 32,
  "set an independent secret with at least 32 characters (openssl rand -hex 32)",
);

for (const key of [
  "SERVER_URL",
  "ASSET_DELIVERY_ORIGIN",
  "CRM_DOMAIN",
  "DASHBOARD_ORIGIN",
  "COURSES_ORIGIN",
]) {
  requireCheck(key, validHttpsOrigin(process.env[key]), `set ${key} to an HTTPS origin without a path`);
}
requireCheck(
  "BOOKING_ORIGIN",
  validHttpsBaseUrl(process.env.BOOKING_ORIGIN),
  "set the HTTPS booking page base URL, including /register when used by Stripe redirects",
);

const storageRoot = process.env.ASSET_STORAGE_ROOT;
const uploadDir = process.env.UPLOAD_DIR;
requireCheck(
  "ASSET_STORAGE_ROOT",
  path.posix.isAbsolute(storageRoot || ""),
  "set an absolute production filesystem root such as /data",
);
requireCheck(
  "UPLOAD_DIR",
  isPosixChild(storageRoot || "", uploadDir || "") && uploadDir !== storageRoot,
  "set an absolute child of ASSET_STORAGE_ROOT such as /data/uploads",
);
for (const key of ["TEMP_UPLOAD_DIR", "THUMBNAIL_DIR"]) {
  requireCheck(
    key,
    isPosixChild(uploadDir || "", process.env[key] || "") && process.env[key] !== uploadDir,
    `set ${key} to a child of UPLOAD_DIR`,
  );
}
requireCheck(
  "LEGACY_UPLOAD_DIR",
  path.posix.isAbsolute(process.env.LEGACY_UPLOAD_DIR || "") &&
    !isPosixChild(storageRoot || "", process.env.LEGACY_UPLOAD_DIR || ""),
  "set the temporary old-store mount, such as /legacy-uploads",
);

const ttl = Number(process.env.ASSET_URL_TTL_SECONDS);
const emailTtl = Number(process.env.ASSET_EMAIL_URL_TTL_SECONDS);
const maxTtl = Number(process.env.ASSET_URL_MAX_TTL_SECONDS);
requireCheck(
  "asset URL TTLs",
  [ttl, emailTtl, maxTtl].every(Number.isInteger) &&
    ttl > 0 &&
    emailTtl > 0 &&
    maxTtl > 0 &&
    ttl <= maxTtl &&
    emailTtl <= maxTtl,
  "use positive integer TTLs and keep normal/email TTLs at or below the maximum",
);

if (process.env.FTP_PASSWORD) {
  warnings.push("FTP credentials are present but unused; rotate the exposed credential and remove it from deployment secrets.");
}
for (const warning of warnings) console.log(`WARN ${warning}`);

console.log(`SUMMARY failures=${failures.length} warnings=${warnings.length}`);
process.exitCode = failures.length > 0 ? 1 : 0;

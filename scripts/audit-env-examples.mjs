import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const pairs = [
  ["server/.env", ".env.example"],
  ["web/.env", "web/.env.example"],
  ["courses-web/.env.production", "courses-web/.env.example"],
  ["packages/db/prisma/.env", "packages/db/prisma/.env.example"],
];

const productionFiles = [
  {
    file: "server/.env.production",
    requiredKeys: [
      "NODE_ENV",
      "DATABASE_URL",
      "ASSET_STORAGE_ROOT",
      "UPLOAD_DIR",
      "TEMP_UPLOAD_DIR",
      "THUMBNAIL_DIR",
      "ASSET_DELIVERY_ORIGIN",
      "ASSET_URL_SIGNING_SECRET",
      "ASSET_URL_TTL_SECONDS",
      "ASSET_EMAIL_URL_TTL_SECONDS",
      "ASSET_URL_MAX_TTL_SECONDS",
      "ASSET_CONTENT_RATE_LIMIT",
      "UPLOAD_LEGACY_ORIGINS",
      "LEGACY_UPLOAD_DIR",
    ],
  },
];

function readKeys(file) {
  const content = readFileSync(resolve(file), "utf8");
  const keys = content
    .split(/\r?\n/u)
    .map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/u)?.[1])
    .filter(Boolean);

  const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
  return { keys, duplicates: [...new Set(duplicates)] };
}

let failed = false;

for (const [actualFile, exampleFile] of pairs) {
  if (!existsSync(actualFile) || !existsSync(exampleFile)) {
    failed = true;
    console.error(
      `FAIL ${actualFile} -> ${exampleFile}: missing ${[
        !existsSync(actualFile) ? actualFile : null,
        !existsSync(exampleFile) ? exampleFile : null,
      ]
        .filter(Boolean)
        .join(", ")}`,
    );
    continue;
  }

  const actual = readKeys(actualFile);
  const example = readKeys(exampleFile);
  const missing = actual.keys.filter((key) => !example.keys.includes(key));
  const extra = example.keys.filter((key) => !actual.keys.includes(key));
  const orderMatches = actual.keys.join("\n") === example.keys.join("\n");
  const matches =
    missing.length === 0 &&
    extra.length === 0 &&
    orderMatches &&
    actual.duplicates.length === 0 &&
    example.duplicates.length === 0;

  if (!matches) failed = true;
  console.log(`${matches ? "PASS" : "FAIL"} ${actualFile} -> ${exampleFile}`);
  console.log(`  actual keys (${actual.keys.length}): ${actual.keys.join(", ")}`);
  if (missing.length > 0) console.log(`  missing from example: ${missing.join(", ")}`);
  if (extra.length > 0) console.log(`  extra in example: ${extra.join(", ")}`);
  if (!orderMatches) console.log("  key order differs");
  if (actual.duplicates.length > 0)
    console.log(`  duplicate actual keys: ${actual.duplicates.join(", ")}`);
  if (example.duplicates.length > 0)
    console.log(`  duplicate example keys: ${example.duplicates.join(", ")}`);
}

for (const { file, requiredKeys } of productionFiles) {
  if (!existsSync(file)) {
    failed = true;
    console.error(`FAIL ${file}: file is missing`);
    continue;
  }

  const production = readKeys(file);
  const missing = requiredKeys.filter((key) => !production.keys.includes(key));
  const matches = missing.length === 0 && production.duplicates.length === 0;

  if (!matches) failed = true;
  console.log(`${matches ? "PASS" : "FAIL"} ${file} production requirements`);
  console.log(`  keys found: ${production.keys.length}`);
  if (missing.length > 0) console.log(`  missing required keys: ${missing.join(", ")}`);
  if (production.duplicates.length > 0)
    console.log(`  duplicate keys: ${production.duplicates.join(", ")}`);
}

process.exitCode = failed ? 1 : 0;

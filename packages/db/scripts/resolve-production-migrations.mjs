import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

export const RECONCILIATION_MIGRATIONS = Object.freeze([
  "20250118182131_init",
  "20250118223321_price_offer_url",
  "20250120212545_added_some_e_num",
  "20260612040000_catch_up_full_schema",
]);

const schemaPath = fileURLToPath(new URL("../prisma/schema.prisma", import.meta.url));
const migrationsPath = fileURLToPath(new URL("../prisma/migrations/", import.meta.url));
const require = createRequire(import.meta.url);
const prismaCliPath = require.resolve("prisma/build/index.js");

export function isAlreadyApplied(output = "") {
  return /\bP3008\b|already recorded as applied/i.test(output);
}

export function reconcileMigrationHistory({
  dryRun = false,
  run = spawnSync,
  output = console,
} = {}) {
  if (!existsSync(schemaPath)) {
    throw new Error(`Prisma schema not found: ${schemaPath}`);
  }

  for (const migration of RECONCILIATION_MIGRATIONS) {
    const migrationPath = new URL(`../prisma/migrations/${migration}/`, import.meta.url);
    if (!existsSync(fileURLToPath(migrationPath))) {
      throw new Error(`Migration directory not found: ${migration}`);
    }
  }

  if (dryRun) {
    output.log("Dry run: no database metadata was changed.");
    for (const migration of RECONCILIATION_MIGRATIONS) {
      output.log(`Would resolve as applied: ${migration}`);
    }
    return { resolved: 0, alreadyApplied: 0, dryRun: true };
  }

  let resolved = 0;
  let alreadyApplied = 0;
  output.log("Reconciling Prisma migration metadata only; migration SQL will not run.");
  output.log("Prerequisite: take a production backup and run db:status first.");
  output.log(`Schema: ${schemaPath}`);
  output.log(`Migrations: ${migrationsPath}`);

  for (const migration of RECONCILIATION_MIGRATIONS) {
    const result = run(
      process.execPath,
      [
        prismaCliPath,
        "migrate",
        "resolve",
        "--schema",
        schemaPath,
        "--applied",
        migration,
      ],
      {
        encoding: "utf8",
        env: process.env,
        stdio: "pipe",
      },
    );

    const combinedOutput = `${result.stdout || ""}\n${result.stderr || ""}`;

    if (result.status === 0) {
      resolved += 1;
      output.log(`Resolved: ${migration}`);
      continue;
    }

    if (isAlreadyApplied(combinedOutput)) {
      alreadyApplied += 1;
      output.log(`Already applied: ${migration}`);
      continue;
    }

    if (combinedOutput.trim()) {
      output.error(combinedOutput.trim());
    }
    throw new Error(`Failed to resolve migration: ${migration}`);
  }

  output.log(
    `Reconciliation complete: ${resolved} resolved, ${alreadyApplied} already applied.`,
  );
  output.log("Next, run db:deploy, db:generate, and db:status manually.");
  return { resolved, alreadyApplied, dryRun: false };
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  try {
    const dryRun = process.argv.includes("--dry-run");
    if (!dryRun && process.env.NODE_ENV !== "production") {
      throw new Error("db:resolve requires NODE_ENV=production");
    }
    if (!dryRun && !process.env.DATABASE_URL) {
      throw new Error("db:resolve requires a production DATABASE_URL");
    }
    reconcileMigrationHistory({ dryRun });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

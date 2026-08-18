import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prisma from "../packages/db/prisma.client.js";

const DEFAULT_LEGACY_ORIGINS = Object.freeze([
  "https://dreamstudiio.com",
  "https://www.dreamstudiio.com",
  "http://dreamstudiio.com",
  "http://www.dreamstudiio.com",
]);

function option(name) {
  const prefix = `--${name}=`;
  const item = process.argv.find((argument) => argument.startsWith(prefix));
  return item ? item.slice(prefix.length) : null;
}

function options(name) {
  const prefix = `--${name}=`;
  return process.argv
    .filter((argument) => argument.startsWith(prefix))
    .map((argument) => argument.slice(prefix.length));
}

function normalizedOrigin(value, label) {
  try {
    const parsed = new URL(String(value || "").trim());
    if (!/^https?:$/.test(parsed.protocol)) throw new Error();
    return parsed.origin;
  } catch {
    throw new Error(`${label} must be a valid HTTP(S) origin`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeNotificationLinkValue(
  value,
  { targetOrigin, legacyOrigins = DEFAULT_LEGACY_ORIGINS } = {},
) {
  if (typeof value !== "string" || !value) return value;
  const target = normalizedOrigin(targetOrigin, "target origin");
  return legacyOrigins.reduce((current, legacyOrigin) => {
    const legacy = normalizedOrigin(legacyOrigin, "legacy origin");
    const pattern = new RegExp(
      `${escapeRegExp(legacy)}(?=/dashboard(?:[/?#]|$))`,
      "gi",
    );
    return current.replace(pattern, target);
  }, value);
}

function reportPath() {
  const explicit = option("report");
  if (explicit) return path.resolve(explicit);
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  return path.resolve("reports", `notification-link-normalization-${stamp}.json`);
}

export async function runNotificationLinkNormalization({
  apply = process.argv.includes("--apply"),
  batchSize = Number(option("batch-size")) || 250,
  targetOrigin = option("to-origin") || process.env.DASHBOARD_ORIGIN,
  legacyOrigins = options("from-origin").length
    ? options("from-origin")
    : DEFAULT_LEGACY_ORIGINS,
} = {}) {
  if (apply && !process.argv.includes("--backup-confirmed")) {
    throw new Error("--apply requires --backup-confirmed");
  }
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1000) {
    throw new Error("--batch-size must be an integer between 1 and 1000");
  }

  const target = normalizedOrigin(targetOrigin, "--to-origin or DASHBOARD_ORIGIN");
  const legacy = legacyOrigins.map((origin) =>
    normalizedOrigin(origin, "--from-origin"),
  );
  if (legacy.includes(target)) {
    throw new Error("target origin must be different from every legacy origin");
  }

  const startedAt = new Date().toISOString();
  const changes = [];
  let scannedRows = 0;
  let changedRows = 0;
  let cursor = null;

  while (true) {
    const rows = await prisma.notification.findMany({
      select: { id: true, content: true, link: true },
      take: batchSize,
      orderBy: { id: "asc" },
      ...(cursor === null ? {} : { cursor: { id: cursor }, skip: 1 }),
    });
    if (rows.length === 0) break;
    scannedRows += rows.length;
    const writes = [];

    for (const row of rows) {
      const data = {};
      for (const field of ["content", "link"]) {
        const before = row[field];
        const after = normalizeNotificationLinkValue(before, {
          targetOrigin: target,
          legacyOrigins: legacy,
        });
        if (before === after) continue;
        data[field] = after;
        changes.push({ id: row.id, field, before, after });
      }
      if (Object.keys(data).length === 0) continue;
      changedRows += 1;
      if (apply) {
        writes.push(prisma.notification.update({ where: { id: row.id }, data }));
      }
    }

    if (writes.length > 0) await prisma.$transaction(writes);
    cursor = rows.at(-1).id;
  }

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    mode: apply ? "apply" : "dry-run",
    targetOrigin: target,
    legacyOrigins: legacy,
    scannedRows,
    changedRows,
    changedFields: changes.length,
    changes,
  };
  const output = reportPath();
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, `${JSON.stringify(report, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  await fs.chmod(output, 0o600);
  return { report, output };
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  runNotificationLinkNormalization()
    .then(({ report, output }) => {
      console.log(
        JSON.stringify(
          {
            mode: report.mode,
            targetOrigin: report.targetOrigin,
            scannedRows: report.scannedRows,
            changedRows: report.changedRows,
            changedFields: report.changedFields,
            report: output,
          },
          null,
          2,
        ),
      );
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}

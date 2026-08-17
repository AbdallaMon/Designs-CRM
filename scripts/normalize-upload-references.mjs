import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma } from "@prisma/client";
import prisma from "../packages/db/prisma.client.js";
import { normalizeUploadReference } from "../server/src/infra/upload/upload-reference.js";

function option(name) {
  const prefix = `--${name}=`;
  const item = process.argv.find((arg) => arg.startsWith(prefix));
  return item ? item.slice(prefix.length) : null;
}

export function normalizeStoredValue(value, options = {}) {
  if (typeof value === "string") {
    const exact = normalizeUploadReference(value, options);
    if (exact) return exact;
    return value.replace(/https?:\/\/[^\s"'<>]+/gi, (candidate) => {
      const trailing = candidate.match(/[.,;:!?]+$/)?.[0] || "";
      const withoutTrailing = trailing
        ? candidate.slice(0, -trailing.length)
        : candidate;
      const canonical = normalizeUploadReference(withoutTrailing, options);
      return canonical ? `${canonical}${trailing}` : candidate;
    });
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeStoredValue(item, options));
  }
  if (!value || typeof value !== "object") return value;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      normalizeStoredValue(item, options),
    ]),
  );
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function delegateName(modelName) {
  return `${modelName[0].toLowerCase()}${modelName.slice(1)}`;
}

function reportPath() {
  const explicit = option("report");
  if (explicit) return path.resolve(explicit);
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const reportRoot = process.env.ASSET_STORAGE_ROOT
    ? path.resolve(process.env.ASSET_STORAGE_ROOT, "upload-migration-reports")
    : path.resolve("reports");
  return path.join(reportRoot, `upload-reference-normalization-${stamp}.json`);
}

async function fileExists(canonicalReference) {
  if (!canonicalReference || !process.env.UPLOAD_DIR) return null;
  const relative = canonicalReference.slice("/uploads/".length);
  const root = path.resolve(process.env.UPLOAD_DIR);
  const candidate = path.resolve(root, ...relative.split("/"));
  const relativeToRoot = path.relative(root, candidate);
  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) return false;
  try {
    const candidateInfo = await fs.lstat(candidate);
    if (candidateInfo.isSymbolicLink()) return false;
    const [realRoot, realCandidate] = await Promise.all([
      fs.realpath(root),
      fs.realpath(candidate),
    ]);
    const realRelative = path.relative(realRoot, realCandidate);
    if (realRelative.startsWith("..") || path.isAbsolute(realRelative)) return false;
    return (await fs.stat(realCandidate)).isFile();
  } catch {
    return false;
  }
}

export async function runUploadReferenceNormalization({
  apply = process.argv.includes("--apply"),
  batchSize = Number(option("batch-size")) || 250,
  allowAnyOrigin = process.argv.includes("--allow-any-origin"),
} = {}) {
  if (apply && !process.argv.includes("--backup-confirmed")) {
    throw new Error("--apply requires --backup-confirmed");
  }
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1000) {
    throw new Error("--batch-size must be an integer between 1 and 1000");
  }

  const startedAt = new Date().toISOString();
  const changes = [];
  const skippedModels = [];
  const failures = [];
  let scannedRows = 0;

  for (const model of Prisma.dmmf.datamodel.models) {
    const idFields = model.fields.filter((field) => field.isId);
    const candidateFields = model.fields.filter(
      (field) =>
        field.kind === "scalar" &&
        !field.isList &&
        (field.type === "String" || field.type === "Json"),
    );
    if (candidateFields.length === 0) continue;
    if (idFields.length !== 1) {
      skippedModels.push({ model: model.name, reason: "requires one scalar id field" });
      continue;
    }

    const idField = idFields[0].name;
    const delegate = prisma[delegateName(model.name)];
    if (!delegate?.findMany || !delegate?.update) {
      skippedModels.push({ model: model.name, reason: "Prisma delegate unavailable" });
      continue;
    }
    const select = Object.fromEntries(
      [idField, ...candidateFields.map((field) => field.name)].map((field) => [
        field,
        true,
      ]),
    );

    let cursor = null;
    while (true) {
      const rows = await delegate.findMany({
        select,
        take: batchSize,
        orderBy: { [idField]: "asc" },
        ...(cursor === null
          ? {}
          : { cursor: { [idField]: cursor }, skip: 1 }),
      });
      if (rows.length === 0) break;
      scannedRows += rows.length;
      const writes = [];

      for (const row of rows) {
        const data = {};
        for (const field of candidateFields) {
          const before = row[field.name];
          const after = normalizeStoredValue(before, { allowAnyOrigin });
          if (sameValue(before, after)) continue;
          data[field.name] = after;
          changes.push({
            model: model.name,
            idField,
            id: row[idField],
            field: field.name,
            before,
            after,
            fileExists:
              typeof after === "string" ? await fileExists(after) : null,
          });
        }
        if (apply && Object.keys(data).length > 0) {
          writes.push(
            delegate.update({ where: { [idField]: row[idField] }, data }),
          );
        }
      }

      if (writes.length > 0) {
        try {
          await prisma.$transaction(writes);
        } catch (error) {
          failures.push({ model: model.name, cursor, message: error.message });
          throw error;
        }
      }
      cursor = rows.at(-1)[idField];
    }
  }

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    mode: apply ? "apply" : "dry-run",
    allowAnyOrigin,
    scannedRows,
    changedFields: changes.length,
    skippedModels,
    failures,
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

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  runUploadReferenceNormalization()
    .then(({ report, output }) => {
      console.log(
        JSON.stringify(
          {
            mode: report.mode,
            scannedRows: report.scannedRows,
            changedFields: report.changedFields,
            skippedModels: report.skippedModels.length,
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

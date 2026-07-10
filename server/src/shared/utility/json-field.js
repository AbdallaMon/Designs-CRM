// JSON (de)serialization for String/LongText columns that hold JSON payloads. Several columns
// were Prisma `Json?` before the prod-schema reconciliation and are now `String? @db.LongText`
// (see docs/db-migrations-workflow.md + the json-fields memo). Prisma no longer (de)serializes
// them, so callers must stringify JS objects/arrays before writing and guard-parse the stored
// string on read — otherwise Prisma rejects the object on write and returns a raw string on read.

// Encode a value for a JSON String column. null/undefined and existing strings pass through
// untouched (idempotent); objects/arrays are JSON.stringify'd.
export function serializeJsonField(value) {
  if (value == null || typeof value === "string") return value;
  return JSON.stringify(value);
}

// Decode a value read from a JSON String column. Non-strings pass through; a malformed JSON
// string is returned as-is rather than throwing.
export function parseJsonField(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

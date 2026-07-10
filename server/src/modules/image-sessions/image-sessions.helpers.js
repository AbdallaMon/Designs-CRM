// image-sessions shared helpers — PURE (no Prisma, no I/O). Multilingual text-payload
// builders and pro/con key resolvers extracted verbatim from the legacy
// `image-session-services.js` service so the per-entity admin repos can share them without
// duplicating Prisma logic. The DB-touching text helpers live in `admin/text.repo.js`.
import { serializeJsonField, parseJsonField } from "../../shared/utility/json-field.js";

export function createTextAndConnect(texts, key = "text") {
  let result = [];

  texts.forEach((item) => {
    if (!item.text || item.text.length === 0) return;
    result.push({
      [key]: item.text,
      language: {
        connect: {
          id: item.langId,
        },
      },
    });
  });
  return result;
}

export function getProAndConKey(type) {
  return type === "MATERIAL" ? "materialId" : "styleId";
}

export function getProAndConItemKey(itemType) {
  return itemType === "PRO" ? "pro" : "con";
}

// Template.customStyle / Template.layout are stored as JSON-encoded strings in LongText
// columns (the reconciled schema types them `String?`, matching production). On `master`
// these were Prisma `Json?`, which auto-(de)serialized; with `String?` we must do it here,
// or Prisma rejects the object on write and callers receive a raw string on read. See the
// shared json-field util for the general (de)serialize primitives.
const TEMPLATE_JSON_FIELDS = ["customStyle", "layout"];

// Encode the JSON fields of a template payload for a Prisma write. Idempotent: values that
// are already strings (or null/undefined) pass through untouched.
export function serializeTemplateForWrite(template) {
  const out = { ...template };
  for (const field of TEMPLATE_JSON_FIELDS) {
    if (field in out) out[field] = serializeJsonField(out[field]);
  }
  return out;
}

// Recursively decode Template JSON fields anywhere in a Prisma read result (a bare template,
// or templates nested under material/style/colorPattern/session includes). Mutates in place
// and returns the same reference. Malformed JSON is left as-is rather than throwing.
export function deserializeTemplatesDeep(node) {
  if (Array.isArray(node)) {
    for (const item of node) deserializeTemplatesDeep(item);
    return node;
  }
  if (node && typeof node === "object" && !(node instanceof Date)) {
    for (const field of TEMPLATE_JSON_FIELDS) {
      if (typeof node[field] === "string") node[field] = parseJsonField(node[field]);
    }
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (value && typeof value === "object") deserializeTemplatesDeep(value);
    }
  }
  return node;
}

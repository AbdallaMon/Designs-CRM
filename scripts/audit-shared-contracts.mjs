import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "@babel/parser";
import * as shared from "../packages/shared/index.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE_ROOTS = ["server/src", "web/src", "courses-web/src"];
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs"]);
const SHARED_VALUE = /^(?:[A-Z][A-Z0-9_]*|[a-z][a-z0-9-]*(?:\.[a-z0-9-]+)+)$/;
const QUOTED_CONTRACT = /(["'`])([A-Z][A-Z0-9_]*|[a-z][a-z0-9-]*(?:\.[a-z0-9-]+)+)\1/g;
const NON_CONTRACT_VALUES = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
  // These identifiers intentionally exist in multiple domains. A raw value cannot be
  // mapped to the right shared namespace without semantic context, so the audit checks
  // them through the targeted role/profile/message rules below instead.
  "ACCESS_DENIED",
  "ALL",
  "ACCOUNTANT",
  "ACTIVE",
  "ADMIN",
  "ARCHIVED",
  "AUDIO",
  "CANCELLED",
  "CLIENT",
  "CREATED",
  "DELETED",
  "DESIGN",
  "DESIGNER",
  "ENDED",
  "FAILED",
  "FILE",
  "FINANCE",
  "FORBIDDEN",
  "GROUP",
  "HTML",
  "IMAGE",
  "INITIATOR",
  "MISSED",
  "MEETING_BOOKED",
  "OK",
  "ONGOING",
  "PENDING",
  "PROJECT",
  "RINGING",
  "SALES",
  "SENT",
  "STAFF",
  "SYSTEM",
  "TEXT",
  "UPDATED",
  "VALIDATION_ERROR",
  "VIDEO",
]);

function collectSharedValues(value, output = new Set(), seen = new Set()) {
  if (typeof value === "string") {
    if (SHARED_VALUE.test(value)) output.add(value);
    return output;
  }
  if (!value || (typeof value !== "object" && typeof value !== "function")) {
    return output;
  }
  if (seen.has(value)) return output;
  seen.add(value);
  for (const nested of Object.values(value)) collectSharedValues(nested, output, seen);
  return output;
}

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", "__tests__"].includes(entry.name)) continue;
      files.push(...(await listSourceFiles(absolute)));
    } else if (
      SOURCE_EXTENSIONS.has(path.extname(entry.name)) &&
      !/\.(?:test|spec)\.[^.]+$/.test(entry.name)
    ) {
      files.push(absolute);
    }
  }
  return files;
}

function stripComments(source) {
  let output = "";
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (char === "\n") {
        lineComment = false;
        output += char;
      } else output += " ";
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        output += "  ";
        blockComment = false;
        index += 1;
      } else output += char === "\n" ? "\n" : " ";
      continue;
    }
    if (quote) {
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      output += char;
    } else if (char === "/" && next === "/") {
      output += "  ";
      lineComment = true;
      index += 1;
    } else if (char === "/" && next === "*") {
      output += "  ";
      blockComment = true;
      index += 1;
    } else output += char;
  }
  return output;
}

function isPresentationLiteral(line) {
  return /(?:label|aria-label|alt|helperText)\s*(?:=|:)\s*$/.test(
    line.slice(0, Math.max(line.lastIndexOf('"'), line.lastIndexOf("'"))),
  );
}

function workspaceOf(relativePath) {
  return relativePath.split("/")[0];
}

function firstManualText(node) {
  if (!node) return null;
  if (node.type === "StringLiteral") {
    return node.value.trim() && /\p{L}/u.test(node.value) ? node : null;
  }
  if (node.type === "TemplateLiteral") {
    return node.quasis.some((part) => /\p{L}/u.test(part.value.cooked ?? ""))
      ? node
      : null;
  }
  if (node.type === "LogicalExpression") {
    return firstManualText(node.left) ?? firstManualText(node.right);
  }
  if (node.type === "ConditionalExpression") {
    return firstManualText(node.consequent) ?? firstManualText(node.alternate);
  }
  if (
    node.type === "CallExpression" &&
    node.callee?.type === "Identifier" &&
    ["translate", "t"].includes(node.callee.name)
  ) {
    return node.arguments.map(firstManualText).find(Boolean) ?? null;
  }
  return null;
}

function auditManualErrorSetters(ast, relative) {
  const found = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "CallExpression") {
      const identifierName =
        node.callee?.type === "Identifier" ? node.callee.name : null;
      const isErrorSetter =
        identifierName &&
        (/^set[A-Za-z]*Error$/.test(identifierName) || identifierName === "setImgErr");
      const isToastError =
        node.callee?.type === "MemberExpression" &&
        node.callee.object?.type === "Identifier" &&
        node.callee.object.name === "toast" &&
        node.callee.property?.type === "Identifier" &&
        node.callee.property.name === "error";
      if (isErrorSetter || isToastError) {
        const textNode = firstManualText(node.arguments[0]);
        if (textNode) {
          found.push(
            `${relative}:${textNode.loc?.start?.line ?? node.loc?.start?.line ?? 1} manual user-facing error text`,
          );
        }
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (["loc", "start", "end", "extra"].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object" && value.type) visit(value);
    }
  };
  visit(ast);
  return found;
}

const allSharedValues = collectSharedValues(shared);
const strictSharedValues = collectSharedValues({
  PROFILES: shared.PROFILES,
  PROFILE_FAMILIES: shared.PROFILE_FAMILIES,
  USER_ROLES: shared.USER_ROLES,
  PERMISSIONS: shared.PERMISSIONS,
  AUDIT_ACTIONS: shared.AUDIT_ACTIONS,
  CHAT_ROOM_FILTERS: shared.CHAT_ROOM_FILTERS,
  CHAT_ROOM_TYPES: shared.CHAT_ROOM_TYPES,
  CHAT_VIEW_MODES: shared.CHAT_VIEW_MODES,
  CHAT_MEMBER_ROLES: shared.CHAT_MEMBER_ROLES,
  CHAT_MESSAGE_TYPES: shared.CHAT_MESSAGE_TYPES,
  CHAT_MESSAGE_STATUSES: shared.CHAT_MESSAGE_STATUSES,
  CHAT_CALL_TYPES: shared.CHAT_CALL_TYPES,
  CHAT_CALL_STATUSES: shared.CHAT_CALL_STATUSES,
  SCHEDULED_MESSAGE_STATUSES: shared.SCHEDULED_MESSAGE_STATUSES,
  CALENDAR_VIEW_TYPES: shared.CALENDAR_VIEW_TYPES,
  CALENDAR_SLOT_TYPES: shared.CALENDAR_SLOT_TYPES,
  WORK_DEPARTMENTS: shared.WORK_DEPARTMENTS,
  KANBAN_VIEW_TYPES: shared.KANBAN_VIEW_TYPES,
  COURSE_ROLES: shared.COURSE_ROLES,
  NOTIFICATION_TYPES: shared.NOTIFICATION_TYPES,
  NOTIFICATION_CONTENT_TYPES: shared.NOTIFICATION_CONTENT_TYPES,
  MY_DAY_FAMILIES: shared.MY_DAY_FAMILIES,
  LEAD_COCKPIT_RULE_SETS: shared.LEAD_COCKPIT_RULE_SETS,
  LEAD_CATEGORIES: shared.LEAD_CATEGORIES,
  LEAD_LOCATIONS: shared.LEAD_LOCATIONS,
  EMIRATES: shared.EMIRATES,
  PAGE_INFO_TYPES: shared.PAGE_INFO_TYPES,
  LEAD_STATUSES: shared.LEAD_STATUSES,
  CALL_REMINDER_STATUSES: shared.CALL_REMINDER_STATUSES,
  REMINDER_TYPES: shared.REMINDER_TYPES,
  BOOKING_LEAD_REQUEST_STATUSES: shared.BOOKING_LEAD_REQUEST_STATUSES,
  TELEGRAM_CONNECTION_STATUSES: shared.TELEGRAM_CONNECTION_STATUSES,
  TASK_STATUSES: shared.TASK_STATUSES,
  UPDATE_STATUSES: shared.UPDATE_STATUSES,
  PROJECT_STATUSES: shared.PROJECT_STATUSES,
  PAYMENT_STATUSES: shared.PAYMENT_STATUSES,
  CONTRACT_LEVELS: shared.CONTRACT_LEVELS,
  CONTRACT_PAYMENT_STATUSES: shared.CONTRACT_PAYMENT_STATUSES,
  CONTRACT_STATUSES: shared.CONTRACT_STATUSES,
  CONTRACT_SESSION_STATUSES: shared.CONTRACT_SESSION_STATUSES,
  WORK_STAGE_STATUSES: shared.WORK_STAGE_STATUSES,
  SALES_STAGE_TYPES: shared.SALES_STAGE_TYPES,
  IMAGE_SESSION_STATUSES: shared.IMAGE_SESSION_STATUSES,
  COURSE_QUESTION_TYPES: shared.COURSE_QUESTION_TYPES,
  HOMEWORK_TYPES: shared.HOMEWORK_TYPES,
  COURSE_PROGRESS_STATUSES: shared.COURSE_PROGRESS_STATUSES,
  MY_DAY_URGENCY: shared.MY_DAY_URGENCY,
  PUBLIC_UPLOAD_PURPOSES: shared.PUBLIC_UPLOAD_PURPOSES,
  TELEGRAM_AUTH_STATES: shared.TELEGRAM_AUTH_STATES,
  LEAD_COCKPIT_ACTION_KINDS: shared.LEAD_COCKPIT_ACTION_KINDS,
  MY_DAY_SIGNAL_TYPES: shared.MY_DAY_SIGNAL_TYPES,
  INTEGRATION_ERROR_CODES: shared.INTEGRATION_ERROR_CODES,
  messageCodes: Object.fromEntries(
    Object.entries(shared).filter(([name]) => /MessagesCodes$/i.test(name)),
  ),
});
const identitySharedValues = collectSharedValues({
  PROFILES: shared.PROFILES,
  PROFILE_FAMILIES: shared.PROFILE_FAMILIES,
  USER_ROLES: shared.USER_ROLES,
});
const occurrences = new Map();
const violations = [];

for (const sourceRoot of SOURCE_ROOTS) {
  const files = await listSourceFiles(path.join(ROOT, sourceRoot));
  for (const file of files) {
    const relative = path.relative(ROOT, file).replaceAll("\\", "/");
    if (
      relative === "server/src/modules/admin-residual/reports/report-pdf.js" ||
      relative.startsWith("server/src/infra/pdf/")
    ) {
      continue;
    }
    const rawSource = await readFile(file, "utf8");
    const ast = parse(rawSource, {
      sourceType: "module",
      plugins: ["jsx", "importAttributes", "classProperties", "topLevelAwait"],
    });
    violations.push(...auditManualErrorSetters(ast, relative));
    const source = stripComments(rawSource);
    const lines = source.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (/^\s*(?:import|export\s+\{)/.test(line)) continue;
      if (/^\s*["']use (?:client|server)["'];?\s*$/.test(line)) continue;
      if (/(?:setAlertError|setError)\(\s*["'`][A-Za-z]/.test(line)) {
        violations.push(`${relative}:${index + 1} manual user-facing error text`);
      }
      if (/res\.(?:status\([^)]*\)\.)?json\([^\n]*message\s*:\s*["'`][A-Za-z]/.test(line)) {
        violations.push(`${relative}:${index + 1} manual API response message text`);
      }
      for (const match of line.matchAll(QUOTED_CONTRACT)) {
        const value = match[2];
        const identityContext =
          identitySharedValues.has(value) &&
          /(?:profile|family|role|currentProfile)/i.test(line);
        if (
          (!identityContext && NON_CONTRACT_VALUES.has(value)) ||
          isPresentationLiteral(line.slice(0, match.index))
        ) {
          continue;
        }
        const entry = { relative, line: index + 1, workspace: workspaceOf(relative) };
        if (!occurrences.has(value)) occurrences.set(value, []);
        occurrences.get(value).push(entry);
        if (strictSharedValues.has(value)) {
          violations.push(
            `${relative}:${index + 1} hard-codes shared contract value ${value}`,
          );
        }
      }
    }
  }
}

for (const [value, entries] of occurrences) {
  if (allSharedValues.has(value) || NON_CONTRACT_VALUES.has(value)) continue;
  const workspaces = new Set(entries.map((entry) => entry.workspace));
  if (workspaces.size < 2 || !/^[A-Z][A-Z0-9_]*_[A-Z0-9_]+$/.test(value)) continue;
  const first = entries[0];
  violations.push(
    `${first.relative}:${first.line} cross-workspace contract ${value} is missing from @dms/shared`,
  );
}

const uniqueViolations = [...new Set(violations)].sort();
if (uniqueViolations.length) {
  console.error("Shared-contract audit failed:\n" + uniqueViolations.map((v) => `- ${v}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Shared-contract audit passed.");
}

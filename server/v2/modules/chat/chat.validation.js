import { AppError } from "../../shared/errors/AppError.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function requireInt(value, field) {
  const n = parseInt(value, 10);
  if (isNaN(n)) throw new AppError(`${field} must be a valid integer`, 400);
  return n;
}

function requireString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(`${field} is required`, 400);
  }
  return value.trim();
}

// ── Room validators ───────────────────────────────────────────────────────────

const VALID_ROOM_TYPES = [
  "STAFF_TO_STAFF",
  "GROUP",
  "PROJECT_GROUP",
  "MULTI_PROJECT",
  "CLIENT_TO_STAFF",
];

export function validateRoomId(params) {
  return requireInt(params.roomId, "roomId");
}

export function validateCreateRoom(body) {
  if (!body || typeof body !== "object")
    throw new AppError("Request body must be a JSON object", 400);

  const {
    name,
    type,
    projectId,
    clientLeadId,
    projectIds,
    userIds,
    allowFiles,
    allowCalls,
    isChatEnabled,
  } = body;

  requireString(type, "type");
  if (!VALID_ROOM_TYPES.includes(type)) {
    throw new AppError(
      `type must be one of: ${VALID_ROOM_TYPES.join(", ")}`,
      400,
    );
  }

  if (userIds !== undefined && !Array.isArray(userIds)) {
    throw new AppError("userIds must be an array", 400);
  }
  if (projectIds !== undefined && !Array.isArray(projectIds)) {
    throw new AppError("projectIds must be an array", 400);
  }

  return {
    name: name?.trim() || null,
    type,
    projectId: projectId ? Number(projectId) : undefined,
    clientLeadId: clientLeadId ? Number(clientLeadId) : undefined,
    projectIds: projectIds || [],
    userIds: userIds || [],
    allowFiles: allowFiles !== undefined ? Boolean(allowFiles) : true,
    allowCalls: allowCalls !== undefined ? Boolean(allowCalls) : true,
    isChatEnabled: isChatEnabled !== undefined ? Boolean(isChatEnabled) : true,
  };
}

export function validateCreateDirectChat(body) {
  if (!body || typeof body !== "object")
    throw new AppError("Request body must be a JSON object", 400);
  const participantId = requireInt(body.participantId, "participantId");
  return { participantId };
}

export function validateCreateLeadsRoom(body) {
  if (!body || typeof body !== "object")
    throw new AppError("Request body must be a JSON object", 400);
  const { groupType, clientLeadId } = body;

  requireString(groupType, "groupType");
  requireInt(clientLeadId, "clientLeadId");

  return body;
}

export function validateUpdateRoom(body) {
  if (!body || typeof body !== "object")
    throw new AppError("Request body must be a JSON object", 400);
  return body;
}

export function validateManageClient(body) {
  if (!body || typeof body !== "object")
    throw new AppError("Request body must be a JSON object", 400);
  const { action } = body;
  if (!["addClient", "removeClient"].includes(action)) {
    throw new AppError("action must be addClient or removeClient", 400);
  }
  return { action };
}

// ── Member validators ─────────────────────────────────────────────────────────

export function validateMemberId(params) {
  return requireInt(params.memberId, "memberId");
}

export function validateAddMembers(body) {
  if (!body || typeof body !== "object")
    throw new AppError("Request body must be a JSON object", 400);
  const { userIds } = body;
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError("userIds must be a non-empty array", 400);
  }
  return { userIds };
}

export function validateUpdateMemberRole(body) {
  if (!body || typeof body !== "object")
    throw new AppError("Request body must be a JSON object", 400);
  const { role } = body;
  const validRoles = ["ADMIN", "MODERATOR", "MEMBER"];
  if (!validRoles.includes(role)) {
    throw new AppError(`role must be one of: ${validRoles.join(", ")}`, 400);
  }
  return { role };
}

// ── Message validators ────────────────────────────────────────────────────────

export function validateMessageId(params) {
  return requireInt(params.messageId, "messageId");
}

export function validateGetMessages(query) {
  return {
    page: query.page ? Number(query.page) : 0,
    limit: query.limit ? Number(query.limit) : 50,
  };
}

export function validateMarkRead(body) {
  const { messageId } = body || {};
  return { messageId: messageId ? Number(messageId) : undefined };
}

export function validateMarkAllRead(body) {
  const { roomIds } = body || {};
  if (roomIds !== undefined && !Array.isArray(roomIds)) {
    throw new AppError("roomIds must be an array", 400);
  }
  return { roomIds: roomIds || [] };
}

// ── Reaction validator ────────────────────────────────────────────────────────

export function validateReactionBody(body) {
  if (!body || typeof body !== "object")
    throw new AppError("Request body must be a JSON object", 400);
  const { emoji } = body;
  if (!emoji || typeof emoji !== "string")
    throw new AppError("emoji is required", 400);
  return { emoji };
}

export function validateReactionParams(params) {
  const messageId = requireInt(params.messageId, "messageId");
  const { emoji } = params;
  if (!emoji) throw new AppError("emoji is required", 400);
  return { messageId, emoji: decodeURIComponent(emoji) };
}

// ── File validators ───────────────────────────────────────────────────────────

export function validateGetFiles(query) {
  const { page, limit, sort, type, search, from, to, uniqueMonths } = query;
  return {
    page: page ? Number(page) : 0,
    limit: limit ? Number(limit) : 20,
    sort: sort || "newest",
    type: type || null,
    search: search || "",
    from: from || null,
    to: to || null,
    uniqueMonths: uniqueMonths || "{}",
  };
}

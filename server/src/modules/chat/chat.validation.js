import {
  CHAT_MEMBER_ROLES,
  CHAT_ROOM_TYPES,
  validationMessagesCodes as V,
} from "@dms/shared";
import { z } from "zod";

const VALID_ROOM_TYPES = [
  CHAT_ROOM_TYPES.STAFF_TO_STAFF,
  CHAT_ROOM_TYPES.GROUP,
  CHAT_ROOM_TYPES.PROJECT_GROUP,
  CHAT_ROOM_TYPES.STAFF_GROUP,
  CHAT_ROOM_TYPES.CLIENT_TO_STAFF,
];

const VALID_MEMBER_ROLES = [CHAT_MEMBER_ROLES.ADMIN, CHAT_MEMBER_ROLES.MODERATOR, CHAT_MEMBER_ROLES.MEMBER];

class ChatSchemas {
  // ── Param schemas ─────────────────────────────────────────────────────────

  roomIdParams = z.object({
    roomId: z.coerce
      .number()
      .int()
      .positive(V.POSITIVE_INTEGER_REQUIRED),
  });

  memberIdParams = z.object({
    memberId: z.coerce
      .number()
      .int()
      .positive(V.POSITIVE_INTEGER_REQUIRED),
  });

  // Combined params for routes that carry BOTH :roomId and :memberId.
  // Must be validated in a SINGLE validate(..., "params") call: the validate
  // middleware overwrites req.params with the parsed (unknown-stripped) object,
  // so chaining two separate params validators drops one of the two ids.
  roomMemberParams = z.object({
    roomId: z.coerce
      .number()
      .int()
      .positive(V.POSITIVE_INTEGER_REQUIRED),
    memberId: z.coerce
      .number()
      .int()
      .positive(V.POSITIVE_INTEGER_REQUIRED),
  });

  messageIdParams = z.object({
    messageId: z.coerce
      .number()
      .int()
      .positive(V.POSITIVE_INTEGER_REQUIRED),
  });

  roomMessageParams = z.object({
    roomId: z.coerce
      .number()
      .int()
      .positive(V.POSITIVE_INTEGER_REQUIRED),
    messageId: z.coerce
      .number()
      .int()
      .positive(V.POSITIVE_INTEGER_REQUIRED),
  });

  reactionParams = z.object({
    messageId: z.coerce
      .number()
      .int()
      .positive(V.POSITIVE_INTEGER_REQUIRED),
    emoji: z.string().min(1, V.FIELD_REQUIRED).transform(decodeURIComponent),
  });

  // ── Query schemas ─────────────────────────────────────────────────────────

  getRooms = z.object({
    category: z.string().optional(),
    projectId: z.coerce.number().optional(),
    clientLeadId: z.coerce.number().optional(),
    page: z.coerce.number().int().optional().default(0),
    limit: z.coerce.number().int().optional().default(25),
    searchKey: z.string().optional().default(""),
    chatType: z.string().optional().nullable(),
  });

  getMessages = z.object({
    page: z.coerce.number().int().optional().default(0),
    limit: z.coerce.number().int().optional().default(50),
  });

  getMessagePage = z.object({
    limit: z.coerce.number().int().optional().default(50),
  });

  getFiles = z.object({
    page: z.coerce.number().optional().default(0),
    limit: z.coerce.number().optional().default(20),
    sort: z.string().optional().default("newest"),
    type: z.string().nullish().default(null),
    search: z.string().optional().default(""),
    from: z.string().nullish().default(null),
    to: z.string().nullish().default(null),
    uniqueMonths: z.string().optional().default("{}"),
  });

  // ── Body schemas ──────────────────────────────────────────────────────────

  createRoom = z.object({
    name: z.string().trim().optional().nullable(),
    type: z.enum(VALID_ROOM_TYPES, {
      error: V.INVALID_ENUM_VALUE,
    }),
    projectId: z.coerce.number().int().positive().optional(),
    clientLeadId: z.coerce.number().int().positive().optional(),
    projectIds: z.array(z.number()).optional().default([]),
    userIds: z.array(z.number()).optional().default([]),
    allowFiles: z.boolean().optional().default(true),
    allowCalls: z.boolean().optional().default(true),
    isChatEnabled: z.boolean().optional().default(true),
  });

  createDirectChat = z.object({
    participantId: z.coerce
      .number()
      .int()
      .positive(V.POSITIVE_INTEGER_REQUIRED),
  });

  createLeadsRoom = z.object({
    groupType: z.string().trim().min(1, V.FIELD_REQUIRED),
    clientLeadId: z.coerce
      .number()
      .int()
      .positive(V.POSITIVE_INTEGER_REQUIRED),
    name: z.string().optional(),
    projectIds: z.array(z.number()).optional(),
    projectGroupIds: z.array(z.number()).optional(),
    selectedProjectsTypes: z.array(z.string()).optional(),
    addClient: z.boolean().optional(),
    addRelatedSalesStaff: z.boolean().optional(),
    addRelatedDesigners: z.boolean().optional(),
    chatPasswordHash: z.string().optional(),
  });

  updateRoom = z
    .object({
      name: z.string().trim().optional(),
      isMuted: z.boolean().optional(),
      isArchived: z.boolean().optional(),
      allowFiles: z.boolean().optional(),
      allowCalls: z.boolean().optional(),
      isChatEnabled: z.boolean().optional(),
    })
    .passthrough();

  manageClient = z.object({
    action: z.enum(["addClient", "removeClient"], {
      error: V.INVALID_ACTION,
    }),
  });

  addMembers = z.object({
    userIds: z
      .array(z.number().int().positive())
      .min(1, V.NON_EMPTY_ARRAY_REQUIRED),
  });

  updateMemberRole = z.object({
    role: z.enum(VALID_MEMBER_ROLES, {
      error: V.INVALID_ENUM_VALUE,
    }),
  });

  markRead = z.object({
    messageId: z.coerce.number().int().positive().optional(),
  });

  markAllRead = z.object({
    roomIds: z.array(z.number()).optional().default([]),
  });

  addReaction = z.object({
    emoji: z.string().min(1, V.FIELD_REQUIRED),
  });
}

export const chatSchemas = new ChatSchemas();

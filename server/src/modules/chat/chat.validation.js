import { z } from "zod";

const VALID_ROOM_TYPES = [
  "STAFF_TO_STAFF",
  "GROUP",
  "PROJECT_GROUP",
  "MULTI_PROJECT",
  "CLIENT_TO_STAFF",
];

const VALID_MEMBER_ROLES = ["ADMIN", "MODERATOR", "MEMBER"];

class ChatSchemas {
  // ── Param schemas ─────────────────────────────────────────────────────────

  roomIdParams = z.object({
    roomId: z.coerce
      .number()
      .int()
      .positive("roomId must be a positive integer"),
  });

  memberIdParams = z.object({
    memberId: z.coerce
      .number()
      .int()
      .positive("memberId must be a positive integer"),
  });

  // Combined params for routes that carry BOTH :roomId and :memberId.
  // Must be validated in a SINGLE validate(..., "params") call: the validate
  // middleware overwrites req.params with the parsed (unknown-stripped) object,
  // so chaining two separate params validators drops one of the two ids.
  roomMemberParams = z.object({
    roomId: z.coerce
      .number()
      .int()
      .positive("roomId must be a positive integer"),
    memberId: z.coerce
      .number()
      .int()
      .positive("memberId must be a positive integer"),
  });

  messageIdParams = z.object({
    messageId: z.coerce
      .number()
      .int()
      .positive("messageId must be a positive integer"),
  });

  reactionParams = z.object({
    messageId: z.coerce
      .number()
      .int()
      .positive("messageId must be a positive integer"),
    emoji: z.string().min(1, "emoji is required").transform(decodeURIComponent),
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
      error: `type must be one of: ${VALID_ROOM_TYPES.join(", ")}`,
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
      .positive("participantId must be a positive integer"),
  });

  createLeadsRoom = z.object({
    groupType: z.string().trim().min(1, "groupType is required"),
    clientLeadId: z.coerce
      .number()
      .int()
      .positive("clientLeadId must be a positive integer"),
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
      error: "action must be addClient or removeClient",
    }),
  });

  addMembers = z.object({
    userIds: z
      .array(z.number().int().positive())
      .min(1, "userIds must be a non-empty array"),
  });

  updateMemberRole = z.object({
    role: z.enum(VALID_MEMBER_ROLES, {
      error: `role must be one of: ${VALID_MEMBER_ROLES.join(", ")}`,
    }),
  });

  markRead = z.object({
    messageId: z.coerce.number().int().positive().optional(),
  });

  markAllRead = z.object({
    roomIds: z.array(z.number()).optional().default([]),
  });

  addReaction = z.object({
    emoji: z.string().min(1, "emoji is required"),
  });
}

export const chatSchemas = new ChatSchemas();

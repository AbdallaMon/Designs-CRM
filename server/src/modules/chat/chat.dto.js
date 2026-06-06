import { PERMISSIONS, computeCapabilities, hasPermission } from "@dms/shared";

// ── Per-record capabilities ───────────────────────────────────────────────────
// Computed in the DTO (decision #3: mandatory on scoped responses) so the FE can
// gate row/detail actions WITHOUT re-implementing the rules. Each rule combines a
// permission CODE with object-scope facts (creator / member role / room type),
// mirroring the server-side checks in chat.usecase.js. Backend stays the source of
// truth; capabilities are a rendering hint.
const ROOM_CAPABILITY_RULES = {
  canEdit: ({ permissions, record, authUserId, selfMember }) =>
    hasPermission(permissions, PERMISSIONS.CHAT.ROOM_EDIT) &&
    (record.createdById === authUserId ||
      selfMember?.role === "ADMIN" ||
      selfMember?.role === "MODERATOR" ||
      record.type === "STAFF_TO_STAFF"),
  canDelete: ({ permissions, record, selfMember }) =>
    hasPermission(permissions, PERMISSIONS.CHAT.ROOM_DELETE) &&
    selfMember?.role === "ADMIN" &&
    record.type !== "STAFF_TO_STAFF" &&
    record.type !== "PROJECT_GROUP",
  canManageMembers: ({ permissions, selfMember }) =>
    hasPermission(permissions, PERMISSIONS.CHAT.MEMBER_MANAGE) &&
    (selfMember?.role === "ADMIN" || selfMember?.role === "MODERATOR"),
  canManageClient: ({ permissions, record, selfMember }) =>
    hasPermission(permissions, PERMISSIONS.CHAT.MEMBER_MANAGE) &&
    (selfMember?.role === "ADMIN" || selfMember?.role === "MODERATOR") &&
    Boolean(record.clientLead || record.clientLeadId),
  canSendMessage: ({ permissions, record }) =>
    hasPermission(permissions, PERMISSIONS.CHAT.MESSAGE_SEND) &&
    record.isChatEnabled !== false,
  canUploadFiles: ({ permissions, record }) =>
    hasPermission(permissions, PERMISSIONS.CHAT.MESSAGE_SEND) &&
    record.allowFiles !== false &&
    record.isChatEnabled !== false,
};

/**
 * Compute the per-record `capabilities.*` object for a chat room.
 * @param {object} room   the room record (must carry createdById, type, flags)
 * @param {{ permissions?: string[], authUserId: number, selfMember?: object }} ctx
 */
export function computeRoomCapabilities(room, { permissions, authUserId, selfMember }) {
  return computeCapabilities(ROOM_CAPABILITY_RULES, {
    permissions: permissions || [],
    record: room,
    authUserId: Number(authUserId),
    selfMember: selfMember ?? room?.selfMember ?? null,
  });
}

// ── Shared Prisma select shapes ───────────────────────────────────────────────
// Centralised here so both the repository and socket layer use the same projections.

export const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  lastSeenAt: true,
  profilePicture: true,
};

export const clientSelect = {
  id: true,
  name: true,
  email: true,
  lastSeenAt: true,
};

export const memberSelect = {
  id: true,
  userId: true,
  clientId: true,
  role: true,
  leftAt: true,
  lastReadAt: true,
  isDeleted: true,
  isArchived: true,
  isMuted: true,
  createdAt: true,
  user: { select: userSelect },
  client: { select: clientSelect },
};

export const senderSelect = {
  id: true,
  name: true,
  email: true,
  profilePicture: true,
};

export const messageInclude = {
  sender: { select: senderSelect },
  client: { select: { id: true, name: true, email: true } },
  replyTo: {
    select: {
      id: true,
      content: true,
      sender: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  },
  pinnedIn: { select: { id: true, messageId: true } },
  reactions: {
    include: {
      user: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  },
  attachments: true,
  mentions: { include: { user: { select: { id: true, name: true } } } },
};

export const bookingLeadSelect = {
  id: true,
  code: true,
  client: { select: { id: true, name: true, email: true } },
};

/**
 * Build the room include shape for a user.
 * Only the requesting user's own member record is included in the members list
 * (except for STAFF_TO_STAFF rooms where all members are included for display).
 */
export function buildRoomInclude(userId) {
  return {
    createdBy: { select: { id: true, name: true, email: true, role: true } },
    project: { select: { id: true, groupTitle: true, groupId: true } },
    clientLead: {
      select: {
        id: true,
        code: true,
        client: { select: { id: true, name: true, email: true } },
      },
    },
    members: {
      where: {
        isDeleted: false,
        OR: [
          { room: { type: "STAFF_TO_STAFF" } },
          ...(userId ? [{ userId: Number(userId) }] : []),
        ],
      },
      select: memberSelect,
    },
    multiProjectRooms: {
      include: { project: { select: { id: true, groupTitle: true } } },
    },
    messages: {
      take: 1,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        type: true,
        createdAt: true,
        sender: { select: { id: true, name: true } },
      },
    },
  };
}

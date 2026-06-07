// chat/client usecase — the PUBLIC client-chat surface (legacy
// routes/client/chat/{rooms,messages,members,files}.js, mounted under /client/chat
// via routes/clients/clients.js with NO auth gate). Mounted under v2 at
// /v2/client/chat.
//
// ── The gate (PUBLIC, token-based) ──────────────────────────────────────────────
// A client gets a per-room access token (ChatRoom.chatAccessToken). That token is the
// ONLY credential. Every endpoint:
//   1. resolves the room FROM the token  (resolveRoom)
//   2. if a `:roomId` param is supplied, asserts it equals the token's room
//   3. derives the client member (clientId) FROM the token's room — never from a
//      client-supplied query param
// This CLOSES the legacy IDOR: legacy took a raw `:roomId` + `clientId` query and
// gated only on "is `clientId` a member of `:roomId`?", with NO link to the token —
// so any client who knew (or guessed) a member clientId could read ANY room's
// messages/members/files. v2 ignores client-supplied roomId/clientId and uses the
// token's room + the token's client member.
//
// ── Reuse, not duplication ─────────────────────────────────────────────────────
// All Prisma I/O and grouping logic is reused from the authed chat module via lazy
// adapters: the shared `chatRepository` instance (from chat.socket.js) and the
// `addDayGrouping`/`addMonthGrouping` helpers. No query logic is re-implemented here.
import { AppError } from "../../../shared/errors/AppError.js";
import { chatMessagesCodes } from "@dms/shared";

const legacyDefaults = {
  // The single shared ChatRepository instance (same one the socket + HTTP layers
  // use), lazily imported to avoid pulling the socket/Prisma graph at module load.
  repository: () =>
    import("../chat.socket.js").then((m) => m.chatRepository),
  addDayGrouping: (...a) =>
    import("../chat.helpers.js").then((m) => m.addDayGrouping(...a)),
  addMonthGrouping: (...a) =>
    import("../chat.helpers.js").then((m) => m.addMonthGrouping(...a)),
};

export class ClientChatUsecase {
  constructor(deps = {}) {
    this.deps = { ...legacyDefaults, ...deps };
  }

  async repo() {
    return this.deps.repository();
  }

  // ── Token → room resolution (the IDOR-safe core) ──────────────────────────────
  // Verifies the token resolves to a room and (optionally) that the supplied
  // `:roomId` matches the token's room. Returns { room, chatMember } where
  // chatMember is the client member behind the token (used as the read scope).
  async resolveRoom({ token, roomId = null }) {
    const repo = await this.repo();
    const resolved = await repo.findRoomByAccessToken(token);
    if (!resolved?.room) {
      // No token / token does not resolve to a room. 404 — do not leak whether the
      // token format was valid.
      throw new AppError(chatMessagesCodes.INVALID_ROOM_TOKEN, 404);
    }
    // If the caller named a roomId, it MUST be the token's room. Anything else is a
    // cross-room read attempt → deny (IDOR close). 403 without leaking the target.
    if (roomId != null && Number(roomId) !== Number(resolved.room.id)) {
      throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);
    }
    return resolved;
  }

  // The client scope = the clientId of the member behind the token. Used to drive
  // the repository's member lookups exactly like the authed surface uses userId.
  clientIdOf(resolved) {
    return resolved.chatMember?.clientId ?? null;
  }

  // ── GET /rooms/validate-token ─────────────────────────────────────────────────
  // Legacy returned { ...roomData, isValid: true } where roomData = { room, chatMember }.
  // We preserve that shape (room + chatMember + isValid) so the FE token gate keeps
  // working. The room is narrowed to {id,type} by the repository (no secrets/token).
  async validateToken({ token }) {
    const resolved = await this.resolveRoom({ token });
    return { ...resolved, isValid: true };
  }

  // ── GET /rooms/:roomId — room detail ──────────────────────────────────────────
  // Legacy called getChatRoomById(roomId, null, clientId), gating on the client
  // member. v2 resolves the room from the token, asserts the param matches, then
  // reuses the authed repository's getRoomById projection (narrow includes — only
  // {id,name} users, no secrets). otherMembers/lastSeenAt mirror the authed shape.
  async getRoom({ token, roomId }) {
    const resolved = await this.resolveRoom({ token, roomId });
    const repo = await this.repo();
    const clientId = this.clientIdOf(resolved);

    const room = await repo.getRoomById(resolved.room.id, null, clientId);
    if (!room) throw new AppError(chatMessagesCodes.ROOM_NOT_FOUND, 404);

    const selfMember = resolved.chatMember;
    const otherMembers = (room.members || []).filter(
      (m) => m.clientId == null || m.clientId !== clientId,
    );
    return {
      ...room,
      otherMembers,
      lastSeenAt:
        otherMembers.length > 0 ? otherMembers[0]?.user?.lastSeenAt : null,
      selfMember,
    };
  }

  // ── GET /:roomId/messages — paginated history (cursor/infinite-scroll shape) ───
  // PRESERVES the legacy { data, total, totalPages } shape (the FE relies on it for
  // infinite scroll). Reuses the authed repository's getMessagesWithReceipts +
  // countMessages + countUnreadMessages and the addDayGrouping helper. Also marks
  // the room read for the client member — the side effect legacy getMessages had.
  async getMessages({ token, roomId, page, limit }) {
    const resolved = await this.resolveRoom({ token, roomId });
    const repo = await this.repo();
    const clientId = this.clientIdOf(resolved);

    const member = resolved.chatMember;
    if (!member) throw new AppError(chatMessagesCodes.ROOM_ACCESS_DENIED, 403);

    const parsedPage = page != null ? Number(page) : 0;
    const parsedLimit = limit != null ? Number(limit) : 50;
    const skip = parsedPage * parsedLimit;

    const [messages, total, unreadCount] = await Promise.all([
      repo.getMessagesWithReceipts({
        roomId: resolved.room.id,
        memberId: member.id,
        skip,
        limit: parsedLimit,
      }),
      repo.countMessages(resolved.room.id),
      repo.countUnreadMessages({
        roomId: resolved.room.id,
        memberId: member.id,
        clientId,
      }),
    ]);

    const ascending = messages.reverse();
    const messagesWithGrouping = await this.deps.addDayGrouping(ascending, {
      userId: null,
      clientId: clientId != null ? Number(clientId) : null,
      memberId: member.id,
      unreadCount,
    });

    await this.markRoomRead({ resolved });

    return {
      data: messagesWithGrouping,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    };
  }

  // Internal: mark the client member's unread messages read (legacy side effect of
  // getMessages). Best-effort — never blocks the read; socket emit is skipped here
  // (the public read path is not a socket connection).
  async markRoomRead({ resolved }) {
    const repo = await this.repo();
    const member = resolved.chatMember;
    if (!member) return;
    const clientId = this.clientIdOf(resolved);
    const unread = await repo.getUnreadMessages({
      roomId: resolved.room.id,
      memberId: member.id,
      clientId,
    });
    await repo.bulkMarkMessagesRead({
      memberId: member.id,
      messageIds: unread.map((m) => m.id),
    });
    await repo.updateMemberReadAt(member.id);
  }

  // ── GET /:roomId/messages/:messageId/page ─────────────────────────────────────
  // Legacy computed the page index of a message for "jump to message". v2 verifies
  // the token + roomId, then confirms the target message actually belongs to the
  // token's room (so a client cannot probe another room's message ids), and reuses
  // the authed repository's getMessageIndexInRoom.
  async getMessagePage({ token, roomId, messageId, limit }) {
    const resolved = await this.resolveRoom({ token, roomId });
    const repo = await this.repo();

    const message = await repo.getMessageById(messageId);
    if (!message || Number(message.roomId) !== Number(resolved.room.id)) {
      throw new AppError(chatMessagesCodes.MESSAGE_NOT_FOUND, 404);
    }
    const parsedLimit = limit != null ? Number(limit) : 50;
    return repo.getMessageIndexInRoom(messageId, parsedLimit);
  }

  // ── GET /:roomId/pinned-messages ──────────────────────────────────────────────
  // Legacy returned the plain message objects. Reuses the authed getPinnedMessages
  // projection (narrow {id,name} users). Returns the array (legacy `data`).
  async getPinnedMessages({ token, roomId }) {
    const resolved = await this.resolveRoom({ token, roomId });
    const repo = await this.repo();
    const pins = await repo.getPinnedMessages(resolved.room.id);
    return pins.map((p) => p.message);
  }

  // ── GET /:roomId/members ──────────────────────────────────────────────────────
  // Legacy returned the raw members array (NOT paginated) under `data`. Preserve the
  // natural array shape. Reuses the authed getMembers projection (narrow user/client
  // selects — no full User rows).
  async getMembers({ token, roomId }) {
    const resolved = await this.resolveRoom({ token, roomId });
    const repo = await this.repo();
    return repo.getMembers(resolved.room.id);
  }

  // ── GET /:roomId/files ────────────────────────────────────────────────────────
  // Legacy paginated and returned { data: { files, uniqueMonths }, total, totalPages,
  // page, limit }. PRESERVE that exact shape (the FE file gallery relies on it for
  // infinite scroll + month dividers). Reuses the authed getFiles projection + the
  // addMonthGrouping helper. `sort`/`uniqueMonths` JSON parse is guarded.
  async getFiles({ token, roomId, query }) {
    const resolved = await this.resolveRoom({ token, roomId });
    const repo = await this.repo();
    const { page, limit, sort, type, search, from, to, uniqueMonths } = query;

    const parsedUniqueMonths = safeJsonParse(uniqueMonths, {});
    const parsedSort = normalizeSort(sort);

    const {
      attachments,
      total,
      limit: parsedLimit,
      page: parsedPage,
    } = await repo.getFiles({
      roomId: resolved.room.id,
      page: page != null ? Number(page) : 0,
      limit: limit != null ? Number(limit) : 20,
      sort: parsedSort,
      type: type || null,
      search: search || "",
      from: from || null,
      to: to || null,
    });

    const files = await this.deps.addMonthGrouping(
      attachments,
      parsedUniqueMonths,
    );

    return {
      data: { files, uniqueMonths: parsedUniqueMonths },
      total,
      totalPages: Math.ceil(total / parsedLimit),
      page: parsedPage,
      limit: parsedLimit,
    };
  }
}

// Guarded JSON.parse — legacy did a bare JSON.parse on `sort` and `uniqueMonths`
// (a malformed client value would 500). Fall back to the default on bad input.
function safeJsonParse(value, fallback) {
  if (value == null || value === "") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// Legacy JSON.parse'd `sort` (the FE sometimes sends a JSON-encoded string like
// '"newest"'). The repository's getFiles expects the plain string "newest"|"oldest".
// Normalize: accept either a raw string or a JSON-encoded string; default "newest".
function normalizeSort(sort) {
  if (sort == null || sort === "") return "newest";
  const parsed = safeJsonParse(sort, sort);
  return typeof parsed === "string" ? parsed : "newest";
}

export const clientChatUsecase = new ClientChatUsecase();

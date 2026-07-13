import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../../../shared/errors/AppError.js";
import { chatMessagesCodes } from "@dms/shared";

// The PUBLIC client-chat surface. The token is the ONLY credential; the room is
// derived FROM the token and any mismatched :roomId is rejected (IDOR close). The
// usecase reuses the shared ChatRepository (lazily from chat.socket.js) and the
// chat.helpers grouping functions. Mock both seams so no Prisma/socket graph is
// loaded and we can drive the repository per test.
vi.mock("../../chat.socket.js", () => ({ chatRepository: {} }));
vi.mock("../../chat.helpers.js", () => ({
  addDayGrouping: (msgs) => msgs,
  addMonthGrouping: (att) => att,
}));

import { clientChatUsecase } from "../client-chat.usecase.js";
import { chatRepository } from "../../chat.socket.js";

const TOKEN = "valid-token-abc";
const ROOM = { id: 42, type: "CLIENT_TO_STAFF" };
const CHAT_MEMBER = { id: 7, clientId: 99, roomId: 42 };

// Configure the shared (mocked) repository singleton with the default method set,
// applying any per-test overrides. Object.assign replaces the referenced methods
// with fresh vi.fns each call, so no stale state leaks between tests.
function applyRepo(overrides = {}) {
  Object.assign(chatRepository, {
    findRoomByAccessToken: vi.fn(async (t) =>
      t === TOKEN ? { room: ROOM, chatMember: CHAT_MEMBER } : null,
    ),
    getRoomById: vi.fn(async () => ({ id: ROOM.id, members: [] })),
    getMembers: vi.fn(async () => [
      { id: 1, user: { id: 5, name: "Staff" } },
      { id: 2, client: { id: 99, name: "Client" } },
    ]),
    getMessagesWithReceipts: vi.fn(async () => []),
    countMessages: vi.fn(async () => 0),
    countUnreadMessages: vi.fn(async () => 0),
    getUnreadMessages: vi.fn(async () => []),
    bulkMarkMessagesRead: vi.fn(async () => {}),
    updateMemberReadAt: vi.fn(async () => {}),
    getMessageById: vi.fn(async () => ({ id: 3, roomId: ROOM.id })),
    getMessageIndexInRoom: vi.fn(async () => ({ messageId: 3, page: 0, limit: 50 })),
    getPinnedMessages: vi.fn(async () => [{ message: { id: 11 } }]),
    getFiles: vi.fn(async () => ({
      attachments: [],
      total: 0,
      limit: 20,
      page: 0,
    })),
    ...overrides,
  });
}

const uc = clientChatUsecase;

beforeEach(() => {
  vi.clearAllMocks();
  applyRepo();
});

describe("ClientChatUsecase.resolveRoom (token authority / IDOR gate)", () => {
  it("validates a token and resolves the room behind it", async () => {
    const resolved = await uc.resolveRoom({ token: TOKEN });
    expect(resolved.room.id).toBe(42);
    expect(resolved.chatMember.clientId).toBe(99);
    expect(chatRepository.findRoomByAccessToken).toHaveBeenCalledWith(TOKEN);
  });

  it("THROWS 404 INVALID_ROOM_TOKEN for a token that does not resolve to a room", async () => {
    await expect(uc.resolveRoom({ token: "nope" })).rejects.toMatchObject({
      statusCode: 404,
      message: chatMessagesCodes.INVALID_ROOM_TOKEN,
    });
    await expect(uc.resolveRoom({ token: "nope" })).rejects.toBeInstanceOf(
      AppError,
    );
  });

  it("ACCEPTS a :roomId that matches the token's room", async () => {
    const resolved = await uc.resolveRoom({ token: TOKEN, roomId: 42 });
    expect(resolved.room.id).toBe(42);
  });

  it("REJECTS (403) a :roomId that does NOT match the token's room (IDOR)", async () => {
    await expect(
      uc.resolveRoom({ token: TOKEN, roomId: 9999 }),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: chatMessagesCodes.ROOM_ACCESS_DENIED,
    });
  });
});

describe("ClientChatUsecase reads derive the room from the token, not the param", () => {
  it("getMembers uses the token's room id (ignores a mismatched param by rejecting it)", async () => {
    // matching param -> reads the token's room
    await uc.getMembers({ token: TOKEN, roomId: 42 });
    expect(chatRepository.getMembers).toHaveBeenCalledWith(42);

    // mismatched param -> rejected, getMembers never called for the foreign room
    chatRepository.getMembers.mockClear();
    await expect(
      uc.getMembers({ token: TOKEN, roomId: 7 }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(chatRepository.getMembers).not.toHaveBeenCalled();
  });

  it("getMembers returns the natural array shape (legacy did not paginate members)", async () => {
    const members = await uc.getMembers({ token: TOKEN, roomId: 42 });
    expect(Array.isArray(members)).toBe(true);
    expect(members).toHaveLength(2);
  });

  it("getMessages returns the contract { items, total, totalPages } paginated shape", async () => {
    applyRepo({ countMessages: vi.fn(async () => 120) });
    const res = await uc.getMessages({ token: TOKEN, roomId: 42, limit: 50 });
    expect(res).toHaveProperty("items");
    expect(res.total).toBe(120);
    expect(res.totalPages).toBe(Math.ceil(120 / 50));
    // it derives the client scope from the token member, not a client-supplied id
    expect(chatRepository.countUnreadMessages).toHaveBeenCalledWith(
      expect.objectContaining({ roomId: 42, memberId: 7, clientId: 99 }),
    );
  });

  it("getFiles preserves the legacy { data: { files, uniqueMonths }, total, totalPages, page, limit } shape", async () => {
    const res = await uc.getFiles({
      token: TOKEN,
      roomId: 42,
      query: { uniqueMonths: '{"2025-01":2}' },
    });
    expect(res.data).toHaveProperty("files");
    expect(res.data).toHaveProperty("uniqueMonths");
    expect(res).toHaveProperty("total");
    expect(res).toHaveProperty("totalPages");
    expect(res).toHaveProperty("page");
    expect(res).toHaveProperty("limit");
  });

  it("getFiles guards a malformed uniqueMonths / sort JSON (no throw)", async () => {
    const res = await uc.getFiles({
      token: TOKEN,
      roomId: 42,
      query: { uniqueMonths: "{not-json", sort: "{bad" },
    });
    expect(res.data.uniqueMonths).toEqual({});
  });

  it("getMessagePage rejects a message that belongs to a different room (cross-room probe)", async () => {
    applyRepo({ getMessageById: vi.fn(async () => ({ id: 3, roomId: 8888 })) });
    await expect(
      uc.getMessagePage({ token: TOKEN, roomId: 42, messageId: 3 }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: chatMessagesCodes.MESSAGE_NOT_FOUND,
    });
  });

  it("validateToken returns { room, chatMember, isValid:true } (legacy shape)", async () => {
    const data = await uc.validateToken({ token: TOKEN });
    expect(data.isValid).toBe(true);
    expect(data.room.id).toBe(42);
    expect(data.chatMember.clientId).toBe(99);
  });
});

describe("ClientChatUsecase emits only language-neutral CODES (no prose)", () => {
  it("error codes are SCREAMING_SNAKE_CASE constants, not sentences", async () => {
    const err = await uc
      .resolveRoom({ token: "bad" })
      .catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe(chatMessagesCodes.INVALID_ROOM_TOKEN);
    expect(err.message).toMatch(/^[A-Z0-9_]+$/);
  });
});

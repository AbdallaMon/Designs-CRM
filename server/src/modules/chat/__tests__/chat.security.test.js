import { beforeEach, describe, expect, it, vi } from "vitest";

const emit = vi.fn();
const to = vi.fn(() => ({ emit }));

vi.mock("../../../infra/socket/io-registry.js", () => ({
  getIo: () => ({ to }),
}));

vi.mock("../chat.repo.js", () => ({
  chatRepository: {
    getMember: vi.fn(),
    getMessageById: vi.fn(),
    getMessageIndexInRoom: vi.fn(),
    getUnreadMessages: vi.fn(),
    bulkMarkMessagesRead: vi.fn(),
    updateMemberReadAt: vi.fn(),
    upsertReadReceipt: vi.fn(),
    upsertReaction: vi.fn(),
    findReaction: vi.fn(),
    deleteReaction: vi.fn(),
    findRoomBasic: vi.fn(),
    createMessage: vi.fn(),
    getActiveMembersExcluding: vi.fn(),
    getMessagesForForward: vi.fn(),
    createPin: vi.fn(),
    deletePins: vi.fn(),
    getCallById: vi.fn(),
    createCall: vi.fn(),
    updateCall: vi.fn(),
    addCallParticipant: vi.fn(),
  },
}));

import { chatMessagesCodes } from "@dms/shared";
import { AppError } from "../../../shared/errors/AppError.js";
import { ChatUsecase } from "../chat.usecase.js";
import { chatRepository } from "../chat.repo.js";
import { registerMessageHandlers } from "../handlers/message.handler.js";
import { registerRoomHandlers } from "../handlers/room.handler.js";

const usecase = new ChatUsecase();

function fakeSocket() {
  const handlers = new Map();
  const socket = {
    id: "socket-1",
    rooms: new Set(["socket-1"]),
    on: vi.fn((event, handler) => handlers.set(event, handler)),
    emit: vi.fn(),
    join: vi.fn((room) => socket.rooms.add(room)),
    leave: vi.fn((room) => socket.rooms.delete(room)),
    to: vi.fn(() => ({ emit: vi.fn() })),
  };
  return { socket, handlers };
}

beforeEach(() => {
  vi.clearAllMocks();
  chatRepository.getActiveMembersExcluding.mockResolvedValue([]);
  chatRepository.getUnreadMessages.mockResolvedValue([]);
  chatRepository.bulkMarkMessagesRead.mockResolvedValue({ count: 0 });
  chatRepository.updateMemberReadAt.mockResolvedValue({});
});

describe("socket identity and room joins", () => {
  it("ignores a caller-supplied reaction userId", async () => {
    const { socket, handlers } = fakeSocket();
    const addReaction = vi.fn();
    registerMessageHandlers(socket, {
      ctx: { kind: "staff", userId: 7, clientId: null },
      usecase: { addReaction },
    });

    await handlers.get("reaction:added")({
      roomId: 1,
      messageId: 2,
      emoji: "👍",
      userId: 999,
    });

    expect(addReaction).toHaveBeenCalledWith({
      roomId: 1,
      messageId: 2,
      emoji: "👍",
      userId: 7,
      clientId: null,
    });
  });

  it("lets a client token context join only its authorized room", async () => {
    const { socket, handlers } = fakeSocket();
    const checker = vi.fn().mockResolvedValue({ id: 5 });
    registerRoomHandlers(socket, {
      ctx: {
        kind: "client",
        userId: null,
        clientId: 9,
        allowedRoomId: 42,
      },
      usecase: { checkIfUserCanAccessRoom: checker },
    });

    await handlers.get("join_room_client")({ roomId: 99, clientId: 777 });
    expect(socket.join).not.toHaveBeenCalled();
    expect(checker).not.toHaveBeenCalled();

    await handlers.get("join_room_client")({ roomId: 42, clientId: 777 });
    expect(checker).toHaveBeenCalledWith({
      roomId: 42,
      authUserId: null,
      clientId: 9,
    });
    expect(socket.join).toHaveBeenCalledWith("room:42");
  });

  it("does not join a staff socket when room membership is denied", async () => {
    const { socket, handlers } = fakeSocket();
    const checker = vi.fn().mockRejectedValue(
      new AppError({
        code: chatMessagesCodes.ROOM_ACCESS_DENIED,
        statusCode: 403,
      }),
    );
    registerRoomHandlers(socket, {
      ctx: { kind: "staff", userId: 7, clientId: null },
      usecase: { checkIfUserCanAccessRoom: checker },
    });

    await handlers.get("join_room")({ roomId: 42, userId: 999 });
    expect(checker).toHaveBeenCalledWith({ roomId: 42, authUserId: 7 });
    expect(socket.join).not.toHaveBeenCalled();
  });
});

describe("chat operation authorization", () => {
  it("rejects send, pin, and mark-read for a non-member", async () => {
    chatRepository.getMember.mockResolvedValue(null);

    await expect(
      usecase.sendMessage({ roomId: 1, userId: 7, content: "hello" }),
    ).rejects.toMatchObject({ code: chatMessagesCodes.ROOM_ACCESS_DENIED });
    await expect(
      usecase.pinMessage({ roomId: 1, messageId: 2, userId: 7 }),
    ).rejects.toMatchObject({ code: chatMessagesCodes.ROOM_ACCESS_DENIED });
    await expect(
      usecase.markRoomRead(1, 7, null),
    ).rejects.toMatchObject({ code: chatMessagesCodes.ROOM_ACCESS_DENIED });
    chatRepository.getMessageById.mockResolvedValue({ id: 2, roomId: 1 });
    await expect(
      usecase.addReaction({
        roomId: 1,
        messageId: 2,
        userId: 7,
        emoji: "👍",
      }),
    ).rejects.toMatchObject({ code: chatMessagesCodes.ROOM_ACCESS_DENIED });
  });

  it("rejects cross-room message IDs for read, reaction, and pin", async () => {
    chatRepository.getMember.mockResolvedValue({ id: 10, role: "ADMIN" });
    chatRepository.getMessageById.mockResolvedValue({ id: 2, roomId: 99 });

    await expect(
      usecase.markMessageRead(1, 2, 7, null),
    ).rejects.toMatchObject({ code: chatMessagesCodes.MESSAGE_NOT_FOUND });
    await expect(
      usecase.addReaction({
        roomId: 1,
        messageId: 2,
        userId: 7,
        emoji: "👍",
      }),
    ).rejects.toMatchObject({ code: chatMessagesCodes.MESSAGE_NOT_FOUND });
    await expect(
      usecase.pinMessage({ roomId: 1, messageId: 2, userId: 7 }),
    ).rejects.toMatchObject({ code: chatMessagesCodes.MESSAGE_NOT_FOUND });
  });

  it("requires access to every forwarded source and destination room", async () => {
    chatRepository.getMessagesForForward.mockResolvedValue([
      { id: 2, roomId: 2, content: "source", type: "TEXT", attachments: [] },
    ]);
    chatRepository.getMember.mockImplementation(async ({ roomId }) =>
      Number(roomId) === 2 ? null : { id: 10, role: "MEMBER" },
    );

    await expect(
      usecase.forwardMessages({ roomsIds: [3], messageIds: [2], userId: 7 }),
    ).rejects.toMatchObject({ code: chatMessagesCodes.ROOM_ACCESS_DENIED });

    chatRepository.getMember.mockImplementation(async ({ roomId }) =>
      Number(roomId) === 3 ? null : { id: 10, role: "MEMBER" },
    );
    await expect(
      usecase.forwardMessages({ roomsIds: [3], messageIds: [2], userId: 7 }),
    ).rejects.toMatchObject({ code: chatMessagesCodes.ROOM_ACCESS_DENIED });
  });

  it("rejects non-member calls and cross-room call IDs", async () => {
    chatRepository.getMember.mockResolvedValue(null);
    await expect(
      usecase.initiateCall({ roomId: 1, callType: "AUDIO", userId: 7 }),
    ).rejects.toMatchObject({ code: chatMessagesCodes.ROOM_ACCESS_DENIED });

    chatRepository.getMember.mockResolvedValue({ id: 10, role: "MEMBER" });
    chatRepository.getCallById.mockResolvedValue({ id: 5, roomId: 99 });
    await expect(
      usecase.answerCall({ callId: 5, roomId: 1, userId: 7 }),
    ).rejects.toMatchObject({ code: chatMessagesCodes.ROOM_ACCESS_DENIED });
    await expect(
      usecase.endCall({ callId: 5, roomId: 1, userId: 7 }),
    ).rejects.toMatchObject({ code: chatMessagesCodes.ROOM_ACCESS_DENIED });
  });

  it("preserves a valid member message flow", async () => {
    chatRepository.getMember.mockResolvedValue({ id: 10, role: "MEMBER" });
    chatRepository.findRoomBasic.mockResolvedValue({
      id: 1,
      isChatEnabled: true,
      allowFiles: true,
    });
    chatRepository.createMessage.mockResolvedValue({
      id: 20,
      roomId: 1,
      content: "hello",
    });

    await expect(
      usecase.sendMessage({ roomId: 1, userId: 7, content: "hello" }),
    ).resolves.toMatchObject({ id: 20, roomId: 1 });
    expect(chatRepository.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({ roomId: 1, senderId: 7, memberId: 10 }),
    );
    expect(to).toHaveBeenCalledWith("room:1");
  });
});

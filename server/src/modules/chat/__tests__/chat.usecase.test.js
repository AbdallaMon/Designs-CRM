import { describe, it, expect, vi, beforeEach } from "vitest";

// The usecase imports `getIo` from the socket infra, whose module graph pulls in
// the Prisma client + env validation. None of the methods under test emit, so we
// stub the socket infra to keep the unit tests isolated and fast.
vi.mock("../../../infra/socket/index.js", () => ({
  getIo: () => ({ to: () => ({ emit: () => {} }) }),
}));

// The usecase mixins now call the directly-imported `chatRepository` singleton
// (no constructor injection). Mock the repo module and configure per test.
vi.mock("../chat.repo.js", () => ({
  chatRepository: {
    getMember: vi.fn(),
    getRoomById: vi.fn(),
    getRooms: vi.fn(),
    countUnreadMessages: vi.fn(),
  },
}));

import { ChatUsecase } from "../chat.usecase.js";
import { chatRepository } from "../chat.repo.js";
import { computeRoomCapabilities } from "../chat.dto.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { PERMISSIONS, chatMessagesCodes } from "@dms/shared";

const usecase = new ChatUsecase();

beforeEach(() => {
  vi.clearAllMocks();
  chatRepository.countUnreadMessages.mockResolvedValue(0);
});

describe("ChatUsecase.checkIfUserCanAccessRoom (scope / IDOR gate)", () => {
  it("returns the membership row for a member", async () => {
    const member = { id: 10, roomId: 1, userId: 7, role: "MEMBER" };
    chatRepository.getMember.mockResolvedValue(member);

    const result = await usecase.checkIfUserCanAccessRoom({
      roomId: 1,
      authUserId: 7,
    });

    expect(result).toBe(member);
    expect(chatRepository.getMember).toHaveBeenCalledWith({
      roomId: 1,
      userId: 7,
      clientId: null,
    });
  });

  it("THROWS AppError(403, ROOM_ACCESS_DENIED) for a non-member", async () => {
    chatRepository.getMember.mockResolvedValue(null);

    await expect(
      usecase.checkIfUserCanAccessRoom({ roomId: 1, authUserId: 999 }),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: chatMessagesCodes.ROOM_ACCESS_DENIED,
    });
    // It must THROW (not resolve falsy) — requireSpecialChecker only catches throws.
    await expect(
      usecase.checkIfUserCanAccessRoom({ roomId: 1, authUserId: 999 }),
    ).rejects.toBeInstanceOf(AppError);
  });
});

describe("computeRoomCapabilities (per-record capabilities)", () => {
  const ADMIN_PERMS = [
    PERMISSIONS.CHAT.ROOM_EDIT,
    PERMISSIONS.CHAT.ROOM_DELETE,
    PERMISSIONS.CHAT.MEMBER_MANAGE,
    PERMISSIONS.CHAT.MESSAGE_SEND,
  ];

  it("grants edit/delete/manage to a room ADMIN with the codes", () => {
    const caps = computeRoomCapabilities(
      { id: 1, createdById: 7, type: "GROUP", isChatEnabled: true, allowFiles: true, clientLeadId: 5 },
      { permissions: ADMIN_PERMS, authUserId: 7, selfMember: { role: "ADMIN" } },
    );
    expect(caps).toMatchObject({
      canEdit: true,
      canDelete: true,
      canManageMembers: true,
      canManageClient: true,
      canSendMessage: true,
      canUploadFiles: true,
    });
  });

  it("denies delete on a STAFF_TO_STAFF room even for an ADMIN (matches usecase guard)", () => {
    const caps = computeRoomCapabilities(
      { id: 2, createdById: 7, type: "STAFF_TO_STAFF", isChatEnabled: true },
      { permissions: ADMIN_PERMS, authUserId: 7, selfMember: { role: "ADMIN" } },
    );
    expect(caps.canDelete).toBe(false);
    // edit is allowed in STAFF_TO_STAFF for any member (mirrors updateRoom)
    expect(caps.canEdit).toBe(true);
  });

  it("denies management actions to a plain MEMBER", () => {
    const caps = computeRoomCapabilities(
      { id: 3, createdById: 99, type: "GROUP", isChatEnabled: true, allowFiles: true },
      { permissions: ADMIN_PERMS, authUserId: 7, selfMember: { role: "MEMBER" } },
    );
    expect(caps.canDelete).toBe(false);
    expect(caps.canManageMembers).toBe(false);
    expect(caps.canEdit).toBe(false);
  });

  it("respects missing permission codes (no edit code → canEdit false)", () => {
    const caps = computeRoomCapabilities(
      { id: 4, createdById: 7, type: "GROUP" },
      { permissions: [], authUserId: 7, selfMember: { role: "ADMIN" } },
    );
    expect(caps.canEdit).toBe(false);
    expect(caps.canDelete).toBe(false);
  });

  it("disables send/upload when chat or files are off", () => {
    const caps = computeRoomCapabilities(
      { id: 5, type: "GROUP", isChatEnabled: false, allowFiles: false },
      { permissions: [PERMISSIONS.CHAT.MESSAGE_SEND], authUserId: 7, selfMember: { role: "MEMBER" } },
    );
    expect(caps.canSendMessage).toBe(false);
    expect(caps.canUploadFiles).toBe(false);
  });
});

describe("ChatUsecase.getRooms (normalized list envelope + capabilities)", () => {
  it("returns { items, total, page, pageSize } with per-room capabilities", async () => {
    const room = {
      id: 1,
      createdById: 7,
      type: "GROUP",
      isChatEnabled: true,
      allowFiles: true,
      members: [{ id: 10, userId: 7, role: "ADMIN" }],
      messages: [{ id: 100, content: "hi" }],
    };
    chatRepository.getRooms.mockResolvedValue({ rooms: [room], total: 1 });
    chatRepository.countUnreadMessages.mockResolvedValue(3);

    const result = await usecase.getRooms(
      { id: 7, permissions: [PERMISSIONS.CHAT.ROOM_EDIT, PERMISSIONS.CHAT.MEMBER_MANAGE] },
      { page: 2, limit: 10 },
    );

    expect(result).toMatchObject({ total: 1, page: 2, pageSize: 10, totalUnread: 3 });
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toHaveProperty("capabilities");
    expect(result.items[0].capabilities.canEdit).toBe(true);
    expect(result.items[0].unreadCount).toBe(3);
    expect(result.items[0].lastMessage).toMatchObject({ id: 100 });
  });
});

describe("ChatUsecase.getRoomById (scope + capabilities on detail)", () => {
  it("throws ROOM_ACCESS_DENIED when caller is not a member", async () => {
    chatRepository.getMember.mockResolvedValue(null);
    await expect(
      usecase.getRoomById(1, { id: 5, permissions: [] }, null),
    ).rejects.toMatchObject({ statusCode: 403, message: chatMessagesCodes.ROOM_ACCESS_DENIED });
  });

  it("attaches capabilities + selfMember on success", async () => {
    const selfMember = { id: 10, userId: 7, role: "ADMIN" };
    const room = {
      id: 1,
      createdById: 7,
      type: "GROUP",
      isChatEnabled: true,
      allowFiles: true,
      members: [selfMember],
    };
    chatRepository.getMember.mockResolvedValue(selfMember);
    chatRepository.getRoomById.mockResolvedValue(room);

    const result = await usecase.getRoomById(
      1,
      { id: 7, permissions: [PERMISSIONS.CHAT.ROOM_EDIT] },
      null,
    );
    expect(result.selfMember).toBe(selfMember);
    expect(result.capabilities.canEdit).toBe(true);
  });
});

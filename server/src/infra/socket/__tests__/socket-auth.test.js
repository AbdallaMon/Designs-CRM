import { describe, expect, it, vi } from "vitest";
import { authMessagesCodes, chatMessagesCodes } from "@dms/shared";
import {
  authenticateSocket,
  isAllowedSocketRequest,
  joinSocketIdentityRoom,
} from "../socket.auth.js";

function makeSocket({ cookie = null, auth = {}, query = {} } = {}) {
  return {
    handshake: { auth, query, headers: cookie ? { cookie } : {} },
    request: { headers: cookie ? { cookie } : {} },
    join: vi.fn(),
  };
}

const profile = {
  key: "NORMAL_SALES",
  family: "SALES",
  isAdminTier: false,
  permissions: ["chat.room.list"],
  permissionsByModule: { chat: { room: { list: true } } },
};

describe("socket handshake authentication", () => {
  it("rejects requests with no Origin", () => {
    expect(
      isAllowedSocketRequest({ headers: {} }, ["https://crm.example"]),
    ).toBe(false);
  });

  it("rejects missing and invalid staff credentials", async () => {
    await expect(authenticateSocket(makeSocket())).rejects.toMatchObject({
      code: authMessagesCodes.UNAUTHORIZED,
      statusCode: 401,
    });

    await expect(
      authenticateSocket(makeSocket({ cookie: "access_token=bad" }), {
        verifyAccess: () => {
          throw new Error("bad token");
        },
      }),
    ).rejects.toMatchObject({
      code: authMessagesCodes.INVALID_TOKEN,
      statusCode: 401,
    });
  });

  it("derives staff identity from the access token and ignores query impersonation", async () => {
    const socket = makeSocket({
      cookie: "access_token=valid",
      query: { userId: "999", clientId: "888" },
    });
    const ctx = await authenticateSocket(socket, {
      verifyAccess: () => ({
        id: 7,
        name: "Real User",
        isActive: true,
        currentProfileId: 3,
      }),
      resolveProfile: (id) => (id === 3 ? profile : null),
    });

    expect(ctx).toMatchObject({
      kind: "staff",
      userId: 7,
      clientId: null,
    });
    joinSocketIdentityRoom(socket, ctx);
    expect(socket.join).toHaveBeenCalledTimes(1);
    expect(socket.join).toHaveBeenCalledWith("user:7");
  });

  it("derives a client and its only allowed room from the purpose-scoped token", async () => {
    const socket = makeSocket({
      auth: { chatToken: "room-token" },
      query: { userId: "999", clientId: "888" },
    });
    const ctx = await authenticateSocket(socket, {
      findRoomByAccessToken: async (token) =>
        token === "room-token"
          ? {
              room: { id: 42 },
              chatMember: {
                clientId: 9,
                client: { id: 9, name: "Client" },
              },
            }
          : null,
    });

    expect(ctx).toMatchObject({
      kind: "client",
      userId: null,
      clientId: 9,
      allowedRoomId: 42,
    });
    joinSocketIdentityRoom(socket, ctx);
    expect(socket.join).toHaveBeenCalledTimes(1);
    expect(socket.join).toHaveBeenCalledWith("room:42");
  });

  it("rejects an invalid client chat token", async () => {
    await expect(
      authenticateSocket(makeSocket({ auth: { chatToken: "bad" } }), {
        findRoomByAccessToken: async () => null,
      }),
    ).rejects.toMatchObject({
      code: chatMessagesCodes.INVALID_ROOM_TOKEN,
      statusCode: 401,
    });
  });
});

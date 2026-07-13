import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Guards the socket-resolution wiring. The old static cycle
 *   infra/socket/index.js → chat.socket.js → chat.usecase.js → chat.usecase.*.js
 *   → infra/socket/index.js
 * was broken by moving `getIo` into the dependency-free leaf
 * `infra/socket/io-registry.js`, which the realtime emit helpers now import
 * statically. These tests prove resolution still yields the live io instance and
 * emits to each member's room exactly as before.
 */

const { emit, to, getIo } = vi.hoisted(() => {
  const emit = vi.fn();
  const to = vi.fn(() => ({ emit }));
  const getIo = vi.fn(() => ({ to }));
  return { emit, to, getIo };
});

vi.mock("../../../infra/socket/io-registry.js", () => ({ getIo }));

// Repository I/O now goes through the directly-imported `chatRepository`
// singleton — mock the module and configure the members per test.
vi.mock("../chat.repo.js", () => ({
  chatRepository: {
    getActiveMembers: vi.fn(),
    getActiveMembersExcluding: vi.fn(),
  },
}));

import { ChatUsecase } from "../chat.usecase.js";
import { chatRepository } from "../chat.repo.js";

const usecase = new ChatUsecase();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ChatUsecase realtime emit helpers (lazy-resolved io)", () => {
  it("emitToAllMembers emits the event to every member's user/client room", async () => {
    chatRepository.getActiveMembers.mockResolvedValue([
      { userId: 7, clientId: null },
      { userId: null, clientId: "c-1" },
    ]);

    await usecase.emitToAllMembers({
      roomId: 1,
      event: "notification:test",
      content: { hello: "world" },
    });

    expect(getIo).toHaveBeenCalled();
    expect(chatRepository.getActiveMembers).toHaveBeenCalledWith(1);
    expect(to).toHaveBeenCalledWith("user:7");
    expect(to).toHaveBeenCalledWith("client:c-1");
    expect(emit).toHaveBeenCalledWith("notification:test", { hello: "world" });
    expect(emit).toHaveBeenCalledTimes(2);
  });

  it("emitToAllMembersExcluding forwards the exclusion filter to the repo", async () => {
    chatRepository.getActiveMembersExcluding.mockResolvedValue([
      { userId: 9, clientId: null },
    ]);

    await usecase.emitToAllMembersExcluding({
      roomId: 2,
      userId: 3,
      clientId: null,
      event: "notification:x",
      content: { a: 1 },
    });

    expect(chatRepository.getActiveMembersExcluding).toHaveBeenCalledWith({
      roomId: 2,
      userId: 3,
      clientId: null,
    });
    expect(to).toHaveBeenCalledWith("user:9");
    expect(emit).toHaveBeenCalledWith("notification:x", { a: 1 });
  });
});

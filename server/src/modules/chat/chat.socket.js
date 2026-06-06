import { ChatRepository } from "./chat.repository.js";
import { ChatUsecase } from "./chat.usecase.js";
import { registerPresenceHandlers } from "./handlers/presence.handler.js";
import { registerRoomHandlers } from "./handlers/room.handler.js";
import { registerTypingHandlers } from "./handlers/typing.handler.js";
import { registerMessageHandlers } from "./handlers/message.handler.js";
import { registerCallHandlers } from "./handlers/call.handler.js";

// Single instances shared across all socket connections for this process
const chatRepository = new ChatRepository();
const chatUsecase = new ChatUsecase(chatRepository);

// Shared typing-debounce map (survives across connections)
const typingTimeouts = new Map();

/**
 * Register all chat-related socket event handlers for a given connection.
 *
 * @param {import("socket.io").Socket} socket
 * @param {{ io: import("socket.io").Server, ctx: { userId: number|null, clientId: string|null } }} deps
 */
export function registerChatSocketHandlers(socket, { io, ctx }) {
  registerPresenceHandlers(socket, { io, ctx, usecase: chatUsecase });
  registerRoomHandlers(socket, { ctx, usecase: chatUsecase });
  registerTypingHandlers(socket, { ctx, typingTimeouts, usecase: chatUsecase });
  registerMessageHandlers(socket, { ctx, usecase: chatUsecase });
  registerCallHandlers(socket, { io, ctx, usecase: chatUsecase });

  // Clean up typing timeouts on disconnect
  socket.on("disconnect", () => {
    typingTimeouts.forEach((timeout, key) => {
      const prefix = ctx.clientId ? `${ctx.clientId}_` : `${ctx.userId}-`;
      if (key.startsWith(prefix)) {
        clearTimeout(timeout);
        typingTimeouts.delete(key);
      }
    });
  });
}

// Export instances so the HTTP route file can reuse them without creating a second set
export { chatUsecase, chatRepository };

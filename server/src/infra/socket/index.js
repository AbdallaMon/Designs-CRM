import { Server } from "socket.io";
import { allowedOrigins } from "../../config/env.js";
import { normalizeOrigin } from "./socket.helpers.js";
import { registerChatSocketHandlers } from "../../modules/chat/chat.socket.js";
import { setIo, getIo } from "./io-registry.js";
import { generalMessagesCodes } from "@dms/shared";
import {
  authenticateSocket,
  isAllowedSocketRequest,
  joinSocketIdentityRoom,
  toSocketConnectError,
} from "./socket.auth.js";

/**
 * Initialises Socket.IO on the given HTTP server.
 * Call once at startup before httpServer.listen().
 *
 * @param {import("http").Server} httpServer
 */
export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    // Gate connections at the handshake level so unapproved origins never reach the server
    allowRequest: (req, callback) => {
      const origin = normalizeOrigin(req.headers.origin);
      req.headers.origin = origin; // normalise for downstream middleware
      const allowed = isAllowedSocketRequest(req, allowedOrigins);
      callback(allowed ? null : generalMessagesCodes.UNAUTHORIZED, allowed);
    },
    cors: {
      origin: true, // fine-grained control is handled by allowRequest above
      credentials: true,
    },
  });

  // Publish the instance to the leaf registry so usecases resolve it without a cycle.
  setIo(io);

  io.use(async (socket, next) => {
    try {
      const ctx = await authenticateSocket(socket);
      socket.data.chat = ctx;
      joinSocketIdentityRoom(socket, ctx);
      return next();
    } catch (error) {
      return next(toSocketConnectError(error));
    }
  });

  // Override Access-Control-Allow-Origin with the normalised origin on every response
  io.engine.on("headers", (headers, req) => {
    const origin = normalizeOrigin(req.headers.origin);
    if (origin && allowedOrigins.includes(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Access-Control-Allow-Credentials"] = "true";
      headers["Vary"] = "Origin";
    }
  });

  io.on("connection", (socket) => {
    const ctx = socket.data.chat;

    // Delegate all chat-related events to the chat module
    registerChatSocketHandlers(socket, { io, ctx });
  });
}

// getIo lives in the leaf ./io-registry.js (cycle-free); re-exported here so existing
// importers of this module keep working.
export { getIo };

export { normalizeOrigin };

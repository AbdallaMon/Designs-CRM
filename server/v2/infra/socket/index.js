import { Server } from "socket.io";
import { allowedOrigins } from "../../config/env.js";
import { normalizeOrigin } from "./socket.helpers.js";
import { registerChatSocketHandlers } from "../../modules/chat/chat.socket.js";

let io;

/**
 * Initialises Socket.IO on the given HTTP server.
 * Call once at startup before httpServer.listen().
 *
 * @param {import("http").Server} httpServer
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    // Gate connections at the handshake level so unapproved origins never reach the server
    allowRequest: (req, callback) => {
      const origin = normalizeOrigin(req.headers.origin);
      req.headers.origin = origin; // normalise for downstream middleware
      const allowed = !origin || allowedOrigins.includes(origin);
      callback(allowed ? null : "Not allowed by CORS", allowed);
    },
    cors: {
      origin: true, // fine-grained control is handled by allowRequest above
      credentials: true,
    },
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
    // Build a mutable context object shared by all handlers for this socket session.
    // Presence handler may override userId/clientId when "online" fires.
    const ctx = {
      userId: Number(socket.handshake.query.userId) || null,
      clientId: socket.handshake.query.clientId || null,
    };

    // Join initial rooms from handshake query
    if (ctx.userId) {
      socket.join(`user:${ctx.userId}`);
    } else if (ctx.clientId) {
      socket.join(`client:${ctx.clientId}`);
    }

    // Delegate all chat-related events to the chat module
    registerChatSocketHandlers(socket, { io, ctx });
  });
}

/**
 * Returns the active Socket.IO server instance.
 * Throws if initSocket has not been called yet.
 */
export function getIo() {
  if (!io) throw new Error("Socket.IO not initialised — call initSocket first");
  return io;
}

export { normalizeOrigin };

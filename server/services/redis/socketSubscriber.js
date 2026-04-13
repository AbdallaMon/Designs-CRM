// socketSubscriber.js
// Run this once in the main server process (index.js).
// Subscribes to the Redis "socket:emit" channel and forwards events to the
// real Socket.IO instance so any worker process can trigger socket emits.
import Redis from "ioredis";
import dotenv from "dotenv";
import { CHANNEL } from "./socketPublisher.js";
dotenv.config();

let sub = null;

/**
 * @param {import('socket.io').Server} io - the Socket.IO server instance
 */
export function startSocketSubscriber(io) {
  if (sub) return; // already started

  sub = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
  });

  sub.subscribe(CHANNEL, (err) => {
    if (err) {
      console.error(
        "❌ Failed to subscribe to socket:emit channel:",
        err.message,
      );
    } else {
      console.log(
        `✅ Socket subscriber listening on Redis channel "${CHANNEL}"`,
      );
    }
  });

  sub.on("message", (_channel, raw) => {
    try {
      const { event, room, data } = JSON.parse(raw);
      if (!io) {
        console.warn(
          "⚠️ Socket subscriber: io not ready yet, dropping event:",
          event,
        );
        return;
      }
      if (room) {
        console.log(`Emitting socket event "${event}" to room "${room}"`);
        io.to(room).emit(event, data);
        console.log(
          `Event "${event}" emitted to room "${room}" with data:`,
          data,
        );
      } else {
        io.emit(event, data);
      }
    } catch (e) {
      console.error("❌ Socket subscriber message parse error:", e.message);
    }
  });
}

// socketPublisher.js
// Used by worker processes to publish socket events to the main server.
// A subscriber in the main server picks these up and forwards to the real io.
import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const pub = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
});

const CHANNEL = "socket:emit";

/**
 * @param {string} event  - Socket event name (e.g. "notification")
 * @param {string|null} room  - Room/user id to emit to, or null for broadcast
 * @param {any} data  - Payload
 */
export async function publishToSocket(event, room, data) {
  try {
    await pub.publish(CHANNEL, JSON.stringify({ event, room, data }));
  } catch (e) {
    console.error("Failed to publish socket event:", e);
  }
}

export { CHANNEL };

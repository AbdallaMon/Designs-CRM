// Single source of truth for ioredis connection options + factory.
//
// WHY TWO REDIS LIBRARIES REMAIN:
//   - `redis` (node-redis) backs the cache layer (`redis.client.js` + `cache.service.js`).
//   - `ioredis` backs BullMQ (which requires an ioredis-compatible connection) AND the
//     cross-process Socket.IO pub/sub adapter (`services/redis/socketPublisher.js` /
//     `socketSubscriber.js`).
// BullMQ does not support node-redis, so the two libraries cannot collapse to one. What we
// DO consolidate is the connection *configuration*: every ioredis client (BullMQ workers,
// queues, the socket publisher and subscriber) now reads from this one module instead of
// each calling `new Redis({ ... process.env ... })` with its own ad-hoc config.
import IORedis from "ioredis";
import { env } from "../../config/env.js";

/**
 * Plain ioredis connection options, derived from the central env config.
 * @returns {{ host: string, port: number, username?: string, password?: string }}
 */
export function getIoredisOptions() {
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    ...(env.REDIS_USERNAME ? { username: env.REDIS_USERNAME } : {}),
    ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
  };
}

/**
 * Creates a new ioredis client from the shared options.
 * BullMQ requires `maxRetriesPerRequest: null` on its connection; pub/sub clients do not
 * use that flag, so it is opt-in per caller.
 *
 * @param {import("ioredis").RedisOptions} [overrides]
 * @returns {import("ioredis").Redis}
 */
export function createIoredisClient(overrides = {}) {
  return new IORedis({ ...getIoredisOptions(), ...overrides });
}

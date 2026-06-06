import { getIoredisOptions } from "./ioredis.connection.js";

/**
 * BullMQ-compatible options object.
 * Use as: new Queue("name", bullmqConnection)
 * Or spread: new Queue("name", { ...bullmqConnection, limiter: { ... } })
 *
 * Connection config comes from the single ioredis factory (`ioredis.connection.js`) so
 * BullMQ, the socket pub/sub and any other ioredis consumer share one configuration.
 */
export default { connection: getIoredisOptions() };

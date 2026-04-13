import { env } from "../../config/env.js";

const connectionConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
};

/**
 * BullMQ-compatible options object.
 * Use as: new Queue("name", bullmqConnection)
 * Or spread: new Queue("name", { ...bullmqConnection, limiter: { ... } })
 */
export default { connection: connectionConfig };

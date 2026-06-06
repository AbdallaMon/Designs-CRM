// DEPRECATED legacy shim. Not imported by live code (only by the equally-dead
// `services/redis/redis.js`). Canonical BullMQ connection now lives at
// `src/infra/redis/bullmq.connection.js`, sourced from the single ioredis factory.
// Kept resolvable so any stale legacy import does not break.
export { default } from "../../src/infra/redis/bullmq.connection.js";

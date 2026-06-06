// DEPRECATED legacy shim. Not imported by live code. A bare ioredis client was historically
// exported here; canonical ioredis clients are now built via the single factory at
// `src/infra/redis/ioredis.connection.js`. Kept resolvable for any stale legacy import.
import { createIoredisClient } from "../../src/infra/redis/ioredis.connection.js";

const redis = createIoredisClient();

export default redis;

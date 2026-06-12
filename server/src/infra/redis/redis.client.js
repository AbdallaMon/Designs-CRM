import { createClient } from "redis";
import { redisConfig } from "../../config/redis.config.js";

const redisClient = createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
  },
  ...(redisConfig.username ? { username: redisConfig.username } : {}),
  ...(redisConfig.password ? { password: redisConfig.password } : {}),
});

redisClient.on("error", (error) => {
  console.error("Redis Client Error:", error);
});

export async function connectRedis() {
  await redisClient.connect();
  console.log("✅ Redis client connected");
}

export default redisClient;

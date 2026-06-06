import redisClient from "./redis.client.js";

class RedisService {
  async set(key, value, ttlInSeconds = null) {
    const preparedValue =
      typeof value === "string" ? value : JSON.stringify(value);

    if (ttlInSeconds) {
      await redisClient.set(key, preparedValue, {
        EX: ttlInSeconds,
      });
      return;
    }

    await redisClient.set(key, preparedValue);
  }

  async get(key) {
    const value = await redisClient.get(key);

    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async del(key) {
    return await redisClient.del(key);
  }

  async exists(key) {
    return await redisClient.exists(key);
  }

  async update(key, value, ttlInSeconds = null) {
    const exists = await redisClient.exists(key);

    if (!exists) {
      return null;
    }

    await this.set(key, value, ttlInSeconds);
    return await this.get(key);
  }

  async expire(key, ttlInSeconds) {
    return await redisClient.expire(key, ttlInSeconds);
  }

  async ttl(key) {
    return await redisClient.ttl(key);
  }

  async increment(key) {
    return await redisClient.incr(key);
  }

  async decrement(key) {
    return await redisClient.decr(key);
  }
}

export const redisService = new RedisService();

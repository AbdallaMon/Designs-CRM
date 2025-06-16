// redis/redis.js
import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();
// redis/redis.js
import connection from "./bullmqConnection.js";

const redis = new Redis(connection);

export default redis;

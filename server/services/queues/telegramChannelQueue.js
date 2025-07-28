import { Queue } from "bullmq";
import connection from "../redis/bullmqConnection.js";

export const telegramChannelQueue = new Queue("telegram-channel-queue", {
  ...connection,
  limiter: {
    max: 1,
    duration: 30_000,
  },
});

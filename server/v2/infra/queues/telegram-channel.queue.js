import { Queue } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";

export const telegramChannelQueue = new Queue("telegram-channel-queue", {
  ...bullmqConnection,
  limiter: {
    max: 1,
    duration: 10_000,
  },
});

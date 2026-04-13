import { Queue } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";

export const telegramMessageQueue = new Queue("telegram-message-queue", {
  ...bullmqConnection,
  limiter: {
    max: 1,
    duration: 10_000,
  },
});

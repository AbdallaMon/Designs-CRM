import { Queue } from "bullmq";
import connection from "../redis/bullmqConnection.js";

export const telegramMessageQueue = new Queue("telegram-message-queue", {
  ...connection,
  limiter: {
    max: 1,
    duration: 10_000,
  },
});

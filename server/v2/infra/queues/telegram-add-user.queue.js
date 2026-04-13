import { Queue } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";

export const telegramAddUserQueue = new Queue("telegram-user-queue", {
  ...bullmqConnection,
  limiter: {
    max: 1,
    duration: 5_000,
  },
});

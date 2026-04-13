import { Queue } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";

export const telegramCronQueue = new Queue("telegram-cron-queue", {
  ...bullmqConnection,
  limiter: {
    max: 1,
    duration: 5_000,
  },
});

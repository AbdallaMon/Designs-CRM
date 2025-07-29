import { Queue } from "bullmq";
import connection from "../redis/bullmqConnection.js";

export const telegramCronQueue = new Queue("telegram-cron-queue", {
  ...connection,
  limiter: {
    max: 1,
    duration: 5000,
  },
});

import { Queue } from "bullmq";
import connection from "../redis/bullmqConnection.js";

export const telegramAddUserQueue = new Queue("telegram-user-queue", {
  ...connection,
  limiter: {
    max: 1,
    duration: 5000,
  },
});

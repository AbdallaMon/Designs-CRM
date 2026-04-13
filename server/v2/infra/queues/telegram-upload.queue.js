import { Queue } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";

export const telegramUploadQueue = new Queue("telegram-upload-queue", {
  ...bullmqConnection,
  limiter: {
    max: 1,
    duration: 10_000,
  },
});

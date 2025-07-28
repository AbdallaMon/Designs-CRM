import { Queue } from "bullmq";
import connection from "../redis/bullmqConnection.js";

export const telegramUploadQueue = new Queue("telegram-upload-queue", {
  ...connection,
  limiter: {
    max: 1,
    duration: 10_000,
  },
});

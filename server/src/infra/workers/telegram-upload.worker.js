import { Worker } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";
import { uploadItemsToTele } from "../telegram/telegram-functions.js";
import { coonnectToTelegramV2 } from "../../modules/telegram/connect.js";
import { INTEGRATION_ERROR_CODES } from "@dms/shared";

export const telegramUploadWorker = new Worker(
  "telegram-upload-queue",
  async (job) => {
    const { clientLeadId } = job.data;
    await uploadItemsToTele({ clientLeadId });
  },
  { ...bullmqConnection, concurrency: 1 },
);

telegramUploadWorker.on("failed", async (job, err) => {
  if (err.message.includes(INTEGRATION_ERROR_CODES.AUTH_KEY_UNREGISTERED)) {
    await coonnectToTelegramV2();
  }
  console.error("❌ Failed in Telegram Upload worker:", err.message);
});

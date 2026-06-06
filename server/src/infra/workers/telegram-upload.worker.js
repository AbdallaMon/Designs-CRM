import { Worker } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";
import { uploadItemsToTele } from "../../../services/telegram/telegram-functions.js";
import { coonnectToTelegramV2 } from "../../modules/telegram/connect.js";

export const telegramUploadWorker = new Worker(
  "telegram-upload-queue",
  async (job) => {
    const { clientLeadId } = job.data;
    console.log(`🚀 Processing Telegram upload for Lead ID: ${clientLeadId}`);
    await uploadItemsToTele({ clientLeadId });
    console.log(`✅ Done with Lead ID: ${clientLeadId}`);
  },
  { ...bullmqConnection, concurrency: 1 },
);

telegramUploadWorker.on("failed", async (job, err) => {
  if (err.message.includes("AUTH_KEY_UNREGISTERED")) {
    await coonnectToTelegramV2();
    console.log("Reconnected to Telegram successfully!");
  }
  console.error("❌ Failed in Telegram Upload worker:", err.message);
});

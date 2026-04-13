import { Worker } from "bullmq";
import connection from "../redis/bullmqConnection.js";
import { uploadItemsToTele } from "../telegram/telegram-functions.js";
import { coonnectToTelegramV2 } from "../../v2/modules/telegram/connect.js";
// Connection is initialized once in start-telegram-system.js
export const telegramUploadWorker = new Worker(
  "telegram-upload-queue",
  async (job) => {
    try {
      const { clientLeadId } = job.data;
      console.log(`🚀 Processing Telegram upload for Lead ID: ${clientLeadId}`);
      await uploadItemsToTele({ clientLeadId });
      console.log(`✅ Done with Lead ID: ${clientLeadId}`);
    } catch (err) {
      if (err.message.includes("AUTH_KEY_UNREGISTERED")) {
        await coonnectToTelegramV2().then(() =>
          console.log("Reconnected to Telegram successfully!"),
        );
      }
      console.error("❌ Failed in Telegram upload worker:", err.message);
    }
  },
  {
    ...connection,
    concurrency: 1, // strictly one at a time
  },
);

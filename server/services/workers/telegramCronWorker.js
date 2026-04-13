import { Worker } from "bullmq";
import connection from "../redis/bullmqConnection.js";
import { getMeagsses } from "../telegram/telegram-functions.js";
import { coonnectToTelegramV2 } from "../../v2/modules/telegram/connect.js";
// await connectToTelegram();
export const telegramCronWorker = new Worker(
  "telegram-cron-queue",
  async (job) => {
    try {
      const { clientLeadId } = job.data;
      console.log(
        `🚀 Processing Telegram getting cron data for Lead ID: ${clientLeadId}`,
      );
      await getMeagsses({ clientLeadId });
      console.log(`✅ Done in cron worker Lead ID: ${clientLeadId}`);
    } catch (err) {
      if (err.message.includes("AUTH_KEY_UNREGISTERED")) {
        await coonnectToTelegramV2().then(() =>
          console.log("Reconnected to Telegram successfully!"),
        );
      }
      console.error("❌ Failed in Telegram cron worker:", err.message);
    }
  },
  {
    ...connection,
    concurrency: 1, // strictly one at a time
  },
);

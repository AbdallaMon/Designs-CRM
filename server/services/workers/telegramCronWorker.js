import { Worker } from "bullmq";
import connection from "../redis/bullmqConnection.js";
import { getMeagsses } from "../telegram/telegram-functions.js";
import { connectToTelegram } from "../telegram/connectToTelegram.js";
await connectToTelegram();
export const telegramWorker = new Worker(
  "telegram-cron-queue",
  async (job) => {
    try {
      const { clientLeadId } = job.data;
      console.log(
        `🚀 Processing Telegram getting cron data for Lead ID: ${clientLeadId}`
      );
      await getMeagsses({ clientLeadId });
      console.log(`✅ Done in cron worker Lead ID: ${clientLeadId}`);
    } catch (err) {
      console.error("❌ Failed in Telegram cron worker:", err.message);
    }
  },
  {
    ...connection,
    concurrency: 1, // strictly one at a time
  }
);

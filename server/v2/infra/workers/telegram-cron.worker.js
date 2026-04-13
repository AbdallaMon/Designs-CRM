import { Worker } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";
import { getMeagsses } from "../../../services/telegram/telegram-functions.js";
import { coonnectToTelegramV2 } from "../../modules/telegram/connect.js";

export const telegramCronWorker = new Worker(
  "telegram-cron-queue",
  async (job) => {
    const { clientLeadId } = job.data;
    console.log(
      `🚀 Processing Telegram cron data for Lead ID: ${clientLeadId}`,
    );
    await getMeagsses({ clientLeadId });
    console.log(`✅ Done in cron worker Lead ID: ${clientLeadId}`);
  },
  { ...bullmqConnection, concurrency: 1 },
);

telegramCronWorker.on("failed", async (job, err) => {
  if (err.message.includes("AUTH_KEY_UNREGISTERED")) {
    await coonnectToTelegramV2();
    console.log("Reconnected to Telegram successfully!");
  }
  console.error("❌ Failed in Telegram cron worker:", err.message);
});

import { Worker } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";
import { getMeagsses } from "../telegram/telegram-functions.js";
import { coonnectToTelegramV2 } from "../../modules/telegram/connect.js";
import { INTEGRATION_ERROR_CODES } from "@dms/shared";

export const telegramCronWorker = new Worker(
  "telegram-cron-queue",
  async (job) => {
    const { clientLeadId } = job.data;
    await getMeagsses({ clientLeadId });
  },
  { ...bullmqConnection, concurrency: 1 },
);

telegramCronWorker.on("failed", async (job, err) => {
  if (err.message.includes(INTEGRATION_ERROR_CODES.AUTH_KEY_UNREGISTERED)) {
    await coonnectToTelegramV2();
  }
  console.error("❌ Failed in Telegram cron worker:", err.message);
});

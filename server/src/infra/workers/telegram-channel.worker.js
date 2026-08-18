import { Worker } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";
import { createChannelAndAddUsers } from "../telegram/telegram-functions.js";
import { coonnectToTelegramV2 } from "../../modules/telegram/connect.js";
import { INTEGRATION_ERROR_CODES } from "@dms/shared";

export const telegramChannelWorker = new Worker(
  "telegram-channel-queue",
  async (job) => {
    const { clientLeadId } = job.data;
    await createChannelAndAddUsers({ clientLeadId });
  },
  { ...bullmqConnection, concurrency: 1 },
);

telegramChannelWorker.on("failed", async (job, err) => {
  if (err.message.includes(INTEGRATION_ERROR_CODES.AUTH_KEY_UNREGISTERED)) {
    await coonnectToTelegramV2();
  }
  console.error(`❌ Failed to create Telegram channel:`, err.message);
});

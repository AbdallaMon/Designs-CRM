import { Worker } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";
import { createChannelAndAddUsers } from "../../../services/telegram/telegram-functions.js";
import { coonnectToTelegramV2 } from "../../modules/telegram/connect.js";

export const telegramChannelWorker = new Worker(
  "telegram-channel-queue",
  async (job) => {
    const { clientLeadId } = job.data;
    console.log(`📦 Creating channel for lead: ${clientLeadId}`);
    await createChannelAndAddUsers({ clientLeadId });
    console.log(`✅ Channel created for lead: ${clientLeadId}`);
  },
  { ...bullmqConnection, concurrency: 1 },
);

telegramChannelWorker.on("failed", async (job, err) => {
  if (err.message.includes("AUTH_KEY_UNREGISTERED")) {
    await coonnectToTelegramV2();
    console.log("Reconnected to Telegram successfully!");
  }
  console.error(`❌ Failed to create Telegram channel:`, err.message);
});

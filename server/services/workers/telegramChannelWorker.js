import { Worker } from "bullmq";
import connection from "../redis/bullmqConnection.js";
import { createChannelAndAddUsers } from "../telegram/telegram-functions.js";
import { coonnectToTelegramV2 } from "../../v2/modules/telegram/connect.js";
// await connectToTelegram();
export const telegramChannelWorker = new Worker(
  "telegram-channel-queue",
  async (job) => {
    const { clientLeadId } = job.data;
    console.log(`📦 Creating channel for lead: ${clientLeadId}`);
    try {
      await createChannelAndAddUsers({ clientLeadId });
      console.log(`✅ Channel created for lead: ${clientLeadId}`);
    } catch (err) {
      if (err.message.includes("AUTH_KEY_UNREGISTERED")) {
        await coonnectToTelegramV2().then(() =>
          console.log("Reconnected to Telegram successfully!"),
        );
      }
      console.error(
        `❌ Failed to create channel for ${clientLeadId}:`,
        err.message,
      );
    }
  },
  {
    ...connection,
    concurrency: 1,
  },
);

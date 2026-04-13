import { Worker } from "bullmq";
import connection from "../redis/bullmqConnection.js";
import { addUserListToAChnnelUsingQueue } from "../telegram/telegram-functions.js";
import { coonnectToTelegramV2 } from "../../v2/modules/telegram/connect.js";
// await connectToTelegram();
export const telegramAddUserWorker = new Worker(
  "telegram-user-queue",
  async (job) => {
    try {
      const { clientLeadId, usersList } = job.data;
      console.log(
        `🚀 Processing Telegram Add user for users: ${usersList.length} ClientLead ID: ${clientLeadId}`,
      );
      await addUserListToAChnnelUsingQueue({ clientLeadId, usersList });
      console.log(
        `✅ Done with user: ${usersList.length} ClientLead ID: ${clientLeadId}`,
      );
    } catch (err) {
      if (err.message.includes("AUTH_KEY_UNREGISTERED")) {
        await coonnectToTelegramV2().then(() =>
          console.log("Reconnected to Telegram successfully!"),
        );
      }
      console.error("❌ Failed in Telegram Add user worker:", err.message);
    }
  },
  {
    ...connection,
    concurrency: 1, // strictly one at a time
  },
);

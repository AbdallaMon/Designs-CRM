import { Worker } from "bullmq";
import connection from "../redis/bullmqConnection.js";
import { addUserListToAChnnelUsingQueue } from "../telegram/telegram-functions.js";
import { connectToTelegram } from "../telegram/connectToTelegram.js";
// await connectToTelegram();
export const telegramAddUserWorker = new Worker(
  "telegram-user-queue",
  async (job) => {
    try {
      const { clientLeadId, usersList } = job.data;
      console.log(
        `🚀 Processing Telegram Add user for users: ${usersList.length} ClientLead ID: ${clientLeadId}`
      );
      await addUserListToAChnnelUsingQueue({ clientLeadId, usersList });
      console.log(
        `✅ Done with user: ${usersList.length} ClientLead ID: ${clientLeadId}`
      );
    } catch (err) {
      console.error("❌ Failed in Telegram Add user worker:", err.message);
    }
  },
  {
    ...connection,
    concurrency: 1, // strictly one at a time
  }
);

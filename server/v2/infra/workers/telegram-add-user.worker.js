import { Worker } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";
import { addUserListToAChnnelUsingQueue } from "../../../services/telegram/telegram-functions.js";
import { coonnectToTelegramV2 } from "../../modules/telegram/connect.js";

export const telegramAddUserWorker = new Worker(
  "telegram-user-queue",
  async (job) => {
    const { clientLeadId, usersList } = job.data;
    console.log(
      `🚀 Adding ${usersList.length} users to channel for Lead ID: ${clientLeadId}`,
    );
    await addUserListToAChnnelUsingQueue({ clientLeadId, usersList });
    console.log(`✅ Done adding users for Lead ID: ${clientLeadId}`);
  },
  { ...bullmqConnection, concurrency: 1 },
);

telegramAddUserWorker.on("failed", async (job, err) => {
  if (err.message.includes("AUTH_KEY_UNREGISTERED")) {
    await coonnectToTelegramV2();
    console.log("Reconnected to Telegram successfully!");
  }
  console.error("❌ Failed in Telegram Add User worker:", err.message);
});

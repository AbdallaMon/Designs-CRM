import { Worker } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";
import { addUserListToAChnnelUsingQueue } from "../telegram/telegram-functions.js";
import { coonnectToTelegramV2 } from "../../modules/telegram/connect.js";
import { INTEGRATION_ERROR_CODES } from "@dms/shared";

export const telegramAddUserWorker = new Worker(
  "telegram-user-queue",
  async (job) => {
    const { clientLeadId, usersList } = job.data;
    await addUserListToAChnnelUsingQueue({ clientLeadId, usersList });
  },
  { ...bullmqConnection, concurrency: 1 },
);

telegramAddUserWorker.on("failed", async (job, err) => {
  if (err.message.includes(INTEGRATION_ERROR_CODES.AUTH_KEY_UNREGISTERED)) {
    await coonnectToTelegramV2();
  }
  console.error("❌ Failed in Telegram Add User worker:", err.message);
});

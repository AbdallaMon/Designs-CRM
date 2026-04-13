import { Worker } from "bullmq";
import bullmqConnection from "../redis/bullmq.connection.js";
import {
  getChannelEntitiyByTeleRecordAndLeadId,
  uploadAQueueAttachment,
  uploadAQueueNote,
} from "../../../services/telegram/telegram-functions.js";
import { coonnectToTelegramV2 } from "../../modules/telegram/connect.js";

export const telegramMessageWorker = new Worker(
  "telegram-message-queue",
  async (job) => {
    const { type, payload } = job.data;

    const channel = await getChannelEntitiyByTeleRecordAndLeadId({
      clientLeadId: payload.clientLeadId,
    });

    if (!channel) throw new Error("Channel not found");

    if (type === "note") {
      await uploadAQueueNote(payload.note, channel);
    } else if (type === "file") {
      await uploadAQueueAttachment(payload.file, channel);
    } else {
      throw new Error(`Unknown job type: ${type}`);
    }
  },
  { ...bullmqConnection, concurrency: 1 },
);

telegramMessageWorker.on("failed", async (job, err) => {
  if (err.message.includes("AUTH_KEY_UNREGISTERED")) {
    await coonnectToTelegramV2();
    console.log("Reconnected to Telegram successfully!");
  }
  console.error("❌ Failed in Telegram Message worker:", err.message);
});

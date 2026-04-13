import { Worker } from "bullmq";
import connection from "../redis/bullmqConnection.js";
import {
  getChannelEntitiyByTeleRecordAndLeadId,
  uploadAQueueAttachment,
  uploadAQueueNote,
} from "../telegram/telegram-functions.js";
import { coonnectToTelegramV2 } from "../../v2/modules/telegram/connect.js";
// await connectToTelegram();
export const telegramMessageWorker = new Worker(
  "telegram-message-queue",
  async (job) => {
    try {
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
        throw new Error("Unknown job type: " + type);
      }
    } catch (err) {
      if (err.message.includes("AUTH_KEY_UNREGISTERED")) {
        await coonnectToTelegramV2().then(() =>
          console.log("Reconnected to Telegram successfully!"),
        );
      }
      console.error("❌ Failed in Telegram Message worker:", err.message);
    }
  },
  {
    ...connection,
    concurrency: 1,
  },
);

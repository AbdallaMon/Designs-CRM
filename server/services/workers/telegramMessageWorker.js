import { Worker } from "bullmq";
import connection from "../redis/bullmqConnection.js";
import {
  getChannelEntitiyByTeleRecordAndLeadId,
  uploadAQueueAttachment,
  uploadAQueueNote,
} from "../telegram/telegram-functions.js";
import { connectToTelegram } from "../telegram/connectToTelegram.js";
// await connectToTelegram();
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
      throw new Error("Unknown job type: " + type);
    }
  },
  {
    ...connection,
    concurrency: 1,
  }
);

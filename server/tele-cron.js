import dotenv from "dotenv";
import cron from "node-cron";
import prisma from "./prisma/prisma.js";
import { connectToTelegram } from "./services/telegram/connectToTelegram.js";
import { telegramCronQueue } from "./services/queues/telegram-cron-queue.js";

dotenv.config();

// cron.schedule("*/5 * * * *", async () => {
await connectToTelegram(true);

cron.schedule("*/5 * * * *", async () => {
  try {
    console.log("started");
    const finalizedLeads = await prisma.clientLead.findMany({
      where: {
        status: { in: ["FINALIZED", "ARCHIVED"] },
      },
      select: {
        id: true,
      },
    });
    const shuffledLeads = finalizedLeads?.sort(() => 0.5 - Math.random());

    for (const lead of shuffledLeads) {
      try {
        await telegramCronQueue.add(
          "cron",
          {
            clientLeadId: Number(lead.id),
          },
          {
            jobId: `cron-${lead.id}`,
            removeOnComplete: true,
            removeOnFail: true,
          }
        );
      } catch (e) {
        console.warn(
          `⚠️ Failed to get messages for lead ${lead.id}:`,
          e.message
        );
      }
    }
  } catch (err) {
    console.error("❌ Failed to send tele message:", err.message);
  }
});

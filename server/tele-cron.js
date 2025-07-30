import dotenv from "dotenv";
import cron from "node-cron";
import prisma from "./prisma/prisma.js";
import { connectToTelegram } from "./services/telegram/connectToTelegram.js";
import { telegramCronQueue } from "./services/queues/telegram-cron-queue.js";

// cron.schedule("*/5 * * * *", async () => {
dotenv.config();
await connectToTelegram(true);
// cron.schedule("*/5 * * * *", async () => {
//cron.schedule("*/1 * * * * *", async () => {
cron.schedule("*/10 * * * *", async () => {
  //cron.schedule("*/1 * * * * *", async () => {
  try {
    console.log("stareted");
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
        const existingJob = await telegramCronQueue.getJob(`cron-${lead.id}`);
        if (!existingJob) {
          await telegramCronQueue.add(
            "cron",
            {
              clientLeadId: Number(lead.id),
            },
            {
              attempts: 2,
              backoff: {
                type: "fixed",
                delay: 10000,
              },
              jobId: `cron-${lead.id}`,
              removeOnComplete: true,
              removeOnFail: true,
            }
          );
        }
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

import dotenv from "dotenv";
import cron from "node-cron";
import prisma from "./prisma/prisma.js";
import { getMeagsses } from "./services/telegram/telegram-functions.js";
import { connectToTelegram } from "./services/telegram/connectToTelegram.js";

dotenv.config();

// cron.schedule("*/5 * * * *", async () => {
await connectToTelegram(true);

cron.schedule("*/1 * * * *", async () => {
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

    for (const lead of finalizedLeads) {
      try {
        await getMeagsses({ clientLeadId: lead.id });
        await delay(3000); // Optional: wait 3s between each to be gentle on Telegram
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

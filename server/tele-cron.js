import dotenv from "dotenv";
import cron from "node-cron";
import prisma from "./prisma/prisma.js";
import { getMeagsses } from "./services/telegram/telegram-functions.js";
import { connectToTelegram } from "./services/telegram/connectToTelegram.js";

dotenv.config();

// cron.schedule("*/5 * * * *", async () => {
await connectToTelegram();

cron.schedule("*/15 * * * * *", async () => {
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

    finalizedLeads?.forEach(async (lead) => {
      await getMeagsses({ clientLeadId: lead.id });
    });
  } catch (err) {
    console.error("❌ Failed to send tele message:", err.message);
  }
});

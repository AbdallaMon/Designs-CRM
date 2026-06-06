// Telegram finalized-lead enqueuer — folded from the standalone `server/tele-cron.js`.
// Logic + 10-minute cadence preserved verbatim. Changes vs the standalone:
//   - Telegram is NOT connected here (the bootstrap connects the single GramJS client once).
//   - Imports the canonical queue from `infra/queues` instead of the legacy
//     `services/queues/*` re-export shim.
import cron from "node-cron";
import prisma from "../../../prisma/prisma.js";
import { telegramCronQueue } from "../queues/telegram-cron.queue.js";

let task = null;

export function startTelegramCron() {
  if (task) return task;

  task = cron.schedule("*/10 * * * *", async () => {
    try {
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
          console.log(existingJob, "existingJob");
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
              },
            );
          }
        } catch (e) {
          console.warn(
            `⚠️ Failed to get messages for lead ${lead.id}:`,
            e.message,
          );
        }
      }
    } catch (err) {
      console.error("❌ Failed to send tele message:", err.message);
    }
  });

  console.log("✅ Telegram cron scheduled (every 10 minutes)");
  return task;
}

// Project delivery-time reminders — folded from the standalone
// `server/projectDeliveryTimeReminder.js`. Logic + 2-hour cadence preserved verbatim.
// Changes vs the standalone:
//   - Telegram connection is NOT established here; the server bootstrap connects the single
//     GramJS client ONCE before starting cron (preserving the single-connection constraint).
//   - Added the `prisma` import that the standalone relied on as an undefined global — folding
//     it into a real bootstrap requires the client to actually be in scope so the job runs.
import cron from "node-cron";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { handleProjectReminder } from "../../../services/telegram/telegram-functions.js";
import prisma from "../../../prisma/prisma.js";

dayjs.extend(utc);
dayjs.extend(timezone);

let task = null;

export function startProjectDeliveryCron() {
  if (task) return task;

  task = cron.schedule("0 */2 * * *", async () => {
    const now = dayjs.utc().startOf("day");

    const in1Day = now.add(1, "day");
    const in2Days = now.add(2, "day");
    const in3Days = now.add(3, "day");
    const in7Days = now.add(7, "day");

    const projects7D = await prisma.project.findMany({
      where: {
        deliveryTime: {
          gte: in3Days.toDate(),
          lt: in7Days.endOf("day").toDate(),
        },
        notified7Days: false,
      },
    });

    const projects3D = await prisma.project.findMany({
      where: {
        deliveryTime: {
          gte: in2Days.toDate(),
          lt: in3Days.toDate(),
        },
        notified3Days: false,
      },
    });

    const projects2D = await prisma.project.findMany({
      where: {
        deliveryTime: {
          gte: in1Day.toDate(),
          lt: in2Days.toDate(),
        },
        notified2Days: false,
      },
    });

    const projects1D = await prisma.project.findMany({
      where: {
        deliveryTime: {
          lt: in1Day.toDate(),
          gte: now.toDate(),
        },
        notified1Day: false,
      },
    });

    // Loop and send formatted reminders
    for (const project of projects7D) {
      const deliveryDate = dayjs(project.deliveryTime);
      const daysLeft = deliveryDate.diff(now, "day");

      let timeLeftLabel;
      if (daysLeft === 1) timeLeftLabel = "Tomorrow";
      else if (daysLeft === 0) timeLeftLabel = "Today";
      else timeLeftLabel = `${daysLeft} days left`;
      await handleProjectReminder({
        notifiedKey: "notified7Days",
        timeLeft: timeLeftLabel,
        projectId: project.id,
        clientLeadId: project.clientLeadId,
        type: project.type,
      });
    }

    for (const project of projects3D) {
      await handleProjectReminder({
        notifiedKey: "notified3Days",
        timeLeft: "3 days left",
        projectId: project.id,
        clientLeadId: project.clientLeadId,
        type: project.type,
      });
    }

    for (const project of projects2D) {
      await handleProjectReminder({
        notifiedKey: "notified2Days",
        timeLeft: "Tomorrow",
        projectId: project.id,
        clientLeadId: project.clientLeadId,
        type: project.type,
      });
    }

    for (const project of projects1D) {
      await handleProjectReminder({
        notifiedKey: "notified1Day",
        timeLeft: "Today",
        projectId: project.id,
        clientLeadId: project.clientLeadId,
        type: project.type,
      });
    }
  });

  console.log("✅ Project-delivery cron scheduled (every 2 hours)");
  return task;
}

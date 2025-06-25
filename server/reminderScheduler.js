import cron from "node-cron";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

// Optional: Load env/config/database
import {
  sendReminderToClient,
  sendReminderToUser,
} from "./services/main/emailTemplates.js";
import prisma from "./prisma/prisma.js";

// Run every minute
// cron.schedule("*/5 * * * *", async () => {

cron.schedule("* * * * *", async () => {
  const now = dayjs.utc();
  const targetTime = now.add(15, "minute");
  console.log(now.toDate(), "now");
  console.log(targetTime.toDate(), "targetTime");

  try {
    const upcomingMeetings = await prisma.meetingReminder.findMany({
      where: {
        notified: false,
        time: {
          lte: targetTime.toDate(), // any time in the next 15 minutes or less
          gte: now.toDate(),
        },
      },
      select: {
        id: true,

        userTimezone: true,
        isAdmin: true,
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
        reminderReason: true,
        time: true,
        clientLead: {
          select: {
            id: true,
            assignedTo: {
              select: {
                name: true,
                email: true,
                id: true,
              },
            },
            client: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const upcomingCalls = await prisma.callReminder.findMany({
      where: {
        notified: false,
        time: {
          lte: targetTime.toDate(), // any time in the next 15 minutes or less
          gte: now.toDate(),
        },
      },
      select: {
        id: true,
        reminderReason: true,
        time: true,
        clientLead: {
          select: {
            id: true,
            assignedTo: {
              select: {
                name: true,
                email: true,
                id: true,
              },
            },
            client: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });
    if (upcomingMeetings.length > 0) {
      await sendMeetingReminders(upcomingMeetings);
    }
    if (upcomingCalls.length > 0) {
      await sendCallReminders(upcomingCalls);
    }
  } catch (err) {
    console.error("Error checking reminders:", err);
  }
});

async function sendMeetingReminders(meetings) {
  meetings.forEach(async (meeting) => {
    await sendReminderToClient({
      clientEmail: meeting.clientLead.client.email,
      clientName: meeting.clientLead.client.name,
      time: meeting.time,
      userTimezone: meeting.userTimezone || "Asia/Dubai",
      type: "MEETING",
    });

    if (meeting.isAdmin) {
      await sendReminderToUser({
        userEmail: meeting.admin.email,
        userName: meeting.admin.name,
        time: meeting.time,
        type: "MEETING",
      });
    } else {
      await sendReminderToUser({
        userEmail: meeting.clientLead.assignedTo.email,
        userName: meeting.clientLead.assignedTo.name,
        time: meeting.time,
        type: "MEETING",
        clientLeadId: meeting.clientLead.id,
      });
    }
    await prisma.meetingReminder.update({
      where: { id: meeting.id },
      data: { notified: true },
    });
  });
}

async function sendCallReminders(calls) {
  calls.forEach(async (call) => {
    await sendReminderToUser({
      userEmail: call.clientLead.assignedTo.email,
      userName: call.clientLead.assignedTo.name,
      time: call.time,
      type: "CALL",
      clientLeadId: call.clientLead.id,
    });
    await prisma.callReminder.update({
      where: { id: call.id },
      data: { notified: true },
    });
  });
}

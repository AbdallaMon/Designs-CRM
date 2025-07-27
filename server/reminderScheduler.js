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
  const in15min = now.add(15, "minute");
  const in4h = now.add(4, "hour");
  const in12h = now.add(12, "hour");
  try {
    const reminders12h = await prisma.meetingReminder.findMany({
      where: {
        status: "IN_PROGRESS",
        time: {
          gte: in4h.toDate(), // between 12h and 4h
          lte: in12h.toDate(),
        },
        notified12h: false,
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
    const reminders4h = await prisma.meetingReminder.findMany({
      where: {
        status: "IN_PROGRESS",
        time: {
          gte: in15min.toDate(), // between 4h and 15min
          lte: in4h.toDate(),
        },
        notified4h: false,
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

    const upcomingMeetings = await prisma.meetingReminder.findMany({
      where: {
        notified: false,
        status: "IN_PROGRESS",
        time: {
          gte: now.toDate(), // now → 15 min
          lte: in15min.toDate(),
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
        status: "IN_PROGRESS",
        time: {
          lte: in15min.toDate(), // any time in the next 15 minutes or less
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
    if (reminders4h.length) await sendMeetingReminders(reminders4h, "4h");
    if (reminders12h.length) await sendMeetingReminders(reminders12h, "12h");

    if (upcomingCalls.length > 0) {
      await sendCallReminders(upcomingCalls);
    }
  } catch (err) {
    console.error("Error checking reminders:", err);
  }
});

async function sendMeetingReminders(meetings, timeLabel) {
  meetings.forEach(async (meeting) => {
    await sendReminderToClient({
      clientEmail: meeting.clientLead.client.email,
      clientName: meeting.clientLead.client.name,
      time: meeting.time,
      userTimezone: meeting.userTimezone || "Asia/Dubai",
      type: "MEETING",
      timeLabel,
    });

    if (meeting.isAdmin) {
      await sendReminderToUser({
        userEmail: meeting.admin.email,
        userName: meeting.admin.name,
        time: meeting.time,
        type: "MEETING",
        timeLabel,
        clientLeadId: meeting.clientLead.id,
      });
    } else {
      await sendReminderToUser({
        userEmail: meeting.clientLead.assignedTo.email,
        userName: meeting.clientLead.assignedTo.name,
        time: meeting.time,
        type: "MEETING",
        clientLeadId: meeting.clientLead.id,
        timeLabel,
      });
    }
    await prisma.meetingReminder.update({
      where: { id: meeting.id },
      data: {
        ...(timeLabel
          ? { [`notified${timeLabel}`]: true }
          : { notified: true }),
      },
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

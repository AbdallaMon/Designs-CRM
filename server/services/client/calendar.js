import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

// import { sendReminderCreatedToClient } from "../main/emailTemplates.js";
import { newMeetingNotification } from "../notification.js";
import prisma from "../../prisma/prisma.js";
import { sendReminderCreatedToClient } from "../main/email/emailTemplates.js";
import { createCalendarEvent } from "../main/calendar/googleCalendar.js";
dayjs.extend(timezone);
dayjs.extend(utc);

export async function bookAMeeting({
  reminderId,
  clientLeadId,
  selectedSlot,
  selectedTimezone = "Asia/Dubai",
}) {
  const time = selectedSlot.startTime;
  const reminder = await updateMeetingReminderTime({
    reminderId,
    time,
    userTimezone: selectedTimezone,
  });
  console.log(selectedSlot, "selectedSlot");
  if (selectedSlot.type !== "MOCK") {
    await assignSlotToMeeting({
      slotId: selectedSlot.id,
      meetingReminderId: reminderId,
      userTimezone: selectedTimezone,
    });
  }
  const reminderData = await prisma.meetingReminder.findUnique({
    where: {
      id: Number(reminderId),
    },
    select: {
      userTimezone: true,
      id: true,
      time: true,
      clientLead: {
        select: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
  await newMeetingNotification(Number(clientLeadId), reminder);
  await sendReminderCreatedToClient({
    clientEmail: reminderData.clientLead.client.email,
    clientName: reminderData.clientLead.client.name,
    reminderTime: reminderData.time,
    reminderTitle: "Booked succssfully",
    userTimezone: reminderData.userTimezone,
  });
  return true;
}
export async function verifySlotIsAvailableAndNotBooked({ slotId }) {
  const slotData = await prisma.availableSlot.findUnique({
    where: { id: Number(slotId) },
  });
  if (!slotData) {
    throw new Error("Slot not found,please select another slot");
  }
  if (slotData.isBooked) {
    throw new Error("Slot is already booked, please select another slot");
  }
  return slotData;
}

export async function verifyAndExtractCalendarToken(token) {
  if (!token) throw new Error("No token provided");

  const tokenData = await prisma.meetingReminder.findUnique({
    where: { token },
    select: {
      id: true,
      userId: true,
      clientLeadId: true,
      adminId: true,
      time: true,
      userTimezone: true,
      availableSlot: {
        select: {
          startTime: true,
          endTime: true,
          userTimezone: true,
        },
      },
    },
  });
  const returnData = {
    reminderId: tokenData.id,
    userId: tokenData.userId,
    clientLeadId: tokenData.clientLeadId,
    adminId: tokenData.adminId,
    ...tokenData,
  };
  if (tokenData.availableSlot) {
    returnData.selectedSlot = tokenData.availableSlot;
    if (tokenData.availableSlot.userTimezone) {
      returnData.selectedTimezone = tokenData.availableSlot.userTimezone;
    }
  }
  if (tokenData.time) {
    returnData.selectedDate = dayjs(tokenData.time).utc().toDate();
  }
  if (tokenData.userTimezone) {
    returnData.selectedTimezone = tokenData.userTimezone;
  }
  return returnData;
}
export async function updateMeetingReminderTime({
  reminderId,
  time,
  userTimezone,
}) {
  reminderId = Number(reminderId);
  const reminder = await prisma.meetingReminder.findUnique({
    where: { id: reminderId },
  });

  const updatedReminder = await prisma.meetingReminder.update({
    where: { id: reminderId },
    data: { time, userTimezone },
  });

  return await prisma.meetingReminder.findUnique({
    where: { id: updatedReminder.id },
  });
}

export async function assignSlotToMeeting({
  slotId,
  meetingReminderId,
  userTimezone,
}) {
  slotId = Number(slotId);
  meetingReminderId = Number(meetingReminderId);
  const slot = await prisma.availableSlot.findUnique({
    where: { id: slotId },
  });

  if (!slot || slot.isBooked)
    throw new Error("Time already booked book another");

  const reminder = await prisma.meetingReminder.update({
    where: { id: meetingReminderId },
    data: { availableSlotId: slotId },
  });

  const availableSlot = await prisma.availableSlot.update({
    where: { id: slotId },
    data: { isBooked: true, meetingReminderId, userTimezone },
  });
  await createCalendarEvent(reminder);
  return availableSlot;
}

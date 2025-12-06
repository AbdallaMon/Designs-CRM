import dayjs from "dayjs";
import prisma from "../../../prisma/prisma.js";
import { uploadANote } from "../../telegram/telegram-functions.js";
export async function getDeliveryScheduleByProjectId({ projectId }) {
  return await prisma.deliverySchedule.findMany({
    where: { projectId: Number(projectId) },
    include: {
      meeting: true,
      createdBy: true,
    },
    orderBy: {
      deliveryAt: "asc",
    },
  });
}
export async function createNewDeliverySchedule({
  projectId,
  deliveryAt,
  userId,
  name,
}) {
  const schedule = await prisma.deliverySchedule.create({
    data: {
      projectId: Number(projectId),
      deliveryAt: new Date(deliveryAt),
      createdById: Number(userId),
      name,
    },
  });
  const now = dayjs.utc().startOf("day");

  const deliveryDate = dayjs(deliveryAt);
  const daysLeft = deliveryDate.diff(now, "day");
  const project = await prisma.project.findUnique({
    where: { id: Number(projectId) },
  });
  let timeLeftLabel;
  if (daysLeft === 1) timeLeftLabel = "Tomorrow";
  else if (daysLeft === 0) timeLeftLabel = "Today";
  else timeLeftLabel = `${daysLeft} days left`;
  const link = `${process.env.OLDORIGIN}/dashboard/projects/${projectId}`;

  const note = {
    id: `note-${projectId}-${userId}`,
    clientLeadId: project.clientLeadId,
    content: `New delivery schedule with name :${name} created for project ${project.type} in lead #${project.clientLeadId} - ${timeLeftLabel}. View it here: ${link}`,
    binMessage: true,
  };
  await uploadANote(note);
  return schedule;
}

export async function deleteDeliverySchedule({ id }) {
  return await prisma.deliverySchedule.delete({
    where: { id: Number(id) },
  });
}
export async function linkADeliveryToMeeting({
  deliveryId,
  meetingReminderId,
}) {
  const meeting = await prisma.meetingReminder.findUnique({
    where: { id: Number(meetingReminderId) },
  });
  const updatedData = {
    meetingReminderId: Number(meetingReminderId),
  };
  // if (meeting && meeting.time) {
  //   updatedData.deliveryAt = meeting.time;
  // }

  const delivery = await prisma.deliverySchedule.update({
    where: { id: Number(deliveryId) },
    data: updatedData,
    select: {
      projectId: true,
    },
  });

  return delivery;
}

export async function getMeetingById({ meetingId }) {
  return await prisma.MeetingReminder.findUnique({
    where: { id: Number(meetingId) },
    include: {
      user: true,
    },
  });
}
export async function getAllMeetingRemindersByClientLeadId({ clientLeadId }) {
  return await prisma.MeetingReminder.findMany({
    where: { clientLeadId: Number(clientLeadId) },
    include: {
      user: true,
    },
  });
}

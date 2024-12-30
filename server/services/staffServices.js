import prisma from "../prisma/prisma.js";
import dayjs from "dayjs";

export async function createNote({ clientLeadId, userId, content}) {
    if (!content.trim()) {
        throw new Error('Note content cannot be empty.');
    }

    const newNote = await prisma.note.create({
        data: {
            content,
            clientLeadId,
            userId,
        },
        select:{
            id:true,
            createdAt:true,
            user:{
                select:{
                    name:true
                }
            }
        }
    });
    newNote.content=content
    return newNote;
}
export async function createCallReminder({ clientLeadId,userId, time, reminderReason }) {
    // Check for any existing IN_PROGRESS reminders
    let formattedTime = dayjs(time);
    if (formattedTime.isBefore(dayjs())) {
        throw new Error('The reminder time must be in the future.');
    }
    const inProgressReminder = await prisma.callReminder.findFirst({
        where: {
            clientLeadId,
            status: "IN_PROGRESS",
        },
    });

    if (inProgressReminder) {
        throw new Error('Cannot create a new call reminder while there is an IN_PROGRESS reminder.');
    }
    formattedTime=formattedTime.toISOString()

    const newReminder = await prisma.callReminder.create({
        data: {
            clientLeadId,
            userId,
            time:formattedTime,
            reminderReason,
        },
    });

    return newReminder;
}

export async function updateCallReminderStatus({ reminderId, status, callResult = null }) {

    const updatedReminder = await prisma.callReminder.update({
        where: { id: reminderId },
        data: {
            status,
            callResult: status === 'DONE' ? callResult : "Missed call",
        },
    });

    return updatedReminder;
}

export async function updateClientLeadStatus({ clientLeadId, status }) {
    await prisma.clientLead.update({
        where: { id: clientLeadId },
        data: { status },
    });
}

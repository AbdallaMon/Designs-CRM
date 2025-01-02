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

    formattedTime=formattedTime.toISOString()

    const newReminder = await prisma.callReminder.create({
        data: {
            clientLeadId,
            userId,
            time:formattedTime,
            reminderReason,
        },
        select: {
            id: true,
            time: true,
            status: true,
            reminderReason: true,
            callResult: true,
            userId: true,
            user: {
                select: { name: true },
            },
        },

    });
    let latestTwo= await prisma.callReminder.findMany({
            where: {
                clientLeadId,
            },
                orderBy: { time: 'desc' },
                take: 2,
        })

 return {latestTwo,newReminder}
}
export async function createPriceOffer({ clientLeadId, userId,priceOffer }) {
    if(priceOffer.minPrice>priceOffer.maxPrice){
        throw new Error('End price must be bigger or equal to start price');

    }
    const newPrice = await prisma.PriceOffers.create({
        data: {
            clientLeadId,
            userId,
            minPrice:Number(priceOffer.minPrice),
            maxPrice:Number(priceOffer.maxPrice),
        },
        select:{
            id:true,
            createdAt:true,
            minPrice:true,
            maxPrice:true,
            user:{
                select:{
                    name:true
                }
            }
        }
    });
    return newPrice;
}
export async function createFile({ clientLeadId,url,name,description,userId}) {

    if (!url||!name||!description) {
        throw new Error('Fill all the fields please');
    }
const data=        {
        name,
              clientLeadId,
              url,
              description,
    }
    if(userId){
        data.userId=Number(userId)
    }
    const file = await prisma.file.create({
        data,
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

    return {...file,name,url,description,isUserFile:userId!==null};
}


export async function updateCallReminderStatus({ reminderId, status, callResult = null }) {

    const updatedReminder = await prisma.callReminder.update({
        where: { id: reminderId },
        data: {
            status,
            callResult: status === 'DONE' ? callResult : "Missed call",
        },
        select: {
            id: true,
            time: true,
            status: true,
            reminderReason: true,
            callResult: true,
            userId: true,
            user: {
                select: { name: true },
            },
        },

    });

    return updatedReminder;
}

export async function updateClientLeadStatus({ clientLeadId, status,price }) {
    const data={
        status,updatedAt:new Date()
    }
    if(price){
        data.averagePrice=price
    }
    await prisma.clientLead.update({
        where: { id: clientLeadId },
        data
    });
}

export const getCallReminders = async (searchParams) => {
    const staffFilter = searchParams.staffId ? { userId: Number(searchParams.staffId) } : {};

    try {
        const callReminders = await prisma.callReminder.findMany({
            where: {
                clientLead: {
                    status: {
                        notIn: ['CONVERTED', 'ON_HOLD', 'FINALIZED', 'REJECTED'],
                    },
                    ...staffFilter,
                },
                status: 'IN_PROGRESS',
            },
            include: {
                clientLead: {
                    select: {
                        client: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        return callReminders;
    } catch (error) {
        console.error('Error fetching call reminders:', error);
        throw new Error('Unable to fetch call reminders');
    }
};


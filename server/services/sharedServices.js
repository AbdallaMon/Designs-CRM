import prisma from "../prisma/prisma.js";
import dayjs from 'dayjs';

export async function getClientLeads({
                                         limit = 1,
                                         skip = 10,
                                         searchParams
                                     }) {
    let where = {};
const {    isNew = false,
    status = null,
    assignedOverdue = false}=searchParams;
    const filters = JSON.parse(searchParams.filters);
    if (assignedOverdue) {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        where = {
            OR: [
                {
                    assignedTo: { isNot: null },
                    assignedAt: { lt: fifteenDaysAgo },
                    status: { not: "CONVERTED" }
                },
                {
                    status: "ON_HOLD"
                }
            ]
        };

        if (searchParams?.staffId) {
            where.OR.forEach(condition => {
                condition.assignedTo = {
                    isNot: null,
                    is: {
                        id: {
                            not: Number(searchParams.staffId),
                        },
                    },
                };
            });
        }
    } else {
        if (isNew) {
            where.status = 'NEW';
        } else if (status) {
            where.status = status;
        } else {
            where.status = { notIn: ['NEW', 'CONVERTED',"ON_HOLD"] };
        }
        if (filters?.staffId) {
            where.userId = Number(filters.staffId);
        }


    }
    if (filters?.clientId) {
        where.clientId =Number(filters.clientId);
    }
    if(filters?.type&&filters.type!=="all"){
        where.selectedCategory=filters.type
    }
    const [clientLeads, total] = await Promise.all([
        prisma.clientLead.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                createdAt: true,
                price:true,
                designItemType:true,
                designType:true,
                emirate:true,
                consultationType:true,
                selectedCategory:true,
                client: {
                    select: {
                        name: true,
                        phone: true,
                    }
                },
                assignedTo: {
                    select: {
                        name: true,
                    }
                },
            },
        }),
        prisma.clientLead.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);

    return { data:clientLeads, total, totalPages };
}

export async function getClientLeadsByDateRange({ searchParams }) {
    const { range = 'WEEK' } = searchParams;
    const filters = JSON.parse(searchParams.filters);

    // Calculate date range
    const endDate = dayjs().toDate(); // Today
    const startDate = range !== 'MONTH'
          ? dayjs().subtract(1, 'week').toDate()
          : dayjs().subtract(1, 'month').toDate();

    // Construct where clause
    const where = {
        assignedAt: {
            gte: startDate,
            lte: endDate,
        },
        assignedTo: { isNot: null },
        status:{ notIn: ['NEW', 'CONVERTED',"ON_HOLD"] }
    };
    if (filters?.staffId) {
        where.userId = Number(filters.staffId);
    }
    // Fetch data
    const clientLeads = await prisma.clientLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            client: { select: { name: true } },
            assignedTo: { select: { name: true } },
            status: true,
            price: true,
            selectedCategory:true,
            consultationType:true,
            designType:true,
            designItemType:true,
            emirate:true,
            callReminders: {
                orderBy: { time: 'asc' },
                take: 2,
            },
        },
    });

    return clientLeads;
}
export async function getClientLeadDetails(clientLeadId) {
    const clientLead = await prisma.clientLead.findUnique({
        where: { id: clientLeadId },
        select: {
            id: true,
            client: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            selectedCategory: true,
            designType: true,
            designItemType: true,
            emirate: true,
            status: true,
            price: true,
            files: {
                select: {
                    id: true,
                    name: true,
                    url: true,
                    createdAt: true,
                },
            },
            notes: {
                orderBy: {  createdAt: 'desc' },
                select: {
                    id: true,
                    content: true,
                    userId: true,
                    user: {
                        select: { name: true },
                    },
                    createdAt: true,
                },
            },
            callReminders: {
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
                orderBy: { time: 'desc' }
            },
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!clientLead) {
        throw new Error(`ClientLead with ID ${clientLeadId} not found`);
    }

    return clientLead;
}

export async function markClientLeadAsConverted(clientLeadId,reasonToConvert,status="CONVERTED"){
    let reason=reasonToConvert?reasonToConvert:"Overdue"

    return await prisma.clientLead.update({
        where: { id: clientLeadId },
        data: { status: status,reasonToConvert:reason },
    });
}
export async function assignLeadToAUser(clientLeadId, userId, isOverdue) {
    if (isOverdue) {
        const convertedLead = await markClientLeadAsConverted()

        // Create a new lead for the same client but not the same user
        const newClientLead = await prisma.clientLead.create({
            data: {
                leadId: convertedLead.leadId,
                clientId: convertedLead.clientId,
                userId: userId,
                selectedCategory: convertedLead.selectedCategory,
                consultationType: convertedLead.consultationType,
                designType: convertedLead.designType,
                designItemType: convertedLead.designItemType,
                emirate: convertedLead.emirate,
                price: convertedLead.price,
                status: "IN_PROGRESS",
            },
        });

        return  newClientLead
    }

    const updatedClientLead = await prisma.clientLead.update({
        where: { id: clientLeadId },
        data: {
            userId: userId,
            assignedAt: new Date(),
            status: "IN_PROGRESS",
        },
        select: {
            id: true,
            assignedTo: {
                select: { id: true, name: true },
            },
        },
    });

    return updatedClientLead;
}

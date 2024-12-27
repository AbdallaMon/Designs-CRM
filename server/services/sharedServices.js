import prisma from "../prisma/prisma.js";

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
            assignedTo: { isNot: null },
            assignedAt: { lt: fifteenDaysAgo },
        };
        if (searchParams?.staffId) {
            where = {
                ...where,
                assignedTo: {
                    isNot: null,
                    is: {
                        id: {
                            not: Number(searchParams.staffId),
                        },
                    },
                },
            };
        }
    } else {
        if (isNew) {
            where.status = 'NEW';
        } else if (status) {
            where.status = status;
        } else {
            where.status = { not: 'NEW' };
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


export async function assignLeadToAUser (clientLeadId, userId)  {

    const updatedClientLead = await prisma.clientLead.update({
        where: { id: clientLeadId },
        data: {
            userId: userId,
            assignedAt: new Date(),
            status:"IN_PROGRESS",
        },
        select: {
            id: true,
            assignedTo: {
                select: { id: true, name: true },
            },
        },
    });
    return updatedClientLead;
};

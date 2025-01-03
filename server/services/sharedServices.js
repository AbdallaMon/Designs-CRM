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
        if (searchParams?.staffId) {
            where.userId = Number(searchParams.staffId);
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
                        id:true,
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
    if (searchParams?.staffId) {
        where.userId = Number(searchParams.staffId);
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
                orderBy: { time: 'desc' },
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
            consultationType:true,
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
    clientLead.callReminders = [
        ...clientLead.callReminders.filter((call) => call.status === 'IN_PROGRESS'),
        ...clientLead.callReminders.filter((call) => call.status !== 'IN_PROGRESS'),
    ];
    return clientLead;
}

export async function markClientLeadAsConverted(clientLeadId, reasonToConvert, status = "CONVERTED", withInclude = false) {
    const reason = reasonToConvert || "Overdue";

    // Base update query
    const updateQuery = {
        where: { id: clientLeadId },
        data: { status: status, reasonToConvert: reason },
    };

    if (withInclude) {
        updateQuery["include"] = {
            files: true,
            notes: true,
            callReminders: true,
        };
    }

    return await prisma.clientLead.update(updateQuery);
}

export async function assignLeadToAUser(clientLeadId, userId, isOverdue) {
    if (isOverdue) {
        const convertedLead = await markClientLeadAsConverted(clientLeadId,null,"CONVERTED",true)

            // Create a new lead for the same client but assigned to a different user
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
                    assignedAt: new Date(),
                    // Link the new lead to the data of the converted lead
                    files: {
                        connect: convertedLead.files.map((file) => ({ id: file.id })),
                    },
                    notes: {
                        connect: convertedLead.notes.map((note) => ({ id: note.id })),
                    },
                    callReminders: {
                        connect: convertedLead.callReminders.map((reminder) => ({ id: reminder.id })),
                    },
                },
            });

            return newClientLead;
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

/* dashboard services */
export const getKeyMetrics = async (searchParams) => {
    try {
        const staffFilter = searchParams.staffId ? { userId: Number(searchParams.staffId) } : {};

        const totalRevenueResult = await prisma.clientLead.aggregate({
            _sum: {
                averagePrice: true,
            },
            where: {
                status: 'FINALIZED',
                ...staffFilter,
            },
        });

        const totalRevenue = totalRevenueResult._sum.averagePrice || 0;

        // 2. Average Project Value: Average of 'price' across all ClientLeads
        const avgLeadValueResult = await prisma.clientLead.aggregate({
            _avg: {
                averagePrice: true,
            },
            where: {
                 ...staffFilter
            }
        });
        const averageProjectValue = avgLeadValueResult._avg.averagePrice
              ? parseFloat(avgLeadValueResult._avg.averagePrice.toFixed(2))
              : 0;

        const successLeadsCount = await prisma.clientLead.count({
            where: {
                status: 'FINALIZED',
                 ...staffFilter

            },
        });
console.log(successLeadsCount,"successLeadsCount")
        const nonSuccessLeadsCount = await prisma.clientLead.count({
            where: {
                 ...staffFilter
,
                status: {
                    in: ['CONVERTED', 'ON_HOLD', 'REJECTED'],
                },
            },
        });
        const leadsCounts = await prisma.clientLead.count({
            where: {
                status: {
                    notIn: ['NEW', 'ON_HOLD', 'REJECTED'],
                },
                ...staffFilter

            },
        });
        const totalProcessedLeadsCount = successLeadsCount + nonSuccessLeadsCount;

        // 5. Calculate the success rate
        const successRate =
              totalProcessedLeadsCount > 0
                    ? ((successLeadsCount / totalProcessedLeadsCount) * 100).toFixed(2)
                    : '0.00';
        return {
            totalRevenue,
            averageProjectValue,
            successRate,
            leadsCounts,
        };
    } catch (error) {
        console.error('Error fetching key metrics:', error);
        throw new Error('Unable to fetch key metrics');
    }
};

export const getDashboardLeadStatusData = async (searchParams) => {
    const staffFilter = searchParams.staffId ? { userId: Number(searchParams.staffId) } : {};

    try {
        // Fetch raw lead statuses count from the database
        const rawStatuses = await prisma.clientLead.groupBy({
            by: ['status'],
            _count: {
                status: true,
            },
            where: {
                ...staffFilter,
            },
        });

        // Format the data with rounded counts
        const formattedStatuses = rawStatuses.map((entry) => ({
            status: entry.status.replace(/_/g, ' '), // Replace underscores with spaces for readability
            count: parseFloat(entry._count.status.toFixed(2)), // Round count to 2 decimal places
        }));

        return formattedStatuses;
    } catch (error) {
        console.error('Error fetching lead status data:', error);
        throw new Error('Unable to fetch lead status data');
    }
};

export const getMonthlyPerformanceData = async (searchParams) => {
    const staffFilter = searchParams.staffId ? { userId: Number(searchParams.staffId) } : {};

    try {
        const months = Array.from({ length: 12 }, (_, i) => {
            const date = dayjs().subtract(i, 'month');
            return {
                label: date.format('MMM'), // Format as 'Jan', 'Feb', etc.
                start: date.startOf('month').toDate(), // Start of the month
                end: date.endOf('month').toDate(), // End of the month
            };
        }).reverse(); // Reverse to have chronological order

        // Fetch data for each month
        const results = await Promise.all(
              months.map(async ({ label, start, end }) => {
                  // Count total leads for the month
                  const totalLeads = await prisma.clientLead.count({
                      where: {
                          createdAt: {
                              gte: start,
                              lte: end,
                          },
                              ...staffFilter,
                      },
                  });

                  // Count finalized leads for the month
                  const finalizedLeads = await prisma.clientLead.count({
                      where: {
                          createdAt: {
                              gte: start,
                              lte: end,
                          },
                          status: 'FINALIZED',
                              ...staffFilter,

                      },
                  });

                  const nonSuccessLeads = await prisma.clientLead.count({
                      where: {
                          createdAt: {
                              gte: start,
                              lte: end,
                          },
                              ...staffFilter,

                          status: {
                              in: ['CONVERTED', 'ON_HOLD', 'REJECTED'],
                          },
                      },
                  });

                  const revenueResult = await prisma.clientLead.aggregate({
                      _sum: {
                          averagePrice: true,
                      },
                      where: {
                          createdAt: {
                              gte: start,
                              lte: end,
                          },
                              ...staffFilter,
                          status: 'FINALIZED',
                      },
                  });

                  const revenue = revenueResult._sum.averagePrice || 0;

                  return {
                      month: label,
                      leads: totalLeads,
                      finalized: finalizedLeads,
                      nonSuccess: nonSuccessLeads,
                      revenue,
                  };
              })
        );

        return results;
    } catch (error) {
        console.error('Error fetching monthly performance data:', error);
        throw new Error('Unable to fetch monthly performance data');
    }
};

export const getEmiratesAnalytics = async (searchParams) => {
    const staffFilter = searchParams.staffId ? { userId: Number(searchParams.staffId) } : {};

    try {
        const emirates = [
            'DUBAI',
            'ABU_DHABI',
            'SHARJAH',
            'AJMAN',
            'UMM_AL_QUWAIN',
            'RAS_AL_KHAIMAH',
            'FUJAIRAH',
        ];

        // Define the current period: from the start of last month until today
        const currentStart = dayjs().subtract(1, 'month').startOf('month').toDate();
        const currentEnd = dayjs().endOf('day').toDate();

        // Define the previous period: equivalent time range before the current period
        const previousStart = dayjs(currentStart).subtract(1, 'month').toDate();
        const previousEnd = dayjs(currentEnd).subtract(1, 'month').toDate();

        const dateRangeDescription = `${dayjs(currentStart).format('MMMM YYYY')} - ${dayjs(currentEnd).format('MMMM YYYY')}`;

        const analytics = await Promise.all(
              emirates.map(async (emirate) => {
                  // Current period: total leads
                  const currentLeads = await prisma.clientLead.count({
                      where: {
                          emirate,
                          ...staffFilter,
                          createdAt: {
                              gte: currentStart,
                              lte: currentEnd,
                          },
                      },
                  });

                  // Previous period: total leads
                  const previousLeads = await prisma.clientLead.count({
                      where: {
                          emirate,
                          ...staffFilter,
                          createdAt: {
                              gte: previousStart,
                              lte: previousEnd,
                          },
                      },
                  });

                  // Calculate growth rate
                  const growthRate =
                        previousLeads > 0
                              ? Math.round(((currentLeads - previousLeads) / previousLeads) * 100)
                              : currentLeads > 0
                                    ? 100
                                    : 0;

                  // Current period: finalized leads and total price
                  const finalizedLeads = await prisma.clientLead.count({
                      where: {
                          emirate,
                          ...staffFilter,
                          createdAt: {
                              gte: currentStart,
                              lte: currentEnd,
                          },
                          status: 'FINALIZED',
                      },
                  });

                  const totalPriceResult = await prisma.clientLead.aggregate({
                      _sum: {
                          averagePrice: true,
                      },
                      where: {
                          emirate,
                          ...staffFilter,
                          createdAt: {
                              gte: currentStart,
                              lte: currentEnd,
                          },
                          status: 'FINALIZED',
                      },
                  });
                  const totalPrice = totalPriceResult._sum.averagePrice || 0;

                  const averageLeadPrice = currentLeads > 0 ? Math.round(totalPrice / currentLeads) : 0;

                  const topCategoryResult = await prisma.clientLead.groupBy({
                      by: ['selectedCategory'],
                      _count: {
                          selectedCategory: true,
                      },
                      where: {
                          emirate,
                          ...staffFilter,
                          createdAt: {
                              gte: currentStart,
                              lte: currentEnd,
                          },
                      },
                      orderBy: {
                          _count: {
                              selectedCategory: 'desc',
                          },
                      },
                      take: 1,
                  });
                  const selectedCategory =
                        topCategoryResult[0]?.selectedCategory || 'Unknown';

                  const successRate =
                        currentLeads > 0 ? Math.round((finalizedLeads / currentLeads) * 100) : 0;

                  return {
                      emirate,
                      leads: currentLeads,
                      totalPrice,
                      averageLeadPrice,
                      growthRate,
                      selectedCategory,
                      successRate,
                  };
              })
        );

        return {
            analytics,
            dateRange: dateRangeDescription,
        };
    } catch (error) {
        console.error('Error fetching Emirates analytics:', error);
        throw new Error('Unable to fetch Emirates analytics');
    }
};

export const getPerformanceMetrics = async (searchParams) => {
    const staffFilter = searchParams.staffId ? { userId: Number(searchParams.staffId) } : {};

    try {
        const weekStart = dayjs().subtract(7, 'day').startOf('day').toDate(); // Exactly 7 days ago
        const weekEnd = dayjs().endOf('day').toDate(); // End of today
        const newLeads = await prisma.clientLead.count({

            where: {
                createdAt: {
                    gte: weekStart,
                    lte: weekEnd,
                },
            },
        });

        // Fetch success
        const success = await prisma.clientLead.count({
            where: {
                ...staffFilter,
                status: 'FINALIZED',
                updatedAt: {
                    gte: weekStart,
                    lte: weekEnd,
                },
            },
        });

        // Fetch follow-ups
        const followUps = await prisma.log.groupBy({
            by: ['userId', 'createdAt'],
            _count: {
                userId: true,
            },
            where: {
                ...staffFilter,
                type: {
                    in: [
                        'LEAD_STATUS_CHANGED',
                        'CALL_REMINDER_STATUS',
                        'LEAD_CONTACT',
                        'NOTE_ADDED',
                        'FILE_UPLOADED',
                    ],
                },
                createdAt: {
                    gte: weekStart,
                    lte: weekEnd,
                },
            },
        });

        // Count unique leads from follow-ups
        const uniqueFollowUps = new Set(
              followUps.map((log) => `${log.userId}-${dayjs(log.createdAt).format('YYYY-MM-DD')}`)
        ).size;

        // Fetch meetings
        const meetings = await prisma.contactClient.count({
            where: {
                ...staffFilter,
                time: {
                    gte: weekStart,
                    lte: weekEnd,
                },
            },
        });
        return {
            currentWeek: `${dayjs(weekStart).format('DD/MM')} : ${dayjs(weekEnd).format('DD/MM')}`,
            weekly: {
                newLeads:newLeads,
                success,
                followUps: uniqueFollowUps,
                meetings,
            },
        };
    } catch (error) {
        console.error('Error fetching performance metrics:', error);
        throw new Error('Unable to fetch performance metrics');
    }
};
export const getLatestNewLeads = async () => {

    try {
        const latestLeads = await prisma.clientLead.findMany({
            where: {
                status: 'NEW',
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 5,
            select: {
                id: true,
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                status: true,
                createdAt: true,
            },
        });

        return latestLeads;
    } catch (error) {
        console.error('Error fetching latest new leads:', error);
        throw new Error('Unable to fetch latest new leads');
    }
};

export const getRecentActivities = async (searchParams) => {
    /* todo move this to admin only*/

    try {
        // Fetch recent logs, limit to the latest 10 activities
        const logs = await prisma.log.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            take: 5,
        });

        return logs;
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        throw new Error('Unable to fetch recent activities');
    }
};

function CreateLogWithClientLeadUpdate(){}
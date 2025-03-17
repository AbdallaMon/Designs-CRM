import prisma from "../prisma/prisma.js";
import dayjs from "dayjs";
import {
  assignLeadNotification,
  assignWorkStageNotification,
  convertALeadNotification,
  finalizedLeadCreated,
  overdueALeadNotification,
  updateLeadStatusNotification,
  updateWorkStageStatusNotification,
} from "./notification.js";
import { ClientLeadStatus, LeadWorkStages } from "./enums.js";

export async function getClientLeads({ limit = 1, skip = 10, searchParams }) {
  let where = {};
  const {
    isNew = false,
    status = null,
    assignedOverdue = false,
  } = searchParams;

  const filters = JSON.parse(searchParams.filters);
  if (assignedOverdue) {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    where = {
      status: "ON_HOLD",
    };
    if (searchParams?.staffId) {
      where.assignedTo = {
        is: {
          id: {
            not: Number(searchParams.staffId),
          },
        },
      };
    }
  } else {
    if (isNew) {
      where.status = "NEW";
    } else if (status) {
      where.status = status;
    } else {
      where.status = { notIn: ["NEW", "CONVERTED", "ON_HOLD"] };
    }
    if (searchParams?.staffId) {
      where.userId = Number(searchParams.staffId);
    }
  }
  if (
    filters?.clientId &&
    filters.clientId !== "all" &&
    filters.clientId !== null
  ) {
    where.clientId = Number(filters.clientId);
  }
  if (filters?.staffId && filters.staffId !== "all") {
    where.userId = Number(filters.staffId);
  }
  if (filters?.type && filters.type !== "all") {
    where.selectedCategory = filters.type;
  }
  if (filters?.range) {
    const { startDate, endDate } = filters.range;
    const now = dayjs();
    let start = startDate ? dayjs(startDate) : now.subtract(30, "days");
    let end = endDate ? dayjs(endDate).endOf("day") : now;
    where.assignedAt = {
      gte: start.toDate(),
      lte: end.toDate(),
    };
  }

  const [clientLeads, total] = await Promise.all([
    prisma.clientLead.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        price: true,
        type: true,
        emirate: true,
        selectedCategory: true,
        description: true,
        client: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.clientLead.count({ where }),
  ]);
  const totalPages = Math.ceil(total / limit);

  return { data: clientLeads, total, totalPages };
}

export async function getClientLeadsByDateRange({ searchParams }) {
  const filters = JSON.parse(searchParams.filters);
  const where = {
    assignedTo: { isNot: null },
    status: { notIn: ["NEW", "CONVERTED", "ON_HOLD"] },
  };
  if (filters?.range) {
    const { startDate, endDate } = filters.range;
    const now = dayjs();
    let start = startDate ? dayjs(startDate) : now.subtract(30, "days");
    let end = endDate ? dayjs(endDate).endOf("day") : now;
    where.assignedAt = {
      gte: start.toDate(),
      lte: end.toDate(),
    };
  } else {
    where.assignedAt = {
      gte: dayjs().subtract(3, "month").toDate(),
      lte: dayjs().toDate(),
    };
  }
  if (filters?.clientId && filters.clientId !== "all") {
    where.clientId = Number(filters.clientId);
  }
  if (
    filters?.staffId &&
    filters?.staffId !== "all" &&
    filters?.staffId !== "undefined"
  ) {
    where.userId = Number(filters.staffId);
  }
  if (searchParams.userId) {
    where.userId = searchParams.userId;
  }
  const callRemindersWhere = {};
  if (searchParams.selfId) {
    callRemindersWhere.userId = searchParams.selfId;
  }
  // Fetch data
  const clientLeads = await prisma.clientLead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      client: { select: { name: true } },
      assignedTo: { select: { name: true } },
      status: true,
      price: true,
      averagePrice: true,
      priceWithOutDiscount: true,
      selectedCategory: true,
      description: true,
      type: true,
      emirate: true,
      discount: true,
      callReminders: {
        where: callRemindersWhere,
        orderBy: { time: "desc" },
        take: 2,
      },
    },
  });
  return clientLeads;
}

export async function getClientLeadDetails(clientLeadId, searchParams) {
  const where = {};
  console.log(searchParams, "searchParams");
  if (searchParams.userId) {
    where.userId = Number(searchParams.userId);
  }
  const clientLead = await prisma.clientLead.findUnique({
    where: { id: clientLeadId },
    select: {
      id: true,
      userId: true,
      clientDescription: true,
      country: true,
      timeToContact: true,
      priceNote: true,
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
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
      description: true,
      type: true,
      emirate: true,
      status: true,
      price: true,
      averagePrice: true,
      priceWithOutDiscount: true,
      discount: true,
      files: {
        where,
        select: {
          id: true,
          name: true,
          url: true,
          createdAt: true,
          description: true,
          isUserFile: true,
          user: {
            select: { name: true },
          },
        },
      },
      priceOffers: {
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          minPrice: true,
          maxPrice: true,
          note: true,
          userId: true,
          url: true,
          user: {
            select: { name: true },
          },
          createdAt: true,
        },
      },
      notes: {
        where,
        orderBy: { createdAt: "desc" },
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
        where,
        select: {
          id: true,
          time: true,
          status: true,
          reminderReason: true,
          callResult: true,
          userId: true,
          updatedAt: true,
          user: {
            select: { name: true },
          },
        },
        orderBy: { time: "desc" },
      },
      createdAt: true,
      updatedAt: true,
      assignedAt: true,
      payments: {
        select: {
          id: true,
          status: true,
          amount: true,
          amountPaid: true,
          amountLeft: true,
          paymentReason: true,
        },
      },
      extraServices: {
        select: {
          id: true,
          price: true,
          note: true,
        },
      },
    },
  });

  if (!clientLead) {
    throw new Error(`ClientLead with ID ${clientLeadId} not found`);
  }
  clientLead.callReminders = [
    ...clientLead.callReminders.filter((call) => call.status === "IN_PROGRESS"),
    ...clientLead.callReminders.filter((call) => call.status !== "IN_PROGRESS"),
  ];
  return clientLead;
}

export async function markClientLeadAsConverted(
  clientLeadId,
  reasonToConvert,
  status = "CONVERTED",
  withInclude = false
) {
  const reason = reasonToConvert || "Overdue";

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

  const lead = await prisma.clientLead.update(updateQuery);
  if (status === "ON_HOLD") {
    await convertALeadNotification(lead);
  }
  return lead;
}

export async function assignLeadToAUser(clientLeadId, userId, isOverdue) {
  const activeLeadsCount = await prisma.clientLead.count({
    where: {
      userId: userId,
      status: {
        notIn: ["FINALIZED", "REJECTED", "ON_HOLD", "CONVERTED"],
      },
    },
  });
  const maxUserLeadsCount = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      maxLeadsCounts: true,
    },
  });
  if (activeLeadsCount >= (maxUserLeadsCount.maxLeadsCounts || 50)) {
    throw new Error(
      `You cannot take more than ${
        maxUserLeadsCount.maxLeadsCounts || 50
      } active leads.`
    );
  }
  if (isOverdue) {
    const convertedLead = await markClientLeadAsConverted(
      clientLeadId,
      null,
      "CONVERTED",
      true
    );
    const newClientLead = await prisma.clientLead.create({
      data: {
        leadId: convertedLead.leadId,
        clientId: convertedLead.clientId,
        userId: userId,
        selectedCategory: convertedLead.selectedCategory,
        description: convertedLead.description,
        type: convertedLead.type,
        emirate: convertedLead.emirate,
        price: convertedLead.price,
        status: "IN_PROGRESS",
        assignedAt: new Date(),
        files: {
          connect: convertedLead.files.map((file) => ({ id: file.id })),
        },
        notes: {
          connect: convertedLead.notes.map((note) => ({ id: note.id })),
        },
        callReminders: {
          connect: convertedLead.callReminders.map((reminder) => ({
            id: reminder.id,
          })),
        },
      },
    });

    await overdueALeadNotification(convertedLead, newClientLead);
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
  await assignLeadNotification(clientLeadId, userId, updatedClientLead);

  return updatedClientLead;
}

export async function makePayments(data, leadId) {
  data.map((payment) => {
    payment.amountLeft = Number(payment.amount);
    payment.amount = Number(payment.amount);
    payment.paymentReason = payment.paymentReason;
    payment.clientLeadId = Number(leadId);
  });
  console.log(data, "data");
  await prisma.payment.createMany({ data });
  return data;
}
export async function makeExtraServicePayments({
  data,
  leadId,
  paymentReason,
  price,
  note,
}) {
  data.map((payment) => {
    payment.amountLeft = Number(payment.amount);
    payment.amount = Number(payment.amount);
    payment.paymentReason = paymentReason || "Extra service";
    payment.clientLeadId = Number(leadId);
  });
  await prisma.payment.createMany({ data });
  await prisma.extraService.create({
    data: {
      clientLeadId: Number(leadId),
      price: Number(price),
      note: note,
    },
  });
  return data;
}
/* dashboard services */
export const getKeyMetrics = async (searchParams) => {
  try {
    const staffFilter = searchParams.staffId
      ? { userId: Number(searchParams.staffId) }
      : {};
    const userProfile = searchParams.profile;

    const totalRevenueResult = await prisma.clientLead.aggregate({
      _sum: {
        averagePrice: true,
      },
      where: {
        status: "FINALIZED",
        ...staffFilter,
      },
    });
    const totalRevenue = totalRevenueResult._sum.averagePrice || 0;
    const avgLeadValueResult = await prisma.clientLead.aggregate({
      _avg: {
        averagePrice: true,
      },
      where: {
        ...staffFilter,
      },
    });
    const averageProjectValue = avgLeadValueResult._avg.averagePrice
      ? parseFloat(avgLeadValueResult._avg.averagePrice.toFixed(2))
      : 0;

    const successLeadsCount = await prisma.clientLead.count({
      where: {
        status: "FINALIZED",
        ...staffFilter,
      },
    });
    const nonSuccessLeadsCount = await prisma.clientLead.count({
      where: {
        ...staffFilter,
        status: {
          in: ["CONVERTED", "ON_HOLD", "REJECTED"],
        },
      },
    });

    let leadsCounts;
    if (userProfile) {
      const startOfToday = dayjs().startOf("day").toDate(); // Start of the day
      const endOfToday = dayjs().endOf("day").toDate(); // End of the day
      leadsCounts = await prisma.clientLead.count({
        where: {
          status: {
            notIn: ["NEW"],
          },
          ...staffFilter,
          updatedAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      });
    } else {
      leadsCounts = await prisma.clientLead.count({
        where: {
          status: {
            notIn: ["NEW"],
          },
          ...staffFilter,
        },
      });
    }
    const totalProcessedLeadsCount = successLeadsCount + nonSuccessLeadsCount;

    // 5. Calculate the success rate
    const successRate =
      totalProcessedLeadsCount > 0
        ? ((successLeadsCount / totalProcessedLeadsCount) * 100).toFixed(2)
        : "0.00";
    const totalCommission = parseFloat((totalRevenue * 0.05).toFixed(2));

    return {
      totalRevenue,
      averageProjectValue,
      successRate,
      leadsCounts,
      totalCommission,
    };
  } catch (error) {
    console.error("Error fetching key metrics:", error);
    throw new Error("Unable to fetch key metrics");
  }
};

export const getDashboardLeadStatusData = async (searchParams) => {
  const staffFilter = searchParams.staffId
    ? { userId: Number(searchParams.staffId) }
    : {};
  try {
    const rawStatuses = await prisma.clientLead.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
      where: {
        ...staffFilter,
      },
    });
    const formattedStatuses = rawStatuses.map((entry) => ({
      status: entry.status.replace(/_/g, " "), // Replace underscores with spaces for readability
      count: parseFloat(entry._count.status.toFixed(2)), // Round count to 2 decimal places
    }));

    return formattedStatuses;
  } catch (error) {
    console.error("Error fetching lead status data:", error);
    throw new Error("Unable to fetch lead status data");
  }
};

export const getMonthlyPerformanceData = async (searchParams) => {
  const staffFilter = searchParams.staffId
    ? { userId: Number(searchParams.staffId) }
    : {};

  try {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = dayjs().subtract(i, "month");
      return {
        label: date.format("MMM"), // Format as 'Jan', 'Feb', etc.
        start: date.startOf("month").toDate(), // Start of the month
        end: date.endOf("month").toDate(), // End of the month
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
            status: "FINALIZED",
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
              in: ["CONVERTED", "ON_HOLD", "REJECTED"],
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
            status: "FINALIZED",
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
    console.error("Error fetching monthly performance data:", error);
    throw new Error("Unable to fetch monthly performance data");
  }
};

export const getEmiratesAnalytics = async (searchParams) => {
  const staffFilter = searchParams.staffId
    ? { userId: Number(searchParams.staffId) }
    : {};

  try {
    const emirates = [
      "DUBAI",
      "ABU_DHABI",
      "SHARJAH",
      "AJMAN",
      "UMM_AL_QUWAIN",
      "RAS_AL_KHAIMAH",
      "FUJAIRAH",
    ];

    // Define the current period: from the start of last month until today
    const currentStart = dayjs().subtract(1, "month").startOf("month").toDate();
    const currentEnd = dayjs().endOf("day").toDate();

    // Define the previous period: equivalent time range before the current period
    const previousStart = dayjs(currentStart).subtract(1, "month").toDate();
    const previousEnd = dayjs(currentEnd).subtract(1, "month").toDate();

    const dateRangeDescription = `${dayjs(currentStart).format(
      "MMMM YYYY"
    )} - ${dayjs(currentEnd).format("MMMM YYYY")}`;

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
            status: "FINALIZED",
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
            status: "FINALIZED",
          },
        });
        const totalPrice = totalPriceResult._sum.averagePrice || 0;

        const averageLeadPrice =
          currentLeads > 0 ? Math.round(totalPrice / currentLeads) : 0;

        const topCategoryResult = await prisma.clientLead.groupBy({
          by: ["selectedCategory"],
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
              selectedCategory: "desc",
            },
          },
          take: 1,
        });
        const selectedCategory =
          topCategoryResult[0]?.selectedCategory || "Unknown";

        const successRate =
          currentLeads > 0
            ? Math.round((finalizedLeads / currentLeads) * 100)
            : 0;

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
    console.error("Error fetching Emirates analytics:", error);
    throw new Error("Unable to fetch Emirates analytics");
  }
};

export const getPerformanceMetrics = async (searchParams) => {
  const staffFilter = searchParams.staffId
    ? { userId: Number(searchParams.staffId) }
    : {};
  try {
    const weekStart = dayjs().subtract(7, "day").startOf("day").toDate(); // Exactly 7 days ago
    const weekEnd = dayjs().endOf("day").toDate(); // End of today
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
        status: "FINALIZED",
        updatedAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    // Fetch follow-ups
    const followUps = await prisma.notification.groupBy({
      by: ["userId", "createdAt"],
      _count: {
        staffId: true,
      },
      where: {
        ...staffFilter,
        type: {
          notIn: ["NEW_LEAD"],
        },
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    // Count unique leads from follow-ups
    const uniqueFollowUps = new Set(
      followUps.map(
        (log) => `${log.staffId}-${dayjs(log.createdAt).format("YYYY-MM-DD")}`
      )
    ).size;

    // Fetch meetings
    const meetings = await prisma.callReminder.count({
      where: {
        ...staffFilter,
        time: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });
    return {
      currentWeek: `${dayjs(weekStart).format("DD/MM")} : ${dayjs(
        weekEnd
      ).format("DD/MM")}`,
      weekly: {
        newLeads: newLeads,
        success,
        followUps: uniqueFollowUps,
        meetings,
      },
    };
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    throw new Error("Unable to fetch performance metrics");
  }
};
export const getLatestNewLeads = async () => {
  try {
    const latestLeads = await prisma.clientLead.findMany({
      where: {
        status: "NEW",
      },
      orderBy: {
        createdAt: "desc",
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
    console.error("Error fetching latest new leads:", error);
    throw new Error("Unable to fetch latest new leads");
  }
};

export const getRecentActivities = async (searchParams) => {
  const staffFilter = searchParams.staffId
    ? { staffId: Number(searchParams.staffId) }
    : {};
  const userFilter = searchParams.userId
    ? { userId: Number(searchParams.userId) }
    : {};
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        ...staffFilter,
        ...userFilter,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    return notifications;
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    throw new Error("Unable to fetch recent activities");
  }
};

export async function updateClientLeadStatus({
  clientLeadId,
  status,
  averagePrice,
  discount,
  priceWithOutDiscount,
  oldStatus,
  isAdmin,
  updatePrice,
  priceNote,
}) {
  if (!isAdmin) {
    if (oldStatus === "FINALIZED" || oldStatus === "REJECTED") {
      throw new Error(
        "You cant change the status from rejected or finalized only admin can ,Contact your administrator to take an action"
      );
    }
  } else {
    if (oldStatus !== "FINALIZED" && oldStatus !== "REJECTED") {
      throw new Error(
        "You are only allowed to change the status from finalized or rejected"
      );
    }
  }

  const data = {
    status,
    updatedAt: new Date(),
  };
  let heading = isAdmin
    ? "Lead status changed by admin"
    : "Lead status changed";
  let content = `Lead changed from ${ClientLeadStatus[oldStatus]} to ${ClientLeadStatus[status]}`;
  if (averagePrice) {
    data.averagePrice = Number(averagePrice);
  }
  if (priceNote) {
    data.priceNote = priceNote;
  }
  if (discount) {
    data.discount = Number(discount);
  }
  if (priceWithOutDiscount) {
    data.priceWithOutDiscount = Number(priceWithOutDiscount);
  }

  const lead = await prisma.clientLead.update({
    where: { id: clientLeadId },
    data,
  });
  if (updatePrice) {
    heading = "Lead price";
    content = `
<div>
        <strong>Final price</strong>:${lead.averagePrice}
</div>
<div>
        <strong>Dsicoount</strong>:${lead.discount}
</div><div>
        <strong>Price before discount</strong>:${lead.priceWithOutDiscount}
</div>
        `;
  }
  if (isAdmin) {
    await prisma.payment.deleteMany({
      where: {
        clientLeadId,
      },
    });
    await prisma.extraService.deleteMany({
      where: {
        clientLeadId,
      },
    });
  }
  await updateLeadStatusNotification(
    lead.id,
    heading,
    content,
    updatePrice ? "FINAL_PRICE_ADDED" : "LEAD_UPDATED",
    lead.userId,
    isAdmin,
    !isAdmin ? lead.userId : null
  );
  if (status === "FINALIZED") {
    await finalizedLeadCreated(lead.id, lead.userId);
  }
}

export const getNextCalls = async ({ limit, skip, searchParams }) => {
  const staffFilter =
    searchParams.staffId && searchParams.staffId !== "undefined"
      ? { userId: Number(searchParams.staffId) }
      : {};

  const nearestCallReminders = await prisma.callReminder.findMany({
    where: {
      status: "IN_PROGRESS",
      ...staffFilter,

      clientLead: {
        status: {
          notIn: ["CONVERTED", "ON_HOLD", "REJECTED"],
        },
        ...staffFilter,
      },
    },
    include: {
      clientLead: {
        select: {
          id: true,
          client: {
            select: {
              name: true,
            },
          },
          status: true,
        },
      },
    },
    orderBy: {
      time: "asc",
    },
    take: limit,
    skip: skip,
  });

  const total = await prisma.callReminder.count({
    where: {
      status: "IN_PROGRESS",
      clientLead: {
        status: {
          notIn: ["CONVERTED", "ON_HOLD", "FINALIZED", "REJECTED"],
        },
        ...staffFilter,
      },
    },
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: nearestCallReminders,
    limit,
    total,
    totalPages,
  };
};

export async function getAllFixedData() {
  return prisma.fixedData.findMany({
    orderBy: { createdAt: "desc" },
  });
}

////// work stages functions //////

export async function getNewWorkStagesLeads({
  limit = 1,
  skip = 10,
  searchParams,
}) {
  let where = {};
  const filters = JSON.parse(searchParams.filters);
  where = {
    status: "FINALIZED",
  };
  if (searchParams.type === "two-d") {
    where.threeDWorkStage = {
      in: ["THREE_D_APPROVAL"],
    };
    where.twoDDesignerId = null;
  } else if (searchParams.type === "exacuter") {
    where.twoDWorkStage = {
      in: ["FINAL_DELIVERY"],
    };
    where.twoDExacuterId = null;
  }

  if (
    filters?.clientId &&
    filters.clientId !== "all" &&
    filters.clientId !== null
  ) {
    where.clientId = Number(filters.clientId);
  }
  if (filters?.type && filters.type !== "all") {
    where.selectedCategory = filters.type;
  }
  if (filters?.range) {
    const { startDate, endDate } = filters.range;
    const now = dayjs();
    let start = startDate ? dayjs(startDate) : now.subtract(30, "days");
    let end = endDate ? dayjs(endDate).endOf("day") : now;
    if (searchParams.type === "three-d") {
      where.threeDAssignedAt = {
        gte: start.toDate(),
        lte: end.toDate(),
      };
    } else if (searchParams.type === "two-d") {
      where.twoDAssignedAt = {
        gte: start.toDate(),
        lte: end.toDate(),
      };
    } else if (searchParams.type === "exacuter") {
      where.twoDExacuterAssignedAt = {
        gte: start.toDate(),
        lte: end.toDate(),
      };
    }
  }
  const [clientLeads, total] = await Promise.all([
    prisma.clientLead.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        price: true,
        type: true,
        emirate: true,
        selectedCategory: true,
        description: true,
        client: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        threeDDesigner: {
          select: {
            id: true,
            name: true,
          },
        },
        twoDDesigner: {
          select: {
            id: true,
            name: true,
          },
        },
        twoDExacuter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.clientLead.count({ where }),
  ]);
  const totalPages = Math.ceil(total / limit);

  return { data: clientLeads, total, totalPages };
}

export async function getWorkStagesLeadsByDateRange({ searchParams }) {
  const filters = JSON.parse(searchParams.filters);
  const where = {};
  if (searchParams.type === "three-d") {
    where.threeDDesigner = { isNot: null };
  }
  if (searchParams.type === "two-d") {
    where.twoDDesigner = { isNot: null };
  }
  if (searchParams.type === "exacuter") {
    where.twoDExacuter = { isNot: null };
  }
  if (filters?.range) {
    const { startDate, endDate } = filters.range;
    const now = dayjs();
    let start = startDate ? dayjs(startDate) : now.subtract(30, "days");
    let end = endDate ? dayjs(endDate).endOf("day") : now;
    if (searchParams.type === "three-d") {
      where.threeDAssignedAt = {
        gte: start.toDate(),
        lte: end.toDate(),
      };
    }
    if (searchParams.type === "two-d") {
      where.twoDAssignedAt = {
        gte: start.toDate(),
        lte: end.toDate(),
      };
    }
    if (searchParams.type === "exacuter") {
      where.twoDExacuterAssignedAt = {
        gte: start.toDate(),
        lte: end.toDate(),
      };
    }
  } else {
    if (searchParams.type === "three-d") {
      where.threeDAssignedAt = {
        gte: dayjs().subtract(3, "month").toDate(),
        lte: dayjs().toDate(),
      };
    }
    if (searchParams.type === "two-d") {
      where.twoDAssignedAt = {
        gte: dayjs().subtract(3, "month").toDate(),
        lte: dayjs().toDate(),
      };
    }
    if (searchParams.type === "exacuter") {
      where.twoDExacuterAssignedAt = {
        gte: dayjs().subtract(3, "month").toDate(),
        lte: dayjs().toDate(),
      };
    }
  }
  if (filters?.clientId && filters.clientId !== "all") {
    where.clientId = Number(filters.clientId);
  }
  if (
    filters?.staffId &&
    filters?.staffId !== "all" &&
    filters?.staffId !== "undefined"
  ) {
    if (searchParams.type === "three-d") {
      where.threeDDesignerId = Number(filters.staffId);
    } else if (searchParams.type === "two-d") {
      where.twoDDesignerId = Number(filters.staffId);
    } else if (searchParams.type === "exacuter") {
      where.twoDExacuterId = Number(filters.staffId);
    }
  }
  if (searchParams.userId) {
    if (searchParams.type === "three-d") {
      where.threeDDesignerId = Number(searchParams.userId);
    } else if (searchParams.type === "two-d") {
      where.twoDDesignerId = Number(searchParams.userId);
    } else if (searchParams.type === "exacuter") {
      where.twoDExacuterId = Number(searchParams.userId);
    }
  }

  // Fetch data
  const clientLeads = await prisma.clientLead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      client: { select: { name: true } },
      threeDWorkStage: true,
      twoDWorkStage: true,
      twoDExacuterStage: true,

      price: true,
      averagePrice: true,
      priceWithOutDiscount: true,
      selectedCategory: true,
      description: true,
      type: true,
      emirate: true,
      discount: true,
      callReminders: {
        orderBy: { time: "desc" },
        take: 2,
      },
    },
  });
  return clientLeads;
}

export async function getWorkStageLeadDetails(clientLeadId, searchParams) {
  const where = {};
  console.log(searchParams, "searchParams");
  if (searchParams.userId) {
    where.userId = Number(searchParams.userId);
  }
  const clientLead = await prisma.clientLead.findUnique({
    where: { id: clientLeadId },
    select: {
      id: true,
      threeDDesignerId: true,
      twoDDesignerId: true,
      twoDExacuterId: true,
      clientDescription: true,
      country: true,
      timeToContact: true,
      priceNote: true,
      ourCost: true,
      contractorCost: true,
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      threeDDesigner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      twoDDesigner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      twoDExacuter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      selectedCategory: true,
      description: true,
      type: true,
      emirate: true,
      threeDWorkStage: true,
      twoDWorkStage: true,
      twoDExacuterStage: true,
      price: true,
      averagePrice: true,
      priceWithOutDiscount: true,
      discount: true,
      files: {
        where,
        select: {
          id: true,
          name: true,
          url: true,
          createdAt: true,
          description: true,
          isUserFile: true,
          user: {
            select: { name: true },
          },
        },
      },
      priceOffers: {
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          minPrice: true,
          maxPrice: true,
          note: true,
          userId: true,
          url: true,
          user: {
            select: { name: true },
          },
          createdAt: true,
        },
      },
      notes: {
        where,
        orderBy: { createdAt: "desc" },
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
        where,
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
        orderBy: { time: "desc" },
      },
      createdAt: true,
      updatedAt: true,
      threeDAssignedAt: true,
      twoDAssignedAt: true,
    },
  });

  if (!clientLead) {
    throw new Error(`ClientLead with ID ${clientLeadId} not found`);
  }
  clientLead.callReminders = [
    ...clientLead.callReminders.filter((call) => call.status === "IN_PROGRESS"),
    ...clientLead.callReminders.filter((call) => call.status !== "IN_PROGRESS"),
  ];
  return clientLead;
}

export async function updateLeadWorkStage({
  clientLeadId,
  status,
  oldStatus,
  isAdmin,
  type,
}) {
  if (!isAdmin) {
    if (
      oldStatus === "THREE_D_APPROVAL" ||
      oldStatus === "FINAL_DELIVERY" ||
      oldStatus === "REJECTED" ||
      oldStatus === "ACCEPTED"
    ) {
      throw new Error(
        "You cant change the status after approval only admin can ,Contact your administrator to take an action"
      );
    }
    if (
      oldStatus === "FIRST_MODIFICATION" &&
      status !== "SECOND_MODIFICATION" &&
      status !== "THIRD_MODIFICATION" &&
      status !== "THREE_D_APPROVAL"
    ) {
      throw new Error("You can only change the status to SECOND_MODIFICATION");
    }
    if (
      oldStatus === "SECOND_MODIFICATION" &&
      status !== "THIRD_MODIFICATION" &&
      status !== "THREE_D_APPROVAL"
    ) {
      throw new Error("You can only change the status to THIRD_MODIFICATION");
    }
    if (oldStatus === "THIRD_MODIFICATION" && status !== "THREE_D_APPROVAL") {
      throw new Error("You can only change the status to THREE_D_APPROVAL");
    }
  } else {
    if (
      oldStatus !== "THREE_D_APPROVAL" &&
      oldStatus !== "FINAL_DELIVERY" &&
      oldStatus !== "THIRD_MODIFICATION" &&
      oldStatus !== "SECOND_MODIFICATION" &&
      oldStatus !== "FIRST_MODIFICATION" &&
      oldStatus !== "REJECTED" &&
      oldStatus !== "ACCEPTED"
    ) {
      throw new Error(
        "You are only allowed to change the status from APPROVAL, FINAL DELIVERY or the modification stages"
      );
    }
  }
  if (oldStatus === "PRICING") {
    const lead = await prisma.clientLead.findUnique({
      where: { id: Number(clientLeadId) },
      select: {
        ourCost: true,
        contractorCost: true,
      },
    });
    console.log(lead);
    if (
      !lead.ourCost ||
      lead.ourCost.trim() === "" ||
      !lead.contractorCost ||
      lead.contractorCost.trim() === ""
    ) {
      throw new Error(
        "Both 'Our Cost' and 'Contractor Cost' must be provided and cannot be empty."
      );
    }
  }
  const data = {
    updatedAt: new Date(),
  };
  if (type === "three-d") {
    data.threeDWorkStage = status;
  } else if (type === "two-d") {
    data.twoDWorkStage = status;
  } else if (type === "exacuter") {
    data.twoDExacuterStage = status;
  }
  let heading = isAdmin
    ? "Lead status changed by admin"
    : "Lead status changed";
  let content = `Lead changed from ${LeadWorkStages[oldStatus]} to ${LeadWorkStages[status]}`;

  const lead = await prisma.clientLead.update({
    where: { id: clientLeadId },
    data,
  });

  await updateWorkStageStatusNotification(
    lead.id,
    heading,
    content,
    "LEAD_UPDATED",
    type === "three-d" ? lead.threeDDesignerId : lead.twoDDesignerId,
    isAdmin,
    !isAdmin
      ? type === "three-d"
        ? lead.threeDDesignerId
        : lead.twoDDesignerId
      : null,
    type === "three-d" ? "THREE_D" : "TWO_D"
  );
  if (status === "THREE_D_APPROVAL") {
    await finalizedLeadCreated(lead.id, lead.userId, "TWO_D");
  }
  if (status === "FINAL_DELIVERY") {
    await finalizedLeadCreated(lead.id, lead.userId, "TWO_D_EXACUTER");
  }
}

export async function addCostFiles({ clientLeadId, body }) {
  const update = await prisma.clientLead.update({
    where: {
      id: Number(clientLeadId),
    },
    data: body,
  });
}
export async function assignWorkStageLeadToAUser(clientLeadId, userId, type) {
  const activeLeadsWhere = {};
  if (type === "three-d") {
    activeLeadsWhere.threeDDesignerId = userId;
    activeLeadsWhere.threeDWorkStage = {
      notIn: ["THREE_D_APPROVAL"],
    };
  }
  if (type === "two-d") {
    activeLeadsWhere.twoDDesignerId = userId;
    activeLeadsWhere.twoDWorkStage = {
      notIn: ["FINAL_DELIVERY"],
    };
  }
  const activeLeadsCount = await prisma.clientLead.count({
    where: activeLeadsWhere,
  });
  const maxUserLeadsCount = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      maxLeadsCounts: true,
    },
  });
  if (activeLeadsCount >= (maxUserLeadsCount.maxLeadsCounts || 50)) {
    throw new Error(
      `You cannot take more than ${
        maxUserLeadsCount.maxLeadsCounts || 50
      } active leads.`
    );
  }

  const updateLeadData = {};
  const leadSelect = { id: true };
  if (type === "three-d") {
    updateLeadData.threeDDesignerId = userId;
    updateLeadData.threeDAssignedAt = new Date();
    updateLeadData.threeDWorkStage = "CLIENT_COMMUNICATION";
    leadSelect.threeDDesigner = {
      select: { id: true, name: true },
    };
  }
  if (type === "two-d") {
    updateLeadData.twoDDesignerId = userId;
    updateLeadData.twoDAssignedAt = new Date();
    updateLeadData.twoDWorkStage = "DRAWING_PLAN";
    leadSelect.twoDDesigner = {
      select: { id: true, name: true },
    };
  }
  if (type === "exacuter") {
    updateLeadData.twoDExacuterId = userId;
    updateLeadData.twoDExacuterAssignedAt = new Date();
    updateLeadData.twoDExacuterStage = "PROGRESS";
    leadSelect.twoDExacuter = {
      select: { id: true, name: true },
    };
  }

  const updatedClientLead = await prisma.clientLead.update({
    where: { id: clientLeadId },
    data: updateLeadData,
    select: leadSelect,
  });
  await assignWorkStageNotification(
    clientLeadId,
    userId,
    updatedClientLead,
    type
  );

  return updatedClientLead;
}

export const getNextCallsForDesigners = async ({
  limit,
  skip,
  searchParams,
}) => {
  const staffFilter =
    searchParams.userId && searchParams.userId !== "undefined"
      ? { threeDDesignerId: Number(searchParams.userId) }
      : {};
  const nearestCallReminders = await prisma.callReminder.findMany({
    where: {
      status: "IN_PROGRESS",
      clientLead: {
        ...staffFilter,
      },
    },
    include: {
      clientLead: {
        select: {
          id: true,
          client: {
            select: {
              name: true,
            },
          },
          threeDWorkStage: true,
        },
      },
    },
    orderBy: {
      time: "asc",
    },
    take: limit,
    skip: skip,
  });

  const total = await prisma.callReminder.count({
    where: {
      status: "IN_PROGRESS",
      clientLead: {
        ...staffFilter,
      },
    },
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: nearestCallReminders,
    limit,
    total,
    totalPages,
  };
};

export async function getOtherRoles(userId) {
  const mainRole = await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },
    select: {
      role: true,
    },
  });
  let subRoles = await prisma.UserSubRole.findMany({
    where: {
      userId: Number(userId),
    },
  });
  if (subRoles.length > 0) {
    subRoles = subRoles.map((subRole) => subRole.subRole);
  }
  return [...subRoles, mainRole.role];
}

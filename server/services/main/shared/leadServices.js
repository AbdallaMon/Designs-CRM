import dayjs from "dayjs";
import {
  assignLeadNotification,
  assignMultipleLeadsNotification,
  convertALeadNotification,
  updateLeadStatusNotification,
} from "../../notification.js";
import { ClientLeadStatus } from "../../enums.js";
import { telegramChannelQueue } from "../../queues/telegramChannelQueue.js";
import { assignDesignersForProjectsInContractIfAutoAssigned } from "../contract/contractServices.js";
import prisma from "../../../prisma/prisma.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function getClientLeads({
  limit = 1,
  skip = 10,
  searchParams,
  userId,
}) {
  let where = { leadType: "NORMAL" };
  const {
    isNew = false,
    status = null,
    assignedOverdue = false,
  } = searchParams;

  const filters = JSON.parse(searchParams.filters);
  if (assignedOverdue) {
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
  if (searchParams.checkConsult) {
    where.initialConsult = true;
  }
  if (searchParams.noConsulted && searchParams.noConsulted === "true") {
    where = {
      initialConsult: false,
    };
  }
  if (filters.id && filters.id !== "all") {
    where.id = Number(filters.id);
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notAllowedCountries: true, role: true },
  });
  if (
    user.role !== "SUPER_ADMIN" &&
    user.role !== "ADMIN" &&
    user.role !== "SUPER_SALES" &&
    user.role !== "CONTACT_INITIATOR"
  ) {
    where = {
      ...where,
      AND: [
        {
          OR: [
            { country: { notIn: user.notAllowedCountries ?? [] } },
            { country: { equals: null } },
          ],
        },
      ],
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
        paymentStatus: true,
        initialConsult: true,
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

export async function getClientLeadsByDateRange({
  searchParams,
  isAdmin,
  user,
}) {
  const filters = JSON.parse(searchParams.filters);
  const where = {
    assignedTo: { isNot: null },
    status: { notIn: ["NEW", "CONVERTED"] },
    leadType: "NORMAL",
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
  if (filters.id && filters.id !== "all") {
    where.id = Number(filters.id);
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

    if (!user.isPrimary) {
      where.status = {
        notIn: [
          "NEW",
          "ARCHIVED",
          "ON_HOLD",
          "FINALIZED",
          "REJECTED",
          "CONVERTED",
        ],
      };
    }
  }
  const callRemindersWhere = {};
  if (searchParams.selfId) {
    callRemindersWhere.userId = searchParams.selfId;
  }
  const updatesWhere = {};
  const sharedUpdatesWhere = {};
  if (!isAdmin) {
    sharedUpdatesWhere.type = "STAFF";
    updatesWhere.OR = [
      {
        department: "STAFF",
        sharedSettings: {
          some: {
            isArchived: false,
            excludeFromSearch: false,
          },
        },
      },
      {
        sharedSettings: {
          some: {
            type: "STAFF",
            isArchived: false,
          },
        },
      },
    ];
  } else {
    updatesWhere.OR = [
      {
        sharedSettings: {
          some: {
            isArchived: false,
            excludeFromSearch: false,
          },
        },
      },
      {
        sharedSettings: {
          some: {
            type: "ADMIN",
            isArchived: false,
          },
        },
      },
    ];
  }

  if (filters.contractLevel && filters.contractLevel !== "all") {
    where.contracts = {
      some: {
        status: "IN_PROGRESS",
        stages: {
          some: {
            title: { in: [filters.contractLevel] },
            stageStatus: "IN_PROGRESS",
          },
        },
      },
    };
  }
  const clientLeads = await prisma.clientLead.findMany({
    where,
    orderBy: { updatedAt: "desc" },
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
      paymentStatus: true,
      stripieMetadata: true,
      callReminders: {
        where: callRemindersWhere,
        orderBy: { time: "desc" },
        take: 2,
      },
      contracts: {
        where: {
          status: "IN_PROGRESS",
        },
        orderBy: { id: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          amount: true,
          totalAmount: true,
          stages: {
            select: {
              title: true,
              stageStatus: true,
            },
          },
        },
      },
      updates: {
        orderBy: { updatedAt: "desc" },
        where: updatesWhere,
        take: 6,
        include: {
          sharedSettings: {
            where: sharedUpdatesWhere,
          },
        },
      },
    },
  });
  const statusArray = [
    "IN_PROGRESS",
    "INTERESTED",
    "NEEDS_IDENTIFIED",
    "NEGOTIATING",
    "FINALIZED",
    "REJECTED",
    "ARCHIVED",
    "ON_HOLD",
  ];

  const groupedLeads = {};
  let result = clientLeads;
  if (filters.contractLevel && filters.contractLevel !== "all") {
    result = result.filter((lead) => {
      if (lead.contracts.length) {
        return lead.contracts[0].stages?.some((stage) => {
          return (
            stage.title === filters.contractLevel &&
            stage.stageStatus === "IN_PROGRESS"
          );
        });
      }
    });
  }
  return result;
}

export async function getClientLeadsColumnStatus({
  searchParams,
  isAdmin,
  user,
}) {
  try {
    const filters =
      searchParams.filters &&
      searchParams.filters !== "undefined" &&
      JSON.parse(searchParams.filters);

    let where = {
      assignedTo: { isNot: null },
      status: searchParams.status,
      leadType: "NORMAL",
    };
    if (
      filters?.range &&
      searchParams.status !== "ARCHIVED" &&
      searchParams.status !== "FINALIZED" &&
      searchParams.type !== "CONTRACTLEVELS"
    ) {
      const { startDate, endDate } = filters.range;
      const now = dayjs();
      let start = startDate ? dayjs(startDate) : now.subtract(30, "days");
      let end = endDate ? dayjs(endDate).endOf("day") : now;
      where.assignedAt = {
        gte: start.toDate(),
        lte: end.toDate(),
      };
    } else {
      if (
        searchParams.status !== "ARCHIVED" &&
        searchParams.status !== "FINALIZED" &&
        searchParams.type !== "CONTRACTLEVELS"
      ) {
        where.assignedAt = {
          gte: dayjs().subtract(3, "month").toDate(),
          lte: dayjs().toDate(),
        };
      }
    }
    if (
      (searchParams.status === "FINALIZED" ||
        searchParams.type === "CONTRACTLEVELS") &&
      filters?.finalizedRange
    ) {
      const { startDate, endDate } = filters.finalizedRange;
      const now = dayjs();

      let start = startDate ? dayjs(startDate) : now.subtract(30, "days");
      let end = endDate ? dayjs(endDate).endOf("day") : now;
      where.finalizedDate = {
        gte: start.toDate(),
        lte: end.toDate(),
      };
    }
    if (filters.id && filters.id !== "all") {
      where.id = Number(filters.id);
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
    const updatesWhere = {};
    const sharedUpdatesWhere = {};

    if (searchParams.type === "CONTRACTLEVELS") {
      delete where.status;
      where.contracts = {
        some: {
          status: "IN_PROGRESS",
          stages: {
            some: {
              title: { in: [searchParams.status] },
              stageStatus: "IN_PROGRESS",
            },
          },
        },
      };
    }
    if (!isAdmin) {
      sharedUpdatesWhere.type = "STAFF";
      updatesWhere.OR = [
        {
          department: "STAFF",
          sharedSettings: {
            some: {
              isArchived: false,
              excludeFromSearch: false,
            },
          },
        },
        {
          sharedSettings: {
            some: {
              type: "STAFF",
              isArchived: false,
            },
          },
        },
      ];
    } else {
      updatesWhere.OR = [
        {
          sharedSettings: {
            some: {
              isArchived: false,
              excludeFromSearch: false,
            },
          },
        },
        {
          sharedSettings: {
            some: {
              type: "ADMIN",
              isArchived: false,
            },
          },
        },
      ];
    }

    if (filters.contractLevel && filters.contractLevel !== "all") {
      where.contracts = {
        some: {
          status: "IN_PROGRESS",
          stages: {
            some: {
              title: { in: [filters.contractLevel] },
              stageStatus: "IN_PROGRESS",
            },
          },
        },
      };
    }
    if (where?.id) {
      if (where.assignedAt) {
        delete where.assignedAt;
      }
    }

    const clientLeads = await prisma.clientLead.findMany({
      where,
      skip: Number(searchParams.skip) || 0,
      take: Number(searchParams.take) || 20,
      skip: 0,
      orderBy: { updatedAt: "desc" },
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
        paymentStatus: true,
        stripieMetadata: true,
        callReminders: {
          where: callRemindersWhere,
          orderBy: { time: "desc" },
          take: 2,
        },
        contracts: {
          where: {
            status: "IN_PROGRESS",
          },
          orderBy: { id: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            amount: true,
            totalAmount: true,
            stages: {
              select: {
                title: true,
                stageStatus: true,
              },
            },
          },
        },
        extraServices: {
          select: {
            price: true,
          },
        },
        updates: {
          orderBy: { updatedAt: "desc" },
          where: updatesWhere,
          take: 6,
          include: {
            sharedSettings: {
              where: sharedUpdatesWhere,
            },
          },
        },
      },
    });

    let result = clientLeads;
    result = result.map((lead) => {
      if (lead.contracts.length) {
        let contractZeroStage;
        if (filters.contractLevel && filters.contractLevel !== "all") {
          contractZeroStage = lead.contracts[0]?.stages?.find(
            (stage) =>
              stage.title === filters.contractLevel &&
              stage.stageStatus === "IN_PROGRESS"
          );
        } else {
          contractZeroStage = lead.contracts[0]?.stages?.find(
            (stage) => stage.stageStatus === "IN_PROGRESS"
          );
        }
        lead.contracts[0].stage = contractZeroStage;
        lead.contracts[0].contractLevel = contractZeroStage?.title;
      }
      return lead;
    });

    const consolusion = await prisma.clientLead.aggregate({
      where,
      _count: { id: true },
      _sum: { averagePrice: true },
    });

    const extraServicesTotal = await prisma.extraService.aggregate({
      where: {
        clientLead: {
          ...where,
        },
      },
      _sum: {
        price: true,
      },
    });

    const averagePrice = Number(consolusion._sum.averagePrice ?? 0);
    const extraServicesPrice = Number(extraServicesTotal._sum.price ?? 0);

    const totalValue = (averagePrice + extraServicesPrice).toFixed(2);

    const totalLeads = consolusion._count.id;

    return { data: result, totalValue, totalLeads };
  } catch (e) {
    console.log(e.message, "error in column statsus");
  }
}

export async function getClientLeadDetails(
  clientLeadId,
  searchParams,
  role,
  userId,
  user
) {
  let where = {};
  let leadWhere = {};

  if (searchParams.userId && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    const checkIfCurrenUserIsAssignedToLead = await prisma.clientLead.findFirst(
      {
        where: {
          userId: Number(searchParams.userId),
        },
      }
    );
    if (!checkIfCurrenUserIsAssignedToLead) {
      where.userId = Number(searchParams.userId);
    }
  }

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    const clientLeadShuffle = await prisma.clientLead.findUnique({
      where: { id: Number(clientLeadId), status: "ON_HOLD" },
      select: {
        userId: true,
      },
    });
    if (clientLeadShuffle && clientLeadShuffle.userId !== Number(userId)) {
      where = {};
    } else {
      if (!user.isPrimary) {
        leadWhere.status = {
          notIn: [
            "NEW",
            "ARCHIVED",
            "ON_HOLD",
            "FINALIZED",
            "REJECTED",
            "CONVERTED",
          ],
        };
      }
    }
  }
  const checkIfLeadIsNew = await prisma.clientLead.findUnique({
    where: {
      id: clientLeadId,
      status: "NEW",
      userId: null,
    },
  });
  if (checkIfLeadIsNew) {
    delete where.userId;
  }

  const initialConsultWhere = {};
  if (searchParams.checkConsult) {
    initialConsultWhere.initialConsult = true;
  }
  const clientLead = await prisma.clientLead.findUnique({
    where: { id: clientLeadId, ...initialConsultWhere, ...where, ...leadWhere },
    select: {
      id: true,
      userId: true,
      clientDescription: true,
      code: true,
      country: true,
      timeToContact: true,
      priceNote: true,
      paymentStatus: true,
      telegramLink: true,
      initialConsult: true,
      leadType: true,
      previousLeadId: true,
      personality: true,
      discoverySource: true,
      stripieMetadata: true,
      contracts: {
        where: {
          status: "IN_PROGRESS",
        },
        orderBy: { id: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          amount: true,
          totalAmount: true,
          stages: {
            select: {
              title: true,
              stageStatus: true,
            },
          },
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          arName: true,
          enName: true,
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
          isAccepted: true,
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
      meetingReminders: {
        where,
        select: {
          id: true,
          time: true,
          status: true,
          reminderReason: true,
          meetingResult: true,
          token: true,
          userId: true,
          updatedAt: true,
          adminId: true,
          admin: {
            select: {
              name: true,
              email: true,
            },
          },
          type: true,
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
  if (clientLead.contracts?.length > 0) {
    const currentStage = clientLead.contracts[0].stages?.find(
      (stage) => stage.stageStatus === "IN_PROGRESS"
    );
    clientLead.contracts[0].stage = currentStage;
    clientLead.contracts[0].contractLevel = currentStage?.title;
  }
  return clientLead;
}

export async function assignLeadToAUser(clientLeadId, userId, isAdmin) {
  const clientLead = await prisma.clientLead.findUnique({
    where: {
      id: Number(clientLeadId),
    },
  });
  if (
    clientLead.status !== "NEW" &&
    clientLead.status !== "ON_HOLD" &&
    !isAdmin
  ) {
    throw new Error("This lead has already been assigned to a user");
  }
  const isAlloedToTakeThisLead = await checkIfUserAllowedToTakeALead(
    Number(userId),
    clientLead.country
  );
  if (!isAlloedToTakeThisLead) {
    throw new Error(
      "You are not allowed to take this lead cause it is out of your allowed countries range"
    );
  }
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
      maxLeadCountPerDay: true,
    },
  });
  if (activeLeadsCount >= (maxUserLeadsCount.maxLeadsCounts || 50)) {
    throw new Error(
      `You cannot take more than ${
        maxUserLeadsCount.maxLeadsCounts || 50
      } active leads.`
    );
  }
  const startOfToday = dayjs().startOf("day").toDate();
  const endOfToday = dayjs().endOf("day").toDate();
  const todaysLeadsCount = await prisma.clientLead.count({
    where: {
      userId: userId,
      assignedAt: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
  });
  if (
    todaysLeadsCount >= (maxUserLeadsCount.maxLeadCountPerDay || 5) &&
    !isAdmin
  ) {
    throw new Error(
      `You cannot take more than ${
        maxUserLeadsCount.maxLeadCountPerDay || 5
      } leads per day.`
    );
  }
  if (clientLead.status === "ON_HOLD" || isAdmin) {
    const shadowLead = await prisma.clientLead.create({
      data: {
        clientId: clientLead.clientId,
        userId: clientLead.userId,
        selectedCategory: clientLead.selectedCategory,
        description: clientLead.description,
        type: clientLead.type,
        emirate: clientLead.emirate,
        price: clientLead.price,
        status: "CONVERTED",
        leadType: "CONVERTED",
        previousLeadId: clientLead.id,
      },
    });
  }
  const updatedClientLead = await prisma.clientLead.update({
    where: { id: clientLeadId },
    data: {
      userId: userId,
      assignedAt: new Date(),
      status:
        !clientLead ||
        clientLead.status === "ON_HOLD" ||
        clientLead.status === "NEW"
          ? "IN_PROGRESS"
          : clientLead.status,
    },
    select: {
      id: true,
      status: true,
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
  });
  await assignLeadNotification(clientLeadId, userId, updatedClientLead);

  return updatedClientLead;
}
export async function bulkAssignLeadTsoAUser(leadsIds, userId, isAdmin) {
  await prisma.clientLead.updateMany({
    where: {
      id: { in: leadsIds },
    },
    data: {
      userId: Number(userId),
      assignedAt: new Date(),
    },
  });
  await assignMultipleLeadsNotification(leadsIds, userId);

  return true;
}

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
  userId,
}) {
  if (!isAdmin) {
    if (
      oldStatus === "FINALIZED" ||
      oldStatus === "REJECTED" ||
      oldStatus === "ARCHIVED"
    ) {
      throw new Error(
        "You cant change the status from rejected or finalized or archived only admin can ,Contact your administrator to take an action"
      );
    }
    if (oldStatus === "ON_HOLD") {
      throw new Error(
        "You cant change the status from hold only admin can ,Contact your administrator to take an action"
      );
    }
  }

  const data = {
    status,
    updatedAt: new Date(),
  };
  if (oldStatus !== "ARCHIVED" && status === "FINALIZED") {
    data.finalizedDate = new Date();
  }
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
  if (isAdmin && oldStatus === "FINALIZED") {
    await prisma.note.deleteMany({
      where: {
        invoice: {
          payment: {
            clientLeadId: clientLeadId,
          },
        },
      },
    });
    await prisma.invoice.deleteMany({
      where: {
        payment: {
          clientLeadId: clientLeadId,
        },
      },
    });
    await prisma.note.deleteMany({
      where: {
        payment: {
          clientLeadId: clientLeadId,
        },
      },
    });
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
    !isAdmin ? lead.userId : null,
    status === "FINALIZED"
  );
  if (status === "FINALIZED") {
    const hasChannel = await prisma.telegramChannel.findFirst({
      where: {
        clientLeadId: lead.id,
      },
    });

    if (!hasChannel) {
      await telegramChannelQueue.add(
        "create-channel",
        { clientLeadId: lead.id },
        {
          jobId: `create-${lead.id}`,
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
    }
    // await assignDesignersForProjectsInContractIfAutoAssigned({
    //   leadId: lead.id,
    // });
  }
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
      projects: true,
      priceOffers: true,
      payments: true,
      tasks: true,
      extraServices: true,
    };
  }

  const lead = await prisma.clientLead.update(updateQuery);
  if (status === "ON_HOLD") {
    await convertALeadNotification(lead);
  }
  return lead;
}

export async function checkIfUserAllowedToTakeALead(userId, country) {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { notAllowedCountries: true },
  });
  const notAllowed = user?.notAllowedCountries ?? [];

  const allowed = !notAllowed.includes(country);
  return allowed;
}

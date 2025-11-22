import prisma from "../../prisma/prisma.js";
import dayjs from "dayjs";
import {
  assignLeadNotification,
  convertALeadNotification,
  finalizedLeadCreated,
  newProjectAssingmentNotification,
  newTaskCreatedNotification,
  sendPaymentReminderEmailByStaff,
  sendPaymentSuccessEmail,
  updateLeadStatusNotification,
  updateProjectNotification,
  updateTaskNotification,
} from "../notification.js";

import { ClientLeadStatus } from "../enums.js";
import { dealsLink } from "../links.js";
import { v4 as uuidv4 } from "uuid";
import { getCommissionByUserId, reverseCommissions } from "./adminServices.js";
import {
  addUsersToATeleChannelUsingQueue,
  getChannelEntitiyByTeleRecordAndLeadId,
  inviteUserToAChannel,
  notifyUsersAddedToProject,
  notifyUsersWithTheNewProjectStatus,
  uploadANote,
} from "../telegram/telegram-functions.js";
import Stripe from "stripe";
import { telegramChannelQueue } from "../queues/telegramChannelQueue.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import {
  assignDesignersForProjectsInContractIfAutoAssigned,
  checkIfProjectHasPaymentAndUpdate,
  checkIfProjectHasStagesAndUpdateNextAndPrevious,
} from "./contract/contractServices.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const DUBAI_TZ = "Asia/Dubai";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
  // Optional: filter by the latest contract level
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
  // statusArray.forEach((status) => {
  //   groupedLeads[status] = clientLeads.filter((lead) => lead.status === status);
  // });

  // return groupedLeads;
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
      where.status = "FINALIZED";
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

    // Optional: filter by the latest contract level

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
    // if (filters.contractLevel && filters.contractLevel !== "all") {
    //   result = result.filter((lead) => {
    //     if (lead.contracts.length) {
    //       const contractZeroStage = lead.contracts[0]?.stages?.find(
    //         (stage) =>
    //           stage.title === filters.contractLevel &&
    //           stage.stageStatus === "IN_PROGRESS"
    //       );
    //       lead.contracts[0].stage = contractZeroStage;
    //       lead.contracts[0].contractLevel = contractZeroStage?.title;
    //       return lead.contracts[0].stages?.some((stage) => {
    //         return (
    //           stage.title === filters.contractLevel &&
    //           stage.stageStatus === "IN_PROGRESS"
    //         );
    //       });
    //     }
    //   });
    // }

    // Step 1: Aggregate averagePrice from clientLead
    const consolusion = await prisma.clientLead.aggregate({
      where,
      _count: { id: true },
      _sum: { averagePrice: true },
    });

    // Step 2: Aggregate ExtraService prices linked to those leads
    const extraServicesTotal = await prisma.extraService.aggregate({
      where: {
        clientLead: {
          ...where, // same filter applied to clientLead
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
  console.log(where, "where");
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

export async function getContractForLead({ clientLeadId }) {
  const contracts = await prisma.contract.findMany({
    where: { clientLeadId: Number(clientLeadId) },
  });

  const grouped = contracts.reduce((acc, contract) => {
    if (!acc[contract.purpose]) acc[contract.purpose] = [];
    acc[contract.purpose].push(contract);
    return acc;
  }, {});

  return grouped;
}
export async function createNewContract({
  purpose,
  contractLevel,
  clientLeadId,
  title,
  startDate,
  endDate,
}) {
  const data = {
    clientLeadId: Number(clientLeadId),
    purpose,
  };
  if (title) {
    data.title = title;
  }
  if (startDate) {
    data.startDate = new Date(startDate); // converts to full ISO format
  }
  if (endDate) {
    data.endDate = new Date(endDate);
  }
  contractLevel.forEach(async (level, index) => {
    const isPresent = await prisma.contract.findFirst({
      where: {
        contractLevel: level,
        purpose: purpose,
        clientLeadId: Number(clientLeadId),
      },
    });
    if (isPresent) {
      return;
    }
    await prisma.contract.create({
      data: { ...data, contractLevel: level },
    });
  });

  return true;
}
export async function editContract({ id, title, startDate, endDate }) {
  const data = {};
  if (title) {
    data.title = title;
  }
  if (startDate) {
    data.startDate = new Date(startDate);
  }
  if (endDate) {
    data.endDate = new Date(endDate);
  }
  const updatedContract = await prisma.contract.update({
    where: { id: Number(id) },
    data,
  });
  return updatedContract;
}
export async function deleteContract({ contractId }) {
  const deletedContract = await prisma.contract.delete({
    where: { id: Number(contractId) },
  });
  return deletedContract;
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
const LEVEL_ORDER = {
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
  LEVEL_4: 4,
  LEVEL_5: 5,
  LEVEL_6: 6,
  LEVEL_7: 7,
};

export async function markAsCurrent({ contractId, isInProgress }) {
  const current = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!current) return;

  const allContracts = await prisma.contract.findMany({
    where: {
      clientLeadId: current.clientLeadId,
      purpose: current.purpose,
    },
  });

  const currentLevelNum = LEVEL_ORDER[current.contractLevel];

  const updates = allContracts.map((contract) => {
    const levelNum = LEVEL_ORDER[contract.contractLevel];
    if (levelNum < currentLevelNum) {
      return prisma.contract.update({
        where: { id: contract.id },
        data: {
          isCompleted: true,
          isInProgress: false,
        },
      });
    }
    if (levelNum === currentLevelNum) {
      return prisma.contract.update({
        where: { id: contract.id },
        data: {
          isInProgress: isInProgress,
          isCompleted: false,
        },
      });
    }
    if (levelNum > currentLevelNum) {
      return prisma.contract.update({
        where: { id: contract.id },
        data: {
          isCompleted: false,
          isInProgress: false,
        },
      });
    }
  });

  await prisma.$transaction(updates);
}
export async function markAsCompleted({ contractId, isCompleted }) {
  const current = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!current) return;

  const allContracts = await prisma.contract.findMany({
    where: {
      clientLeadId: current.clientLeadId,
      purpose: current.purpose,
    },
  });

  const currentLevelNum = LEVEL_ORDER[current.contractLevel];

  const updates = allContracts.map((contract) => {
    const levelNum = LEVEL_ORDER[contract.contractLevel];
    if (levelNum <= currentLevelNum) {
      return prisma.contract.update({
        where: { id: contract.id },
        data: {
          isCompleted: true,
          isInProgress: false,
        },
      });
    } else {
      return prisma.contract.update({
        where: { id: contract.id },
        data: {
          isCompleted: false,
          isInProgress: false,
        },
      });
    }
  });

  await prisma.$transaction(updates);
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
  // dayjs get today and check the leads that taking todays count
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

export async function makePayments(data, leadId) {
  data.map((payment) => {
    payment.amountLeft = Number(payment.amount);
    payment.amount = Number(payment.amount);
    payment.paymentReason = payment.paymentReason;
    payment.clientLeadId = Number(leadId);
    payment.paymentLevel = "LEVEL_1";
  });
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
    payment.paymentLevel = "LEVEL_1";
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
export async function editPriceOfferStatus(priceOfferId, isAccepted) {
  return await prisma.priceOffers.update({
    where: {
      id: Number(priceOfferId),
    },
    data: {
      isAccepted,
    },
  });
}
/* dashboard services */
async function updateKeyFilterForUserFilter(
  userFilter,
  searchParams,
  key = "staffId"
) {
  const filterKey = key === "staffId" ? "userId" : key;
  userFilter = { [filterKey]: Number(searchParams[key]) };
  // }
  return userFilter;
}
export const getKeyMetrics = async (searchParams, role) => {
  try {
    let userFilter = {};

    if (searchParams.staffId) {
      userFilter = await updateKeyFilterForUserFilter(
        updateKeyFilterForUserFilter,
        searchParams
      );
    }
    const staffFilter = userFilter;
    const invoicesFilters = searchParams.staffId
      ? {
          payment: {
            clientLead: userFilter,
          },
        }
      : {};

    const userProfile = searchParams.profile;
    const totalRevenueResult = await prisma.invoice.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        ...invoicesFilters,
      },
    });
    const totalRevenue = totalRevenueResult._sum.amount || 0;
    const avgLeadValueResult = await prisma.clientLead.aggregate({
      _avg: {
        averagePrice: true,
      },
      where: {
        status: {
          in: ["FINALIZED", "ARCHIVED"],
        },
        ...staffFilter,
      },
    });
    const averageProjectValue = avgLeadValueResult._avg.averagePrice
      ? parseFloat(avgLeadValueResult._avg.averagePrice.toFixed(2))
      : 0;

    const successLeadsCount = await prisma.clientLead.count({
      where: {
        status: { in: ["FINALIZED", "ARCHIVED"] },
        ...staffFilter,
      },
    });
    const newLeadCounts = await prisma.clientLead.count({
      where: {
        status: "NEW",
        ...staffFilter,
      },
    });

    const inProgressLeadCounts = await prisma.clientLead.count({
      where: {
        status: "IN_PROGRESS",
        ...staffFilter,
      },
    });

    const interestedLeadCounts = await prisma.clientLead.count({
      where: {
        status: "INTERESTED",
        ...staffFilter,
      },
    });

    const needsIdentifiedLeadCounts = await prisma.clientLead.count({
      where: {
        status: "NEEDS_IDENTIFIED",
        ...staffFilter,
      },
    });

    const negotiatingLeadCounts = await prisma.clientLead.count({
      where: {
        status: "NEGOTIATING",
        ...staffFilter,
      },
    });

    const rejectedLeadCounts = await prisma.clientLead.count({
      where: {
        status: "REJECTED",
        ...staffFilter,
      },
    });

    const finalizedLeadCounts = await prisma.clientLead.count({
      where: {
        status: "FINALIZED",
        ...staffFilter,
      },
    });

    const convertedLeadCounts = await prisma.clientLead.count({
      where: {
        status: "CONVERTED",
        ...staffFilter,
      },
    });

    const onHoldLeadCounts = await prisma.clientLead.count({
      where: {
        status: "ON_HOLD",
        ...staffFilter,
      },
    });

    const archivedLeadCounts = await prisma.clientLead.count({
      where: {
        status: "ARCHIVED",
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
    let interactedLeads = 0;
    const startOfToday = dayjs().startOf("day").toDate(); // Start of the day
    const endOfToday = dayjs().endOf("day").toDate(); // End of the day
    interactedLeads = await prisma.clientLead.count({
      where: {
        ...staffFilter,
        updatedAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });
    leadsCounts = await prisma.clientLead.count({
      where: {
        ...staffFilter,
      },
    });

    const totalProcessedLeadsCount = successLeadsCount + nonSuccessLeadsCount;

    // 5. Calculate the success rate
    const successRate =
      totalProcessedLeadsCount > 0
        ? ((successLeadsCount / totalProcessedLeadsCount) * 100).toFixed(2)
        : "0.00";

    const commissions = await prisma.commission.aggregate({
      where: staffFilter,
      _sum: {
        amount: true,
        amountPaid: true,
      },
    });

    const totalCommission = commissions._sum.amount || 0;
    const totalClreadCommission = commissions._sum.amountPaid || 0;
    return {
      totalRevenue,
      averageProjectValue,
      successRate,
      leadsCounts,
      interactedLeads,
      totalCommission,
      totalClreadCommission,
      successLeadsCount,
      newLeadCounts,
      inProgressLeadCounts,
      interestedLeadCounts,
      needsIdentifiedLeadCounts,
      negotiatingLeadCounts,
      rejectedLeadCounts,
      finalizedLeadCounts,
      convertedLeadCounts,
      onHoldLeadCounts,
      archivedLeadCounts,
    };
  } catch (error) {
    console.error("Error fetching key metrics:", error);
    throw new Error("Unable to fetch key metrics");
  }
};

export const getDashboardLeadStatusData = async (searchParams, role) => {
  let userFilter = {};
  if (role === "ADMIN") {
    const users = await prisma.user.findMany({
      where: {
        OR: [{ role: "STAFF" }, { subRoles: { some: { subRole: "STAFF" } } }],
      },
      select: {
        id: true,
      },
    });
    users.forEach(async (user) => {
      await getCommissionByUserId(user.id);
    });
    await reverseCommissions();
  }
  if (searchParams.staffId) {
    userFilter = await updateKeyFilterForUserFilter(
      updateKeyFilterForUserFilter,
      searchParams
    );
  }
  const staffFilter = userFilter;
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
  let userFilter = {};
  if (searchParams.staffId) {
    userFilter = await updateKeyFilterForUserFilter(
      updateKeyFilterForUserFilter,
      searchParams
    );
  }
  const staffFilter = userFilter;

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
  let userFilter = {};
  if (searchParams.staffId) {
    userFilter = await updateKeyFilterForUserFilter(
      updateKeyFilterForUserFilter,
      searchParams
    );
  }
  const staffFilter = userFilter;
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
function buildDateRange(q) {
  const start = q?.startDate
    ? dayjs(q.startDate).startOf("day")
    : dayjs().startOf("month");
  const end = q?.endDate ? dayjs(q.endDate).endOf("day") : dayjs().endOf("day");
  return {
    start: start.toDate(),
    end: end.toDate(),
    label: `${start.format("MMM D, YYYY")} → ${end.format("MMM D, YYYY")}`,
  };
}

function buildStaffFilter(q) {
  const staffId = Number(q?.staffId);
  if (Number.isFinite(staffId)) return { userId: staffId };
  return {};
}

export async function getLeadsMonthlyOverview(searchParams) {
  const { start, end, label } = buildDateRange(searchParams);
  const staffFilter = buildStaffFilter(searchParams);

  const INSIDE_LIST = [
    "DUBAI",
    "ABU_DHABI",
    "SHARJAH",
    "AJMAN",
    "UMM_AL_QUWAIN",
    "RAS_AL_KHAIMAH",
    "FUJAIRAH",
    "KHOR_FAKKAN",
  ];

  // Totals (created in period)
  const [
    totalThisPeriod,
    insideCount,
    outsideCount,
    incompleteCount,
    finalizedTotal,
  ] = await Promise.all([
    prisma.clientLead.count({
      where: { ...staffFilter, createdAt: { gte: start, lte: end } },
    }),
    prisma.clientLead.count({
      where: {
        ...staffFilter,
        createdAt: { gte: start, lte: end },
        emirate: { in: INSIDE_LIST },
      },
    }),
    prisma.clientLead.count({
      where: {
        ...staffFilter,
        createdAt: { gte: start, lte: end },
        emirate: "OUTSIDE",
      },
    }),
    prisma.clientLead.count({
      where: {
        ...staffFilter,
        createdAt: { gte: start, lte: end },
        emirate: null,
      },
    }),
    // finalized count by finalizedDate (not createdAt)
    prisma.clientLead.count({
      where: {
        ...staffFilter,
        status: "FINALIZED",
        finalizedDate: { gte: start, lte: end },
      },
    }),
  ]);

  const successRate = totalThisPeriod
    ? Math.round((finalizedTotal * 100) / totalThisPeriod)
    : 0;

  // Inside breakdown (created)
  const insideTotals = await prisma.clientLead.groupBy({
    by: ["emirate"],
    where: {
      ...staffFilter,
      createdAt: { gte: start, lte: end },
      emirate: { in: INSIDE_LIST },
    },
    _count: { _all: true },
  });

  const insideFinalizedFromCreated = await prisma.clientLead.groupBy({
    by: ["emirate"],
    where: {
      ...staffFilter,
      createdAt: { gte: start, lte: end },
      emirate: { in: INSIDE_LIST },
      status: "FINALIZED",
    },
    _count: { _all: true },
  });

  const insideFinalizedMap = Object.fromEntries(
    insideFinalizedFromCreated.map((r) => [r.emirate, r._count._all])
  );

  const insideRows = insideTotals
    .map((r) => {
      const finalized = insideFinalizedMap[r.emirate] || 0;
      const total = r._count._all;
      return {
        emirate: r.emirate,
        leads: total,
        finalized,
        successRate: total ? Math.round((finalized * 100) / total) : 0,
      };
    })
    .sort((a, b) => b.leads - a.leads);

  // Outside breakdown (created)
  const outsideTotals = await prisma.clientLead.groupBy({
    by: ["country"],
    where: {
      ...staffFilter,
      createdAt: { gte: start, lte: end },
      emirate: "OUTSIDE",
    },
    _count: { _all: true },
  });

  const outsideFinalizedFromCreated = await prisma.clientLead.groupBy({
    by: ["country"],
    where: {
      ...staffFilter,
      createdAt: { gte: start, lte: end },
      emirate: "OUTSIDE",
      status: "FINALIZED",
    },
    _count: { _all: true },
  });

  const outsideFinalizedMap = Object.fromEntries(
    outsideFinalizedFromCreated.map((r) => [
      r.country ?? "Unknown",
      r._count._all,
    ])
  );

  const outsideRows = outsideTotals
    .map((r) => {
      const key = r.country ?? "Unknown";
      const finalized = outsideFinalizedMap[key] || 0;
      const total = r._count._all;
      return {
        country: key,
        leads: total,
        finalized,
        successRate: total ? Math.round((finalized * 100) / total) : 0,
      };
    })
    .sort((a, b) => b.leads - a.leads);

  // ===== Finalized-only breakdown (based on finalizedDate) =====

  const finalizedInside = await prisma.clientLead.groupBy({
    by: ["emirate"],
    where: {
      ...staffFilter,
      status: "FINALIZED",
      finalizedDate: { gte: start, lte: end },
      emirate: { in: INSIDE_LIST },
    },
    _count: { _all: true },
  });

  const finalizedInsideRows = finalizedInside
    .map((r) => ({ emirate: r.emirate, finalized: r._count._all }))
    .sort((a, b) => b.finalized - a.finalized);

  const finalizedOutside = await prisma.clientLead.groupBy({
    by: ["country"],
    where: {
      ...staffFilter,
      status: "FINALIZED",
      finalizedDate: { gte: start, lte: end },
      emirate: "OUTSIDE",
    },
    _count: { _all: true },
  });

  const finalizedOutsideRows = finalizedOutside
    .map((r) => ({ country: r.country ?? "Unknown", finalized: r._count._all }))
    .sort((a, b) => b.finalized - a.finalized);

  // Discovery sources (created)
  const dsTotals = await prisma.clientLead.groupBy({
    by: ["discoverySource"],
    where: { ...staffFilter, createdAt: { gte: start, lte: end } },
    _count: { _all: true },
  });

  const discoverySources = dsTotals
    .map((r) => ({
      source: r.discoverySource ?? "OTHER",
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    period: { start, end, label },
    totals: {
      totalThisPeriod,
      insideCount,
      outsideCount,
      incompleteCount,
      finalizedTotal,
      successRate,
    },
    inside: { rows: insideRows },
    outside: { rows: outsideRows },
    // finalized-only (separated)
    finalizedInsideRows,
    finalizedOutsideRows,
    discoverySources,
  };
}

export const getPerformanceMetrics = async (searchParams) => {
  let userFilter = {};
  if (searchParams.staffId) {
    userFilter = await updateKeyFilterForUserFilter(
      updateKeyFilterForUserFilter,
      searchParams
    );
  }
  const staffFilter = userFilter;
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

// designer dashboard
export const getDesignerMetrics = async (searchParams) => {
  try {
    const userId = searchParams.staffId ? parseInt(searchParams.staffId) : null;

    // Base filter - if userId is provided, filter by that user, otherwise get all
    const userFilter = userId
      ? {
          assignments: {
            some: {
              userId: Number(userId),
            },
          },
        }
      : {};

    // Get completed projects count
    const completedProjects = await prisma.project.count({
      where: {
        ...userFilter,
        status: "Completed",
      },
    });

    const holdProjects = await prisma.project.count({
      where: {
        ...userFilter,
        status: "Hold",
      },
    });
    const inProgressProject = await prisma.project.count({
      where: {
        ...userFilter,
        status: {
          notIn: ["Completed", "Hold", "Rejected", "To Do"],
        },
      },
    });
    const notStartedProject = await prisma.project.count({
      where: {
        ...userFilter,
        status: "To Do",
      },
    });
    // Get total projects count
    const totalProjects = await prisma.project.count({
      where: {
        ...userFilter,
      },
    });

    // Calculate total area of all projects
    const areaResult = await prisma.project.aggregate({
      _sum: {
        area: true,
      },
      where: {
        ...userFilter,
      },
    });
    const totalArea = areaResult._sum.area
      ? parseFloat(areaResult._sum.area.toFixed(2))
      : 0;

    // Calculate time spent (in hours)
    const projectsWithTime = await prisma.project.findMany({
      where: {
        ...userFilter,
        startedAt: { not: null },
        endedAt: { not: null },
      },
      select: {
        startedAt: true,
        endedAt: true,
        createdAt: true,
      },
    });

    let totalTimeSpent = 0;
    projectsWithTime.forEach((project) => {
      const startTime = new Date(project.startedAt);
      const endTime = new Date(project.endedAt);
      const diffInHours = (endTime - startTime) / (1000 * 60 * 60);
      totalTimeSpent += diffInHours;
    });
    totalTimeSpent = parseFloat(totalTimeSpent.toFixed(2));

    // Calculate current month area and time spent
    const currentMonthStart = dayjs().startOf("month").toDate();
    const currentMonthEnd = dayjs().endOf("month").toDate();

    const currentMonthAreaResult = await prisma.project.aggregate({
      _sum: {
        area: true,
      },
      where: {
        ...userFilter,
        startedAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    });
    const currentMonthArea = currentMonthAreaResult._sum.area
      ? parseFloat(currentMonthAreaResult._sum.area.toFixed(2))
      : 0;

    // Calculate current month time spent
    let currentMonthTimeSpent = 0;
    projectsWithTime.forEach((project) => {
      const projectDate = new Date(project.startedAt);
      if (projectDate >= currentMonthStart && projectDate <= currentMonthEnd) {
        const startTime = new Date(project.startedAt);
        const endTime = new Date(project.endedAt);
        const diffInHours = (endTime - startTime) / (1000 * 60 * 60);
        currentMonthTimeSpent += diffInHours;
      }
    });
    currentMonthTimeSpent = parseFloat(currentMonthTimeSpent.toFixed(2));

    const previousMonthStart = dayjs()
      .subtract(1, "month")
      .startOf("month")
      .toDate();
    const previousMonthEnd = dayjs()
      .subtract(1, "month")
      .endOf("month")
      .toDate();

    const previousMonthAreaResult = await prisma.project.aggregate({
      _sum: {
        area: true,
      },
      where: {
        ...userFilter,
        startedAt: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
    });
    const previousMonthArea = previousMonthAreaResult._sum.area
      ? parseFloat(previousMonthAreaResult._sum.area.toFixed(2))
      : 0;

    // Calculate previous month time spent
    let previousMonthTimeSpent = 0;
    projectsWithTime.forEach((project) => {
      const projectDate = new Date(project.startedAt);
      if (
        projectDate >= previousMonthStart &&
        projectDate <= previousMonthEnd
      ) {
        const startTime = new Date(project.startedAt);
        const endTime = new Date(project.endedAt);
        const diffInHours = (endTime - startTime) / (1000 * 60 * 60);
        previousMonthTimeSpent += diffInHours;
      }
    });
    previousMonthTimeSpent = parseFloat(previousMonthTimeSpent.toFixed(2));
    return {
      completedProjects,
      holdProjects,
      inProgressProject,
      notStartedProject,
      totalArea,
      totalProjects,
      totalTimeSpent,
      currentMonthArea,
      previousMonthArea,
      currentMonthTimeSpent,
      previousMonthTimeSpent,
    };
  } catch (error) {
    console.error("Error fetching designer metrics:", error);
    throw new Error("Unable to fetch designer metrics");
  }
};
// end of designer dashboard

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
          jobId: `create-${lead.id}`, // optional: deduplicate
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
    }
    await assignDesignersForProjectsInContractIfAutoAssigned({
      leadId: lead.id,
      userId,
    });
    // await finalizedLeadCreated(lead.id, lead.userId);
    //to do handle auto assignment of designers
  }
}

////////// Updates ////////////////

export async function getUpdates(searchParams, isAdmin) {
  const updatesWhere = {
    clientLeadId: Number(searchParams.clientLeadId),
  };
  const sharedUpdatesWhere = {};
  if (!isAdmin) {
    updatesWhere.OR = [
      {
        department: searchParams.type,
        sharedSettings: {
          some: {
            type: searchParams.type,
          },
        },
      },
      {
        sharedSettings: {
          some: {
            type: searchParams.type,
          },
        },
      },
    ];
  }

  if (searchParams.department && isAdmin) {
    updatesWhere.department = searchParams.department;
  }

  const updates = await prisma.clientLeadUpdate.findMany({
    where: updatesWhere,
    orderBy: { updatedAt: "desc" },
    include: {
      sharedSettings: {
        where: sharedUpdatesWhere,
      },
    },
  });

  return updates;
}
export async function getSharedSettings(updateId) {
  return prisma.sharedUpdate.findMany({
    where: {
      updateId: Number(updateId),
    },
  });
}
export async function createAnUpdate({ data, searchParams, userId }) {
  const createData = {
    title: data.title,
    createdById: Number(userId),
    clientLeadId: Number(data.clientLeadId),
  };
  if (searchParams.department) {
    createData.department = searchParams.department;
  }

  if (data.description) {
    createData.description = data.description;
  }
  const newUpdate = await prisma.clientLeadUpdate.create({
    data: createData,
  });
  if (data.sharedDepartments) {
    data.sharedDepartments.forEach(async (d) => {
      await prisma.sharedUpdate.create({
        data: {
          type: d,
          updateId: newUpdate.id,
          excludeFromSearch: d === searchParams.department,
        },
      });
    });
  }
  await prisma.clientLead.update({
    where: {
      id: Number(data.clientLeadId),
    },
    data: {
      updatedAt: new Date(),
    },
  });
  return await getClientLeadUpdate(newUpdate.id);
}

export async function authorizeDepartmentToUpdate({ type, updateId }) {
  await prisma.sharedUpdate.create({
    data: {
      type: type,
      updateId: Number(updateId),
    },
  });
  return await getClientLeadUpdate(updateId);
}
export async function unAuthorizeDepartmentToUpdate({ updateId, type }) {
  await prisma.sharedUpdate.deleteMany({
    where: { updateId: Number(updateId), type: type },
  });
  return await getClientLeadUpdate(updateId);
}
export async function toggleArchieveAnUpdate({ updateId, isArchived }) {
  await prisma.clientLeadUpdate.update({
    where: { id: Number(updateId) },
    data: {
      isArchived,
    },
  });

  return await getClientLeadUpdate(updateId);
}

export async function toggleArchieveASharedUpdate({
  sharedUpdateId,
  isArchived,
}) {
  const shared = await prisma.sharedUpdate.update({
    where: { id: Number(sharedUpdateId) },
    data: { isArchived },
    select: {
      updateId: true,
    },
  });
  return await getClientLeadUpdate(shared.updateId);
}
async function getClientLeadUpdate(updateId) {
  return await prisma.clientLeadUpdate.findUnique({
    where: {
      id: Number(updateId),
    },
    include: {
      sharedSettings: true,
    },
  });
}
export async function markAnUpdateAsDone({
  updateId,
  clientLeadId,
  isArchived,
}) {
  await prisma.clientLeadUpdate.update({
    where: {
      id: Number(updateId),
    },
    data: {
      updatedAt: new Date(),
      isArchived,
      isDone: true,
    },
  });
  await updateALead(Number(clientLeadId));
  return await getClientLeadUpdate(updateId);
}
////////// End of Updates ////////////
/////////// Projects //////////////

export async function getLeadByPorjects({ searchParams, isAdmin }) {
  const filters =
    searchParams.filters &&
    searchParams.filters !== "undefined" &&
    JSON.parse(searchParams.filters);
  const where = { leadType: "NORMAL" };
  const projectWhere = {};
  const updatesWhere = {};
  const sharedUpdatesWhere = {};
  if (searchParams.type) {
    where.projects = {
      some: {
        type: searchParams.type,
      },
    };
    projectWhere.type = searchParams.type;
    if (searchParams.userId) {
      where.projects.some.assignments = {
        some: {
          userId: Number(searchParams.userId),
        },
      };
      projectWhere.assignments = {
        some: {
          userId: Number(searchParams.userId),
        },
      };
    }
    if (!isAdmin) {
      sharedUpdatesWhere.type = searchParams.type;
    }
    updatesWhere.OR = [
      {
        department: searchParams.type,
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
            type: searchParams.type,
            isArchived: false,
          },
        },
      },
    ];
  }
  if (isAdmin) {
    updatesWhere.OR.push({
      sharedSettings: {
        some: {
          type: "ADMIN",
          isArchived: false,
        },
      },
    });
  }

  if (filters?.clientId && filters.clientId !== "all") {
    where.clientId = Number(filters.clientId);
  }
  if (filters.id && filters.id !== "all") {
    where.id = Number(filters.id);
  }
  if (
    filters?.staffId &&
    filters?.staffId !== "all" &&
    filters?.staffId !== "undefined"
  ) {
    where.projects.some.assignments = {
      some: {
        userId: Number(filters.staffId),
      },
    };
    projectWhere.assignments = {
      some: {
        userId: Number(filters.staffId),
      },
    };
  }
  if (searchParams.isAdmin && !searchParams.userId && !filters?.staffId) {
    where.projects.some.assignments = {
      some: {
        userId: {
          not: undefined,
        },
      },
    };
    projectWhere.assignments = {
      some: {
        userId: {
          not: undefined,
        },
      },
    };
  }
  if (searchParams.isArchieved) {
    where.status = "ARCHIVED";
  } else {
    where.status = {
      notIn: ["ARCHIVED", "NEW"],
    };
  }

  const getTaskVisibilityFilter = (userRole) => {
    const allowedRoles = ["ADMIN", "SUPER_ADMIN", "THREE_D_DESIGNER"];

    if (allowedRoles.includes(userRole)) {
      return {
        type: {
          in: ["PROJECT", "MODIFICATION"],
        },
      };
    } else {
      return {
        type: "PROJECT",
      };
    }
  };

  const userRole = searchParams.userRole;
  const taskFilter = getTaskVisibilityFilter(userRole);

  const rawLeads = await prisma.clientLead.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      client: { select: { name: true } },
      projects: {
        where: projectWhere,
        select: {
          id: true,
          type: true,
          status: true,
          role: true,
          area: true,
          deliveryTime: true,
          priority: true,
          startedAt: true,
          endedAt: true,
          clientLeadId: true,
          isModification: true,
          groupTitle: true,
          groupId: true,
          assignments: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          tasks: {
            where: {
              ...taskFilter,
              status: {
                in: ["TODO", "IN_PROGRESS"],
              },
            },
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              type: true,
              createdAt: true,
              updatedAt: true,
              dueDate: true,
              finishedAt: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: [
              {
                priority: "desc",
              },
              {
                updatedAt: "desc",
              },
            ],
          },
        },
      },
      status: true,
      telegramLink: true,
      price: true,
      averagePrice: true,
      priceWithOutDiscount: true,
      selectedCategory: true,
      description: true,
      type: true,
      emirate: true,
      discount: true,
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
  const expandedLeads = rawLeads.flatMap((lead) => {
    if (!lead.projects || lead.projects.length === 0) return [];

    return lead.projects.map((primaryProject, i) => {
      const reorderedProjects = [
        primaryProject,
        ...lead.projects.filter((_, j) => j !== i),
      ];

      const processedProjects = reorderedProjects.map((project) => ({
        ...project,
        tasks: project.tasks?.filter((task) => task.type === "PROJECT"),
        modifications: project.tasks?.filter(
          (task) => task.type === "MODIFICATION"
        ),
      }));

      return {
        ...lead,
        projects: processedProjects,
      };
    });
  });

  return expandedLeads;
}
export function todayRange() {
  const currentTime = dayjs();
  const offsetMinutes = currentTime.utcOffset();
  const offsetHours = offsetMinutes / 60;

  let s = dayjs().startOf("day");
  if (offsetHours < 0) {
    s = s.subtract(offsetHours, "hour");
  }
  if (offsetHours > 0) {
    s = s.add(offsetHours, "hour");
  }
  const start = s.add(8, "hour").toDate();
  const end = dayjs().endOf("day").toDate();
  const now = dayjs(start).add(1, "minute").toDate();

  return { now, start, end };
}
export async function getLeadByPorjectsColumn({ searchParams, isAdmin }) {
  const filters =
    searchParams.filters &&
    searchParams.filters !== "undefined" &&
    JSON.parse(searchParams.filters);
  const { now, start, end } = todayRange();
  const meetingOrNot = {
    OR: [
      { meeting: { is: { status: { in: ["IN_PROGRESS"] } } } },
      { meeting: null },
      { meetingReminderId: null },
    ],
  };
  const where = { leadType: "NORMAL" };
  const projectWhere = {};
  const updatesWhere = {};
  const sharedUpdatesWhere = {};
  if (searchParams.type) {
    where.projects = {
      some: {
        type: searchParams.type,
      },
    };
    projectWhere.type = searchParams.type;
    if (searchParams.userId) {
      where.projects.some.assignments = {
        some: {
          userId: Number(searchParams.userId),
        },
      };
      projectWhere.assignments = {
        some: {
          userId: Number(searchParams.userId),
        },
      };
    }
    if (!isAdmin) {
      sharedUpdatesWhere.type = searchParams.type;
    }
    updatesWhere.OR = [
      {
        department: searchParams.type,
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
            type: searchParams.type,
            isArchived: false,
          },
        },
      },
    ];
  }
  if (isAdmin) {
    updatesWhere.OR.push({
      sharedSettings: {
        some: {
          type: "ADMIN",
          isArchived: false,
        },
      },
    });
  }
  if (searchParams.status) {
    if (where.projects) {
      where.projects.some.status = searchParams.status;
    } else {
      where.projects = {
        some: {
          status: searchParams.status,
        },
      };
    }
    projectWhere.status = searchParams.status;
  }
  if (filters?.clientId && filters.clientId !== "all") {
    where.clientId = Number(filters.clientId);
  }
  if (filters.id && filters.id !== "all") {
    where.id = Number(filters.id);
  }
  if (
    filters?.staffId &&
    filters?.staffId !== "all" &&
    filters?.staffId !== "undefined"
  ) {
    where.projects.some.assignments = {
      some: {
        userId: Number(filters.staffId),
      },
    };
    projectWhere.assignments = {
      some: {
        userId: Number(filters.staffId),
      },
    };
  }
  if (searchParams.isAdmin && !searchParams.userId && !filters?.staffId) {
    where.projects.some.assignments = {
      some: {
        userId: {
          not: undefined,
        },
      },
    };
    projectWhere.assignments = {
      some: {
        userId: {
          not: undefined,
        },
      },
    };
  }
  if (searchParams.isArchieved) {
    where.status = "ARCHIVED";
  } else {
    where.status = {
      notIn: ["ARCHIVED", "NEW"],
    };
  }

  const getTaskVisibilityFilter = (userRole) => {
    const allowedRoles = ["ADMIN", "SUPER_ADMIN", "THREE_D_DESIGNER"];

    if (allowedRoles.includes(userRole)) {
      return {
        type: {
          in: ["PROJECT", "MODIFICATION"],
        },
      };
    } else {
      return {
        type: "PROJECT",
      };
    }
  };

  const userRole = searchParams.userRole;
  const taskFilter = getTaskVisibilityFilter(userRole);

  const rawLeads = await prisma.clientLead.findMany({
    where,
    skip: Number(searchParams.skip) || 0,
    take: Number(searchParams.take) || 20,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      client: { select: { name: true } },
      projects: {
        where: projectWhere,
        select: {
          id: true,
          type: true,
          status: true,
          role: true,
          area: true,
          deliveryTime: true,
          priority: true,
          startedAt: true,
          endedAt: true,
          clientLeadId: true,
          isModification: true,
          groupTitle: true,
          groupId: true,
          deliverySchedules: {
            where: {
              ...meetingOrNot,
              deliveryAt: { gte: now },
            },
            orderBy: { deliveryAt: "asc" },

            take: 1,
          },
          assignments: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          tasks: {
            where: {
              ...taskFilter,
              status: {
                in: ["TODO", "IN_PROGRESS"],
              },
            },
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              type: true,
              createdAt: true,
              updatedAt: true,
              dueDate: true,
              finishedAt: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: [
              {
                priority: "desc",
              },
              {
                updatedAt: "desc",
              },
            ],
          },
        },
      },
      status: true,
      telegramLink: true,
      price: true,
      averagePrice: true,
      priceWithOutDiscount: true,
      selectedCategory: true,
      description: true,
      type: true,
      emirate: true,
      discount: true,
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
  const expandedLeads = rawLeads.flatMap((lead) => {
    if (!lead.projects || lead.projects.length === 0) return [];

    return lead.projects.map((primaryProject, i) => {
      const reorderedProjects = [
        primaryProject,
        ...lead.projects.filter((_, j) => j !== i),
      ];

      const processedProjects = reorderedProjects.map((project) => ({
        ...project,
        tasks: project.tasks?.filter((task) => task.type === "PROJECT"),
        modifications: project.tasks?.filter(
          (task) => task.type === "MODIFICATION"
        ),
      }));

      return {
        ...lead,
        projects: processedProjects,
      };
    });
  });
  function getPriorityOrder(priority) {
    const priorityMap = {
      VERY_HIGH: 5,
      HIGH: 4,
      MEDIUM: 3,
      LOW: 2,
      VERY_LOW: 1,
    };
    return priorityMap[priority] || 3; // Default to MEDIUM
  }
  const data = expandedLeads
    .filter((lead) => {
      if (
        lead.projects[0].type === "3D_Modification" &&
        !lead.projects[0].isModification
      ) {
        return false;
      }
      return lead.projects[0]?.status === searchParams.status;
    })
    .sort((a, b) => {
      const priorityA = getPriorityOrder(a.projects[0]?.priority);
      const priorityB = getPriorityOrder(b.projects[0]?.priority);
      return priorityB - priorityA; // HIGH priority first
    });
  // Step 1: Aggregate averagePrice from clientLead
  const consolusion = await prisma.clientLead.aggregate({
    where,
    _count: { id: true },
    _sum: { averagePrice: true },
  });

  // Step 2: Aggregate ExtraService prices linked to those leads
  const extraServicesTotal = await prisma.extraService.aggregate({
    where: {
      clientLead: {
        ...where, // same filter applied to clientLead
      },
    },
    _sum: {
      price: true,
    },
  });

  // Step 3: Add them together
  const averagePrice = Number(consolusion._sum.averagePrice ?? 0);
  const extraServicesPrice = Number(extraServicesTotal._sum.price ?? 0);

  const totalValue = (averagePrice + extraServicesPrice).toFixed(2);

  const totalLeads = consolusion._count.id;
  return { data: data, totalValue, totalLeads };
}
export async function getLeadDetailsByProject(clientLeadId, searchParams) {
  const where = { id: clientLeadId };
  const userIdWhere = {};
  let filesAndNotesWhere = {};
  let projectsWhere = {};

  if (searchParams.type === "three-d") {
    const some = {
      type: { in: ["3D_Designer", "3D_Modification"] },
    };
    where.projects = {
      some,
    };
    projectsWhere.type = some.type;
  } else if (searchParams.type === "two-d") {
    const some = {
      type: { in: ["2D_Study", "2D_Final_Plans", "2D_Quantity_Calculation"] },
    };
    where.projects = {
      some,
    };
    projectsWhere.type = some.type;
  } else {
    where.projects = {
      some: {
        type: searchParams.type,
      },
    };
    projectsWhere.type = searchParams.type;
  }

  if (searchParams.userId) {
    if (where.projects) {
      // where.projects.some.userId = Number(searchParams.userId);
      where.projects.some.assignments = {
        some: {
          userId: Number(searchParams.userId),
        },
      };
    } else {
      where.projects = {
        some: {
          assignments: {
            some: {
              userId: Number(searchParams.userId),
            },
          },
        },
      };
    }
    projectsWhere.assignments = {
      some: {
        userId: Number(searchParams.userId),
      },
    };
    // projectsWhere.userId = Number(searchParams.userId);
    userIdWhere.userId = Number(searchParams.userId);
    if (
      searchParams.type !== "3D_Designer" &&
      searchParams.type !== "3D_Modification" &&
      searchParams.type !== "three-d"
    ) {
      filesAndNotesWhere.userId = Number(searchParams.userId);
    }
  }
  const clientLead = await prisma.clientLead.findUnique({
    where,
    select: {
      id: true,
      clientDescription: true,
      country: true,
      timeToContact: true,
      priceNote: true,
      ourCost: true,
      contractorCost: true,
      telegramLink: true,
      stripieMetadata: true,

      projects: {
        where: projectsWhere,
        select: {
          id: true,
          type: true,
          status: true,
          area: true,
          deliveryTime: true,
          priority: true,
          startedAt: true,
          endedAt: true,
          clientLeadId: true,
          role: true,
          groupTitle: true,
          groupId: true,
          isModification: true,
          assignments: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
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
        },
      },
      selectedCategory: true,
      description: true,
      type: true,
      emirate: true,
      price: true,
      averagePrice: true,
      priceWithOutDiscount: true,
      discount: true,
      files: {
        where: filesAndNotesWhere,
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
        where: userIdWhere,
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
        where: filesAndNotesWhere,
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
        where: userIdWhere,
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

const PROJECT_TYPES = [
  "2D_Study",
  "3D_Designer",
  "3D_Modification",
  "2D_Final_Plans",
  "2D_Quantity_Calculation",
];
function sortProjectsByTypeOrder(projects, order = PROJECT_TYPES) {
  const orderIndex = new Map(order.map((t, i) => [t, i]));
  const FALLBACK = order.length; // unknown types go last
  return [...projects].sort((a, b) => {
    const ai = orderIndex.has(a.type) ? orderIndex.get(a.type) : FALLBACK;
    const bi = orderIndex.has(b.type) ? orderIndex.get(b.type) : FALLBACK;
    return ai - bi;
  });
}

async function getProjects(clientLeadId) {
  const { now, start, end } = todayRange();
  const meetingOrNot = {
    OR: [
      { meeting: { is: { status: { in: ["IN_PROGRESS"] } } } },
      { meeting: null },
      { meetingReminderId: null },
    ],
  };
  const projects = await prisma.project.findMany({
    where: {
      clientLeadId: Number(clientLeadId),
    },
    include: {
      deliverySchedules: {
        where: {
          ...meetingOrNot,
          deliveryAt: { gte: now },
        },
        orderBy: { deliveryAt: "asc" },
        take: 1,
      },
      assignments: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
  return projects;
}

export async function getProjectsByClientLeadId({ searchParams }) {
  const { clientLeadId } = searchParams;
  let projects = await getProjects(clientLeadId);

  if (!projects || projects.length === 0) {
    const newProjects = [];
    PROJECT_TYPES.forEach((type) => {
      newProjects.push({
        type,
        status: "To Do",
        priority: "MEDIUM",
        startedAt: null,
        endedAt: null,
        groupTitle: "Initial Project",
        groupId: 1,
        role:
          type === "3D_Designer" || type === "3D_Modification"
            ? "THREE_D_DESIGNER"
            : "TWO_D_DESIGNER",
      });
    });
    const isPresent = await prisma.project.findFirst({
      where: {
        groupId: 1,
        clientLeadId: Number(clientLeadId),
        groupTitle: "Initial Project",
      },
    });

    if (!isPresent) {
      await prisma.project.createMany({
        data: newProjects.map((project) => ({
          ...project,
          clientLeadId: Number(clientLeadId),
        })),
      });
    }
    projects = await getProjects(clientLeadId);
  }

  const groupedProjects = groupProjects(sortProjectsByTypeOrder(projects));

  return groupedProjects;
}
export function groupProjects(projects) {
  const groupedProjects = projects.reduce((acc, project) => {
    const { groupId, groupTitle } = project;

    const existingGroup = acc.find((group) => group.groupId === groupId);

    if (existingGroup) {
      existingGroup.projects.push(project);
    } else {
      acc.push({
        groupId,
        groupTitle,
        projects: [project],
      });
    }

    return acc;
  }, []);

  groupedProjects.sort((a, b) =>
    a.groupId === 1 ? -1 : b.groupId === 1 ? 1 : a.groupId - b.groupId
  );
  return groupedProjects;
}
async function createProjects(clientLeadId, groupTitle = "Initial Project") {
  const highestGroupRecord = await prisma.project.findFirst({
    where: {
      clientLeadId: Number(clientLeadId),
    },
    orderBy: {
      groupId: "desc",
    },
    select: {
      groupId: true,
    },
  });
  const nextGroupId = highestGroupRecord ? highestGroupRecord.groupId + 1 : 1;

  const newProjects = [];
  PROJECT_TYPES.forEach((type) => {
    newProjects.push({
      type,
      status: "To Do",
      priority: "MEDIUM",
      startedAt: null,
      endedAt: null,
      groupTitle: groupTitle,
      groupId: nextGroupId,
      role:
        type === "3D_Designer" || type === "3D_Modification"
          ? "THREE_D_DESIGNER"
          : "TWO_D_DESIGNER",
    });
  });
  await prisma.project.createMany({
    data: newProjects.map((project) => ({
      ...project,
      clientLeadId: Number(clientLeadId),
    })),
  });
  return newProjects;
}
export async function createGroupProjects({ clientleadId, title }) {
  if (!title) {
    throw new Error("Title is required");
  }
  const checkForTitle = await prisma.project.findFirst({
    where: {
      id: Number(clientleadId),
      groupTitle: title,
    },
  });
  if (checkForTitle) {
    throw new Error("There is a group with the same title");
  }
  const projects = await createProjects(Number(clientleadId), title);
  const groupProjects = {
    groupId: projects[0].groupId,
    groupTitle: projects[0].groupTitle,
    projects,
  };
  return groupProjects;
}
export async function assignProjectToUser({
  projectId,
  userId,
  assignmentId,
  deleteDesigner,
  addToModification,
  removeFromModification,
  groupId,
}) {
  const checkIfUserIsAlreadyAssigned = async () => {
    const assignment = await prisma.assignment.findFirst({
      where: {
        userId: Number(userId),
        projectId: Number(projectId),
      },
    });
    if (assignment) {
      throw new Error(
        "This designer is already assigned to this project, refresh page if u didnt find him."
      );
    }
  };
  await checkIfUserIsAlreadyAssigned();
  let modificationProject;
  if (removeFromModification || addToModification) {
    const clientLead = await prisma.clientLead.findFirst({
      where: {
        projects: {
          some: {
            id: Number(projectId),
          },
        },
      },
      select: {
        id: true,
      },
    });
    if (clientLead) {
      modificationProject = await prisma.project.findFirst({
        where: {
          clientLeadId: Number(clientLead.id),
          type: "3D_Modification",
          groupId: Number(groupId),
        },
        select: {
          id: true,
          assignments: {
            select: {
              id: true,
            },
          },
        },
      });
    }
  }
  if (deleteDesigner) {
    // if (deleteDesigner) {
    const oldAssignment = await prisma.assignment.findUnique({
      where: {
        id: Number(assignmentId),
      },
    });
    await prisma.assignment.delete({
      where: {
        id: Number(assignmentId),
      },
    });
    if (removeFromModification && modificationProject) {
      const assignmentToDelete = await prisma.assignment.findFirst({
        where: {
          projectId: modificationProject.id,
          userId: oldAssignment.userId,
        },
      });
      if (assignmentToDelete) {
        await prisma.assignment.delete({
          where: {
            id: assignmentToDelete.id,
          },
        });
      }
    }
  } else {
    await prisma.assignment.create({
      data: {
        userId: Number(userId),
        projectId: Number(projectId),
      },
    });
    if (addToModification && modificationProject) {
      await prisma.assignment.create({
        data: {
          userId: Number(userId),
          projectId: Number(modificationProject.id),
        },
      });
    }
  }
  const project = await prisma.project.findUnique({
    where: { id: Number(projectId) },
    include: {
      assignments: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
  const content = project.clientLeadId
    ? `This project is also linked to a lead <a href="${
        dealsLink + "/" + project.clientLeadId
      }" >#${project.clientLeadId}</a> `
    : "";
  if (!deleteDesigner) {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
    });
    if (user.telegramUsername) {
      await addUsersToATeleChannelUsingQueue({
        clientLeadId: project.clientLeadId,
        usersList: [user],
      });
      await notifyUsersAddedToProject({
        projectId: project.id,
        clientLeadId: project.clientLeadId,
        type: project.type,
        username: user.telegramUsername,
      });
    }
    // }
    await newProjectAssingmentNotification(project.id, Number(userId), content);
  }
  return project;
}
export async function updateProject({ data, isAdmin }) {
  const { id, status, deliveryTime, ...rest } = data;
  if (data.oldStatus) {
    if (
      !data.isAdmin &&
      (data.oldStatus === "Completed" ||
        data.oldStatus === "Canceled" ||
        data.oldStatus === "Rejected")
    ) {
      throw new Error(
        "You can't change the status after Completion or Cancellation or Rejection"
      );
    }
    if (
      !data.isAdmin &&
      data.oldStatus === "Modification" &&
      status !== "Completed"
    ) {
      throw new Error(
        "You can't change the status from Modification to any other status except Completed (You can ask the admin to do that)"
      );
    }

    delete rest.oldStatus;
    delete rest.isAdmin;
  }

  const updatedData = {
    ...rest,
    deliveryTime: deliveryTime
      ? new Date(deliveryTime).toISOString()
      : undefined,
    status,
    ...(status === "Completed" && { endedAt: new Date() }),
  };

  delete updatedData.id;
  delete updatedData.userId;

  delete updatedData.startedAt;
  delete updatedData.user;
  delete updatedData.clientLeadId;
  delete updatedData.clientLead;
  delete updatedData.assignments;
  delete updatedData.tasks;
  const oldProject = await prisma.project.findUnique({
    where: { id: Number(id) },
    select: { deliveryTime: true, status: true },
  });
  const updatedProject = await prisma.project.update({
    where: { id: Number(id) },
    data: updatedData,
  });
  const project = await prisma.project.findUnique({
    where: { id: Number(id) },
    include: {
      assignments: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (
    updatedData.deliveryTime &&
    !dayjs(updatedData.deliveryTime).isSame(
      dayjs(oldProject.deliveryTime),
      "day"
    )
  ) {
    const now = dayjs.utc().startOf("day");

    const deliveryDate = dayjs(updatedData.deliveryTime);
    const daysLeft = deliveryDate.diff(now, "day");

    let timeLeftLabel;
    if (daysLeft === 1) timeLeftLabel = "Tomorrow";
    else if (daysLeft === 0) timeLeftLabel = "Today";
    else timeLeftLabel = `${daysLeft} days left`;
    const note = {
      id: `${project.id}-${project.clientLeadId}`,
      clientLeadId: Number(project.clientLeadId),
      content: `⏳ Project ${project.type} delivery time : ` + timeLeftLabel,
      binMessage: true,
    };
    await uploadANote(note);
  }
  if (project.status === "Modification" && project.type === "3D_Designer") {
    const modificationProject = await prisma.project.updateMany({
      where: {
        groupId: project.groupId,
        clientLeadId: project.clientLeadId,
        type: "3D_Modification",
      },
      data: {
        isModification: true,
      },
    });
  }
  if (project.status !== "To Do" && !project.startedAt) {
    await prisma.project.update({
      where: {
        id: Number(project.id),
      },
      data: {
        startedAt: new Date(),
      },
    });
    project.startedAt = new Date();
  }
  if (project.status === "Completed") {
    if (!project.endedAt) {
      await prisma.project.update({
        where: {
          id: Number(project.id),
        },
        data: {
          endedAt: new Date(),
        },
      });
      project.endedAt = new Date();
    }
    if (oldProject.status !== "Completed") {
      await notifyUsersWithTheNewProjectStatus({
        projectId: project.id,
        clientLeadId: project.clientLeadId,
        type: project.type,
      });
    }
  }
  const content = updatedData.status
    ? `Project status has been changed to ${project.status}`
    : updatedData.priority
    ? `Project priority has been changed to ${project.priority}`
    : "New updates on the project";
  let extra = "";
  if (project.clientLeadId) {
    extra = ` This project is also linked to a lead <a href="${
      dealsLink + "/" + project.clientLeadId
    }" >#${project.clientLeadId}</a> `;
  }
  if (project.assignments && !isAdmin) {
    project.assignments.forEach(async (assigmnet) => {
      await updateProjectNotification(
        project.id,
        assigmnet.userId,
        content + extra,
        false
      );
    });
  } else if (isAdmin) {
    await updateProjectNotification(project.id, null, content + extra, isAdmin);
  }
  await checkIfProjectHasStagesAndUpdateNextAndPrevious({
    projectId: project.id,
    status: project.status,
  });
  await checkIfProjectHasPaymentAndUpdate({
    projectId: project.id,
    status: project.status,
  });
  return updatedProject;
}

export async function getUserProjects(searchParams, limit, skip) {
  const where = {};
  const filters =
    searchParams.filters &&
    searchParams.filters !== "undefined" &&
    JSON.parse(searchParams.filters);
  if (searchParams.userId) {
    where.assignments = {
      some: {
        userId: Number(searchParams.userId),
      },
    };
  }
  if (filters && filters !== "undefined" && filters.leadId) {
    where.clientLeadId = Number(filters.leadId);
  }
  const projects = await prisma.project.findMany({
    where,
    take: limit,
    skip: skip,
    include: {
      clientLead: {
        include: {
          client: true,
        },
      },
      tasks: true,
      assignments: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const total = await prisma.project.count({
    where,
  });
  const totalPages = Math.ceil(total / limit);
  return {
    data: projects,
    limit,
    total,
    totalPages,
  };
}
export async function getProjectDetailsById({ id, searchParams }) {
  const where = {
    id: Number(id),
  };
  if (searchParams.userId && searchParams.userId !== "null") {
    where.assignments = {
      some: {
        userId: Number(searchParams.userId),
      },
    };
  }
  if (searchParams.clientLeadId) {
    where.clientLeadId = Number(searchParams.clientLeadId);
  }
  const project = await prisma.project.findUnique({
    where,
    include: {
      clientLead: {
        select: {
          id: true,
        },
      },
      assignments: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      tasks: true,
    },
  });
  if (
    project &&
    project.type === "3D_Modification" &&
    !project.isModification
  ) {
    throw new Error("This project is not in modification state yet");
  }
  return project;
}

/////// utility ///////
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
export const getNextMeetings = async ({ limit, skip, searchParams }) => {
  const staffFilter =
    searchParams.staffId && searchParams.staffId !== "undefined"
      ? { userId: Number(searchParams.staffId) }
      : {};

  const nearestMeetingReminders = await prisma.meetingReminder.findMany({
    where: {
      status: "IN_PROGRESS",
      time: {
        not: null,
      },
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

  const total = await prisma.meetingReminder.count({
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
    data: nearestMeetingReminders,
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

export async function checkIfUserAllowedToTakeALead(userId, country) {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { notAllowedCountries: true },
  });
  const notAllowed = user?.notAllowedCountries ?? [];

  const allowed = !notAllowed.includes(country);
  return allowed;
}

export const checkUserLog = async (userId, startTime, endTime) => {
  const log = await prisma.userLog.findFirst({
    where: {
      userId: Number(userId),
      date: {
        gte: new Date(startTime),
        lte: new Date(endTime),
      },
    },
  });
  return !!log;
};
export const submitUserLog = async (
  userId,
  date,
  description,
  totalMinutes
) => {
  if (!description || !description.trim()) {
    throw new Error("Please enter a description");
  }
  const newLog = await prisma.userLog.create({
    data: {
      userId: Number(userId),
      date: new Date(date),
      description,
      totalMinutes,
    },
  });

  return { data: newLog, message: "response saved" };
};

export async function getUserRole(userId) {
  const user = await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },
    select: {
      role: true,
    },
  });
  return user;
}
export async function getTasksWithNotesIncluded({ searchParams }) {
  const where = {};
  if (searchParams.userId && searchParams.userId !== "null") {
    where.userId = Number(searchParams.userId);
  }
  if (searchParams.projectId) {
    where.projectId = Number(searchParams.projectId);
    delete where.userId;
  }
  if (searchParams.type) {
    where.type = searchParams.type;
  }
  if (searchParams.clientLeadId) {
    where.clientLeadId = Number(searchParams.clientLeadId);
  }
  const tasks = await prisma.task.findMany({
    where,
    include: {
      notes: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  return tasks;
}
export async function getTaskDetails({ searchParams, id }) {
  const taskId = Number(id);
  if (!searchParams.userId || searchParams.userId === "null") {
    return await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        notes: true,
        clientLead: {
          select: { id: true },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  const userId = Number(searchParams.userId);

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      notes: true,
      project: true,
      clientLead: {
        select: { id: true },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  if (!task) {
    return null;
  }

  if (task.projectId) {
    const projectUser = await prisma.project.findFirst({
      where: {
        id: task.projectId,
      },
      select: {
        assignments: {
          select: { userId: true },
        },
      },
    });
    let passed = false;
    projectUser.assignments?.forEach((assignment) => {
      if (assignment.userId === Number(userId)) {
        passed = true;
        return;
      }
    });
    if (passed) {
      return task;
    }
  }

  throw new Error("You are not allowed to see this task");
}
export async function getArchivedProjects(searchParams, limit, skip) {
  const where = {
    projects: {
      some: {},
    },
  };
  const filters = JSON.parse(searchParams.filters);
  if (filters && filters !== "undefined" && filters.id) {
    where.id = Number(filters.id);
  }
  if (searchParams.id) {
    where.id = Number(searchParams.id);
  }

  if (searchParams.userId) {
    where.projects.some.assignments = {
      some: {
        userId: Number(searchParams.userId),
      },
    };
  }
  where.status = "ARCHIVED";

  const clientLeads = await prisma.clientLead.findMany({
    where,
    skip,
    take: limit,
    include: {
      projects: {
        include: {
          assignments: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });
  clientLeads.forEach((lead) => {
    const groupedProjects = groupProjects(lead.projects);
    lead.groupedProjects = groupedProjects;
  });

  const total = await prisma.clientLead.count({ where });
  return { data: clientLeads, total };
}
export async function createNewTask({ data, isAdmin = false, staffId }) {
  const { userId, projectId, ...rest } = data;

  const createdTask = await prisma.task.create({
    data: {
      ...rest,
    },
  });
  const update = {};
  let project = null;
  if (projectId) {
    update.projectId = Number(projectId);
    project = await prisma.project.findUnique({
      where: {
        id: Number(projectId),
      },
      select: {
        assignments: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
  }
  if (userId) {
    update.userId = Number(userId);
  }
  if (Object.keys(update).length > 0) {
    await prisma.task.update({
      where: {
        id: createdTask.id,
      },
      data: update,
    });
  }

  const newTask = await prisma.task.findUnique({
    where: {
      id: createdTask.id,
    },
  });

  await newTaskCreatedNotification(
    newTask.id,
    staffId && !isAdmin ? staffId : null,
    projectId,
    newTask.title,
    isAdmin,
    newTask.type === "MODIFICATION"
  );
  if (project && project.assignments && isAdmin) {
    project.assignments.forEach(async (assignment) => {
      await newTaskCreatedNotification(
        newTask.id,
        assignment.userId,
        projectId,
        newTask.title,
        null,
        newTask.type === "MODIFICATION"
      );
    });
  }
  return newTask;
}
export async function updateTask({ data, taskId, isAdmin = false, userId }) {
  const oldTask = await prisma.task.findUnique({
    where: { id: Number(taskId) },
    select: {
      status: true,
    },
  });
  if (!isAdmin && oldTask.status === "DONE") {
    throw new Error("You can't change the task after DONE only admin can");
  }

  if (data.status && data.status === "DONE") {
    data.finishedAt = new Date();
  }
  data.updatedAt = new Date();
  const updatedTask = await prisma.task.update({
    where: { id: Number(taskId) },
    data,
  });

  const task = await prisma.task.findUnique({
    where: {
      id: Number(taskId),
    },
    select: {
      id: true,
      projectId: true,
      title: true,
    },
  });
  let project = null;
  if (task.projectId) {
    project = await prisma.project.findUnique({
      where: {
        id: Number(task.projectId),
      },
      select: {
        id: true,
        assignments: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
  }
  await updateTaskNotification(
    task.id,
    userId && !isAdmin ? userId : null,
    task.projectId,
    task.title,
    isAdmin,
    task.type === "MODIFICATION"
  );
  if (project && project.assignments && isAdmin) {
    project.assignments.forEach(async (assignment) => {
      await updateTaskNotification(
        task.id,
        assignment.userId,
        task.projectId,
        task.title,
        false,
        task.type === "MODIFICATION"
      );
    });
  }
  return updatedTask;
}
export async function getNotes({ idKey, id }) {
  const notes = await prisma.note.findMany({
    where: {
      [idKey]: Number(id),
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      attachment: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return notes;
}
export async function addNote({
  attachment,
  userId,
  content,
  idKey,
  id,
  isAdmin,
  client,
}) {
  const data = {
    content,
    attachment,
  };
  const MAX_LENGTH = 360;

  if (client && content && content.length > MAX_LENGTH) {
    throw new Error(
      `Note content is too long. Max length is ${MAX_LENGTH} characters current length is ${content.length}.`
    );
  }
  if (userId) {
    data.userId = Number(userId);
  }
  if (client) {
    const admin = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
      },
    });
    data.userId = admin.id;
  }
  if (idKey && id) {
    data[idKey] = Number(id);
  }
  const note = await prisma.note.create({
    data,
  });
  const actualNote = await prisma.note.findUnique({
    where: {
      id: Number(note.id),
    },
    include: {
      user: true,
    },
  });
  if (actualNote.clientLeadId) {
    await updateALead(actualNote.clientLeadId);
    const teleChannel = await getChannelEntitiyByTeleRecordAndLeadId({
      clientLeadId: Number(actualNote.clientLeadId),
    });
    if (teleChannel) {
      await uploadANote(note, teleChannel);
    }
  }
  if (actualNote.updateId) {
    await updateAClientLeadUpdate(actualNote.updateId);
    const update = await prisma.clientLeadUpdate.findUnique({
      where: {
        id: Number(actualNote.updateId),
      },
      select: {
        clientLeadId: true,
      },
    });
    await updateALead(update.clientLeadId);
  }
  if (actualNote.taskId) {
    await updateTask({ data: {}, taskId: actualNote.taskId, isAdmin, userId });
  }

  return { data: note, message: "Note created successfully" };
}

export async function deleteNote({ id, isAdmin }) {
  const note = await prisma.note.findUnique({
    where: {
      id: Number(id),
    },
    select: {
      createdAt: true,
    },
  });
  if (!note) {
    throw new Error("Note not found");
  }
  if (!isAdmin) {
    const now = dayjs();
    const createdAt = dayjs(note.createdAt);
    const diffInMinutes = now.diff(createdAt, "minute");

    if (diffInMinutes > 5) {
      throw new Error("Cannot delete note older than 5 minutes");
    }
  }
  await prisma.note.delete({
    where: {
      id: Number(id),
    },
  });
  return { data: note, message: "Note deleted successfully" };
}

export async function deleteAModel({ id, isAdmin, data }) {
  const model = data.model;
  const item = await prisma[model].findUnique({
    where: {
      id: Number(id),
    },
    select: {
      createdAt: true,
    },
  });
  if (!item) {
    throw new Error(`${data.model} not found`);
  }

  if (!isAdmin) {
    const now = dayjs();
    const createdAt = dayjs(item.createdAt);
    const diffInMinutes = now.diff(createdAt, "minute");

    if (diffInMinutes > 5) {
      throw new Error(`Cannot delete ${data.model} older than 5 minutes`);
    }
  }
  if (data.deleteModelesBeforeMain) {
    data.deleteModelesBeforeMain.forEach(async (mod) => {
      await prisma[mod.name].deleteMany({
        where: {
          [mod.key]: Number(id),
        },
      });
    });
  }

  if (model === "MeetingReminder") {
    const meeting = await prisma.meetingReminder.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        availableSlotId: true,
      },
    });
    if (meeting && meeting.availableSlotId) {
      await prisma.availableSlot.update({
        where: {
          id: meeting.availableSlotId,
        },
        data: {
          isBooked: false,
          meetingReminderId: null,
        },
      });
    }
  }
  await prisma[model].delete({
    where: {
      id: Number(id),
    },
  });
  return { data: item, message: `${data.model} deleted successfully` };
}

// fake updates

export async function updateAClientLeadUpdate(updateId) {
  return await prisma.clientLeadUpdate.update({
    where: {
      id: Number(updateId),
    },
    data: {
      updatedAt: new Date(),
    },
  });
}
export async function updateALead(leadId) {
  return await prisma.clientLead.update({
    where: {
      id: Number(leadId),
    },
    data: {
      updatedAt: new Date(),
    },
  });
}

/////// end of utility ///////
/////// image session ///////

export async function getImageSesssionModel({ model, searchParams }) {
  const data = await prisma[model].findMany();
  return data;
}
export async function getImages({ patternIds, spaceIds }) {
  const patternIdList = patternIds
    ? patternIds
        .split(",")
        .map((id) => Number(id))
        .filter(Boolean)
    : [];

  const spaceIdList = spaceIds
    ? spaceIds
        .split(",")
        .map((id) => Number(id))
        .filter(Boolean)
    : [];

  const where = {
    isArchived: false,
    ...(patternIdList.length > 0 && {
      patterns: {
        some: {
          id: { in: patternIdList },
        },
      },
    }),
    ...(spaceIdList.length > 0 && {
      spaces: {
        some: {
          id: { in: spaceIdList },
        },
      },
    }),
  };

  const images = await prisma.image.findMany({
    where,
    include: {
      patterns: true,
      spaces: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return images;
}

export async function getAdmins() {
  let where = {};
  where.OR = [
    {
      role: {
        in: ["ADMIN", "SUPER_ADMIN"],
      },
    },
    { subRoles: { some: { subRole: { in: ["ADMIN", "SUPER_ADMIN"] } } } },
  ];
  where.isActive = true;
  const users = await prisma.user.findMany({
    where: where,
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return users;
}

//SalesStage
export async function getSalesStages({ clientLeadId }) {
  return await prisma.SalesStage.findMany({
    where: {
      clientLeadId: Number(clientLeadId),
    },
  });
}

export async function getUniqueStage({ key = "id", id, stage }) {
  return await prisma.SalesStage.findUnique({
    where: {
      [key]: [key === "id" ? Number(id) : SalesStage],
    },
  });
}

export async function editSalesSage({
  curentStageType,
  clientLeadId,
  nextStage,
  action,
}) {
  clientLeadId = Number(clientLeadId);
  if (nextStage && nextStage.key !== "NOT_INITIATED") {
    const isPresent = await prisma.salesStage.findUnique({
      where: {
        clientLeadId_stage: {
          clientLeadId,
          stage: nextStage.key,
        },
      },
    });

    if (!isPresent) {
      await prisma.SalesStage.create({
        data: {
          stage: nextStage.key,
          clientLeadId,
        },
      });
    }
  }
  if (action === "back" && curentStageType !== "NOT_INITIATED") {
    await prisma.salesStage.delete({
      where: {
        clientLeadId_stage: {
          clientLeadId,
          stage: curentStageType,
        },
      },
    });
  }
  return true;
}

export async function remindUserToPay({ clientLeadId }) {
  const clientLead = await prisma.clientLead.findUnique({
    where: { id: Number(clientLeadId) },
    select: {
      id: true,
      paymentSessionId: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  let session;
  let reuseExistingSession = false;

  if (clientLead.paymentSessionId) {
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(
        clientLead.paymentSessionId
      );

      // Only reuse if not expired or completed
      if (
        existingSession &&
        existingSession.status === "open" && // status can be "open", "complete", "expired"
        existingSession.expires_at * 1000 > Date.now()
      ) {
        session = existingSession;
        reuseExistingSession = true;
      }
    } catch (err) {
      console.warn("Could not retrieve Stripe session:", err.message);
    }
  }

  // If no valid session, create new
  if (!reuseExistingSession) {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      metadata: {
        clientId: clientLead.client.id,
        clientLeadId: clientLead.id,
        lng: "ar",
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "[احجز الآن وابدأ تصميمك]",
              description: "٢٩ دولار 💵 – تُخصم بالكامل عند التعاقد",
            },
            unit_amount: 2900,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}&clientId=${clientLead.client.id}&clientLeadId=${clientLead.id}&lng=ar`,
      cancel_url: `${process.env.ORIGIN}/cancel?session_id={CHECKOUT_SESSION_ID}&clientId=${clientLead.client.id}&clientLeadId=${clientLead.id}&lng=ar`,
      expires_at: Math.floor(Date.now() / 1000) + 3600 * 24, // Optional: 24-hour expiry
    });

    // Store new session ID
    await prisma.clientLead.update({
      where: { id: clientLead.id },
      data: {
        paymentSessionId: session.id,
      },
    });
  }

  // Send email with session URL
  await sendPaymentReminderEmailByStaff(
    clientLead.client.email,
    clientLead.client.name,
    session.url,
    "ar"
  );
}
export async function remindUserToCompleteRegister({ clientLeadId }) {
  const clientLead = await prisma.clientLead.findUnique({
    where: { id: Number(clientLeadId) },
    select: {
      id: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  await sendPaymentSuccessEmail(
    clientLead.client.email,
    clientLead.client.name,
    clientLeadId,
    "ar"
  );
}

// get delivery schedule
// create new delivery
// link a delivery to a meeting
// delete a delivery
// get meeting by id
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
async function getProjectsGrouped({ clientLeadId }) {
  const where = {
    clientLeadId: Number(clientLeadId),
  };
  return await prisma.project.findMany({
    where,
    distinct: ["groupId", "groupTitle"],
    select: { groupId: true, groupTitle: true },
    orderBy: [{ groupTitle: "asc" }, { groupId: "asc" }],
  });
}
export async function getUniqueProjectGroups({ clientLeadId }) {
  const groups = await getProjectsGrouped({ clientLeadId });
  if (!groups || groups.length === 0) {
    const newProjects = [];
    PROJECT_TYPES.forEach((type) => {
      newProjects.push({
        type,
        status: "To Do",
        priority: "MEDIUM",
        startedAt: null,
        endedAt: null,
        groupTitle: "Initial Project",
        groupId: 1,
        role:
          type === "3D_Designer" || type === "3D_Modification"
            ? "THREE_D_DESIGNER"
            : "TWO_D_DESIGNER",
      });
    });
    const isPresent = await prisma.project.findFirst({
      where: {
        groupId: 1,
        clientLeadId: Number(clientLeadId),
        groupTitle: "Initial Project",
      },
    });
    if (!isPresent) {
      await prisma.project.createMany({
        data: newProjects.map((project) => ({
          ...project,
          clientLeadId: Number(clientLeadId),
        })),
      });
    }
    groups = await getProjectsGrouped({ clientLeadId });
  }

  return groups;
}

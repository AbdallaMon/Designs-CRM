// leads/lead — assign / status / convert + list aggregators.
// Extracted VERBATIM from lead.usecase.js (behavior-preserving; no logic/value change).
// These repo-backed module functions are imported back into lead.usecase.js and wired
// into the `legacyDefaults` DI seam there. Prisma NEVER appears here (only repo calls);
// notification / telegram-queue side effects are invoked from their infra locations.
import dayjs from "dayjs";
import { leadRepository } from "./lead.repo.js";
import {
  filterDealsByContractLevel,
  mapColumnLeadsContractStage,
} from "./lead.dto.js";
import {
  assignLeadNotification,
  assignMultipleLeadsNotification,
  convertALeadNotification,
  updateLeadStatusNotification,
} from "../../../infra/notifications/legacy-notification.js";
import { ClientLeadStatus } from "../../../infra/config/legacy-enums.js";
import { telegramChannelQueue } from "../../../infra/queues/telegram-channel.queue.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { leadsMessagesCodes as C } from "@dms/shared";

// ════════════════════════════════════════════════════════════════════════════════
//  REPO-BACKED module functions (ported 1:1 from the legacy shared/legacy/lead-services.js
//  mutations + read aggregators). Prisma I/O is delegated to leadRepository; the
//  notification / telegram-queue side effects are invoked from their current infra
//  locations (imported above). These replace the former shared/legacy barrel lazy-imports
//  and are wired into the `legacyDefaults` DI seam below — mirroring the migrated
//  delivery/update/task usecases. Behavior, error strings, and typos are preserved verbatim.
// ════════════════════════════════════════════════════════════════════════════════
export async function checkIfUserAllowedToTakeALead(userId, country) {
  const user = await leadRepository.getUserAllowedCountries({ userId });
  const notAllowed = user?.notAllowedCountries ?? [];

  const allowed = !notAllowed.includes(country);
  return allowed;
}

export async function assignLeadToAUser(clientLeadId, userId, isAdmin) {
  const clientLead = await leadRepository.findFullLead({ id: clientLeadId });
  if (
    clientLead.status !== "NEW" &&
    clientLead.status !== "ON_HOLD" &&
    !isAdmin
  ) {
    throw new AppError(C.LEAD_ALREADY_ASSIGNED, 400);
  }
  const isAlloedToTakeThisLead = await checkIfUserAllowedToTakeALead(
    Number(userId),
    clientLead.country,
  );
  if (!isAlloedToTakeThisLead) {
    throw new AppError(C.LEAD_COUNTRY_NOT_ALLOWED, 403);
  }
  const activeLeadsCount = await leadRepository.countLeads({
    where: {
      userId: userId,
      status: {
        notIn: ["FINALIZED", "REJECTED", "ON_HOLD", "CONVERTED"],
      },
    },
  });
  const maxUserLeadsCount = await leadRepository.getUserLeadLimits({ userId });
  if (activeLeadsCount >= (maxUserLeadsCount.maxLeadsCounts || 50)) {
    throw new AppError(C.LEAD_MAX_ACTIVE_REACHED, 400);
  }
  const startOfToday = dayjs().startOf("day").toDate();
  const endOfToday = dayjs().endOf("day").toDate();
  const todaysLeadsCount = await leadRepository.countLeads({
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
    throw new AppError(C.LEAD_MAX_PER_DAY_REACHED, 400);
  }
  if (clientLead.status === "ON_HOLD" || isAdmin) {
    const shadowLead = await leadRepository.createLead({
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
  const updatedClientLead = await leadRepository.assignLeadUpdate({
    id: clientLeadId,
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
  });
  await assignLeadNotification(clientLeadId, userId, updatedClientLead);

  return updatedClientLead;
}

export async function bulkAssignLeadTsoAUser(leadsIds, userId, isAdmin) {
  await leadRepository.bulkAssignLeads({ leadsIds, userId });
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
      throw new AppError(C.LEAD_STATUS_TRANSITION_FORBIDDEN, 403);
    }
    if (oldStatus === "ON_HOLD") {
      throw new AppError(C.LEAD_STATUS_TRANSITION_FORBIDDEN, 403);
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

  const lead = await leadRepository.updateLeadStatusData({ id: clientLeadId, data });
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
    await leadRepository.deleteInvoiceNotesByLead({ clientLeadId });
    await leadRepository.deleteInvoicesByLead({ clientLeadId });
    await leadRepository.deletePaymentNotesByLead({ clientLeadId });
    await leadRepository.deletePaymentsByLead({ clientLeadId });
    await leadRepository.deleteExtraServicesByLead({ clientLeadId });
  }

  await updateLeadStatusNotification(
    lead.id,
    heading,
    content,
    updatePrice ? "FINAL_PRICE_ADDED" : "LEAD_UPDATED",
    lead.userId,
    isAdmin,
    !isAdmin ? lead.userId : null,
    status === "FINALIZED",
  );
  if (status === "FINALIZED") {
    const hasChannel = await leadRepository.findTelegramChannelByLead({
      clientLeadId: lead.id,
    });

    if (!hasChannel) {
      await telegramChannelQueue.add(
        "create-channel",
        { clientLeadId: lead.id },
        {
          jobId: `create-${lead.id}`,
          removeOnComplete: true,
          removeOnFail: false,
        },
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
  withInclude = false,
) {
  const reason = reasonToConvert || "Overdue";

  const lead = await leadRepository.convertLeadUpdate({
    clientLeadId,
    status,
    reason,
    withInclude,
  });
  if (status === "ON_HOLD") {
    await convertALeadNotification(lead);
  }
  return lead;
}

export async function getClientLeadsByDateRange({ searchParams, isAdmin, user }) {
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

    if (user?.currentProfileKey !== "PRIMARY_SALES" && user?.currentProfileKey !== "SUPER_SALES") {
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
  const clientLeads = await leadRepository.findDeals({
    where,
    callRemindersWhere,
    updatesWhere,
    sharedUpdatesWhere,
  });
  return filterDealsByContractLevel(clientLeads, filters);
}

export async function getClientLeadsColumnStatus({ searchParams, isAdmin, user }) {
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
    if (filters?.id && filters.id !== "all") {
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

    const clientLeads = await leadRepository.findColumnLeads({
      where,
      skip: Number(searchParams.skip) || 0,
      take: Number(searchParams.take) || 20,
      callRemindersWhere,
      updatesWhere,
      sharedUpdatesWhere,
    });

    let result = mapColumnLeadsContractStage(clientLeads, filters);

    const consolusion = await leadRepository.aggregateColumn({ where });

    const extraServicesTotal = await leadRepository.aggregateExtraServices({ where });

    const averagePrice = Number(consolusion._sum.averagePrice ?? 0);
    const extraServicesPrice = Number(extraServicesTotal._sum.price ?? 0);

    const totalValue = (averagePrice + extraServicesPrice).toFixed(2);

    const totalLeads = consolusion._count.id;

    return { data: result, totalValue, totalLeads };
  } catch (e) {
    console.error(e.message, "error in column status");
    throw e;
  }
}

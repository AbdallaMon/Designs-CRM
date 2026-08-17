// leads/lead — assign / status / convert + list aggregators.
// Extracted VERBATIM from lead.usecase.js (behavior-preserving; no logic/value change).
// These repo-backed functions are imported directly by lead.usecase.js. Prisma never
// appears here; notification and queue side effects use their current infra modules.
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
} from "../../../infra/notifications/index.js";
import { ClientLeadStatus } from "../../../infra/config/enums.js";
import { telegramChannelQueue } from "../../../infra/queues/telegram-channel.queue.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  LEAD_STATUSES, KANBAN_VIEW_TYPES,
  leadsMessagesCodes,
  NOTIFICATION_TYPES,
  PROFILES,
  WORK_DEPARTMENTS,
} from "@dms/shared";

// ════════════════════════════════════════════════════════════════════════════════
//  REPO-BACKED module functions (ported 1:1 from the legacy shared/legacy/lead-services.js
//  mutations + read aggregators). Prisma I/O is delegated to leadRepository; the
//  notification / telegram-queue side effects are invoked from their current infra
//  locations (imported above). These replace the former shared/legacy barrel lazy-imports
//  and are imported directly by the lead facade.
// ════════════════════════════════════════════════════════════════════════════════

// Claim status rule: a NEW or ON_HOLD lead (or a missing record) becomes IN_PROGRESS
// on assignment; any other status is preserved. Extracted verbatim from the previous
// inline ternary so behavior is identical — exported for direct testing (#5).
export function claimStatus(lead) {
  return !lead || lead.status === LEAD_STATUSES.ON_HOLD || lead.status === LEAD_STATUSES.NEW ? LEAD_STATUSES.IN_PROGRESS : lead.status;
}

// Admin assignment is also the consultation handoff for leads that still belong to
// either intake pool: consulted NEW or non-consulted. Advance both lifecycle fields in
// the same Prisma update. Reassigning a later consulted deal preserves its workflow state.
export function assignmentLifecycleFields(lead, isAdmin) {
  const shouldStartConsultedDeal =
    Boolean(isAdmin) &&
    Boolean(lead) &&
    (lead.status === LEAD_STATUSES.NEW || lead.initialConsult === false);

  return {
    status: shouldStartConsultedDeal ? LEAD_STATUSES.IN_PROGRESS : claimStatus(lead),
    ...(shouldStartConsultedDeal ? { initialConsult: true } : {}),
  };
}

export async function checkIfUserAllowedToTakeALead(userId, country) {
  const user = await leadRepository.getUserAllowedCountries({ userId });
  const notAllowed = user?.notAllowedCountries ?? [];

  const allowed = !notAllowed.includes(country);
  return allowed;
}

export async function assignLeadToAUser(clientLeadId, userId, isAdmin) {
  const clientLead = await leadRepository.findFullLead({ id: clientLeadId });
  if (
    clientLead.status !== LEAD_STATUSES.NEW &&
    clientLead.status !== LEAD_STATUSES.ON_HOLD &&
    !isAdmin
  ) {
    throw new AppError({ code: leadsMessagesCodes.LEAD_ALREADY_ASSIGNED, statusCode: 400 });
  }
  const isAlloedToTakeThisLead = await checkIfUserAllowedToTakeALead(
    Number(userId),
    clientLead.country,
  );
  if (!isAlloedToTakeThisLead) {
    throw new AppError({ code: leadsMessagesCodes.LEAD_COUNTRY_NOT_ALLOWED, statusCode: 403 });
  }
  const activeLeadsCount = await leadRepository.countLeads({
    where: {
      userId: userId,
      status: {
        notIn: [LEAD_STATUSES.FINALIZED, LEAD_STATUSES.REJECTED, LEAD_STATUSES.ON_HOLD, LEAD_STATUSES.CONVERTED],
      },
    },
  });
  const maxUserLeadsCount = await leadRepository.getUserLeadLimits({ userId });
  if (activeLeadsCount >= (maxUserLeadsCount.maxLeadsCounts || 50)) {
    throw new AppError({ code: leadsMessagesCodes.LEAD_MAX_ACTIVE_REACHED, statusCode: 400 });
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
    throw new AppError({ code: leadsMessagesCodes.LEAD_MAX_PER_DAY_REACHED, statusCode: 400 });
  }
  if (clientLead.status === LEAD_STATUSES.ON_HOLD || isAdmin) {
    const shadowLead = await leadRepository.createLead({
      data: {
        clientId: clientLead.clientId,
        userId: clientLead.userId,
        selectedCategory: clientLead.selectedCategory,
        description: clientLead.description,
        type: clientLead.type,
        emirate: clientLead.emirate,
        price: clientLead.price,
        status: LEAD_STATUSES.CONVERTED,
        leadType: LEAD_STATUSES.CONVERTED,
        previousLeadId: clientLead.id,
      },
    });
  }
  const updatedClientLead = await leadRepository.assignLeadUpdate({
    id: clientLeadId,
    data: {
      userId: userId,
      assignedAt: new Date(),
      ...assignmentLifecycleFields(clientLead, isAdmin),
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
      oldStatus === LEAD_STATUSES.FINALIZED ||
      oldStatus === LEAD_STATUSES.REJECTED ||
      oldStatus === "ARCHIVED"
    ) {
      throw new AppError({ code: leadsMessagesCodes.LEAD_STATUS_TRANSITION_FORBIDDEN, statusCode: 403 });
    }
    if (oldStatus === LEAD_STATUSES.ON_HOLD) {
      throw new AppError({ code: leadsMessagesCodes.LEAD_STATUS_TRANSITION_FORBIDDEN, statusCode: 403 });
    }
  }

  const data = {
    status,
    updatedAt: new Date(),
  };
  if (oldStatus !== "ARCHIVED" && status === LEAD_STATUSES.FINALIZED) {
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
  if (isAdmin && oldStatus === LEAD_STATUSES.FINALIZED) {
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
    updatePrice
      ? NOTIFICATION_TYPES.FINAL_PRICE_ADDED
      : NOTIFICATION_TYPES.LEAD_UPDATED,
    lead.userId,
    isAdmin,
    !isAdmin ? lead.userId : null,
    status === LEAD_STATUSES.FINALIZED,
  );
  if (status === LEAD_STATUSES.FINALIZED) {
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
  status = LEAD_STATUSES.CONVERTED,
  withInclude = false,
) {
  const reason = reasonToConvert || "Overdue";

  const lead = await leadRepository.convertLeadUpdate({
    clientLeadId,
    status,
    reason,
    withInclude,
  });
  if (status === LEAD_STATUSES.ON_HOLD) {
    await convertALeadNotification(lead);
  }
  return lead;
}

export async function getClientLeadsByDateRange({ searchParams, isAdmin, user }) {
  const filters =
    (searchParams.filters &&
      searchParams.filters !== "undefined" &&
      JSON.parse(searchParams.filters)) ||
    {};
  const where = {
    assignedTo: { isNot: null },
    status: { notIn: [LEAD_STATUSES.NEW, LEAD_STATUSES.CONVERTED] },
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

    if (
      user?.currentProfileKey !== PROFILES.PRIMARY_SALES &&
      user?.currentProfileKey !== PROFILES.SUPER_SALES
    ) {
      where.status = {
        notIn: [
          LEAD_STATUSES.NEW,
          "ARCHIVED",
          LEAD_STATUSES.ON_HOLD,
          LEAD_STATUSES.FINALIZED,
          LEAD_STATUSES.REJECTED,
          LEAD_STATUSES.CONVERTED,
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
    sharedUpdatesWhere.type = WORK_DEPARTMENTS.STAFF;
    updatesWhere.OR = [
      {
        department: WORK_DEPARTMENTS.STAFF,
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
            type: WORK_DEPARTMENTS.STAFF,
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
            type: WORK_DEPARTMENTS.ADMIN,
            isArchived: false,
          },
        },
      },
    ];
  }

  if (filters.contractLevel && filters.contractLevel !== "all") {
    where.contracts = {
      some: {
        status: LEAD_STATUSES.IN_PROGRESS,
        stages: {
          some: {
            title: { in: [filters.contractLevel] },
            stageStatus: LEAD_STATUSES.IN_PROGRESS,
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
      (searchParams.filters &&
        searchParams.filters !== "undefined" &&
        JSON.parse(searchParams.filters)) ||
      {};

    let where = {
      assignedTo: { isNot: null },
      status: searchParams.status,
      leadType: "NORMAL",
    };
    if (
      filters?.range &&
      searchParams.status !== "ARCHIVED" &&
      searchParams.status !== LEAD_STATUSES.FINALIZED &&
      searchParams.type !== KANBAN_VIEW_TYPES.CONTRACT_LEVELS
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
        searchParams.status !== LEAD_STATUSES.FINALIZED &&
        searchParams.type !== KANBAN_VIEW_TYPES.CONTRACT_LEVELS
      ) {
        where.assignedAt = {
          gte: dayjs().subtract(3, "month").toDate(),
          lte: dayjs().toDate(),
        };
      }
    }
    if (
      (searchParams.status === LEAD_STATUSES.FINALIZED ||
        searchParams.type === KANBAN_VIEW_TYPES.CONTRACT_LEVELS) &&
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

    if (searchParams.type === KANBAN_VIEW_TYPES.CONTRACT_LEVELS) {
      delete where.status;
      where.contracts = {
        some: {
          status: LEAD_STATUSES.IN_PROGRESS,
          stages: {
            some: {
              title: { in: [searchParams.status] },
              stageStatus: LEAD_STATUSES.IN_PROGRESS,
            },
          },
        },
      };
    }
    if (!isAdmin) {
      sharedUpdatesWhere.type = WORK_DEPARTMENTS.STAFF;
      updatesWhere.OR = [
        {
          department: WORK_DEPARTMENTS.STAFF,
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
              type: WORK_DEPARTMENTS.STAFF,
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
              type: WORK_DEPARTMENTS.ADMIN,
              isArchived: false,
            },
          },
        },
      ];
    }

    if (filters.contractLevel && filters.contractLevel !== "all") {
      where.contracts = {
        some: {
          status: LEAD_STATUSES.IN_PROGRESS,
          stages: {
            some: {
              title: { in: [filters.contractLevel] },
              stageStatus: LEAD_STATUSES.IN_PROGRESS,
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

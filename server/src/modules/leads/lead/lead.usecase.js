// leads/lead usecase — business logic / orchestration. Prisma NEVER appears here
// (only repo calls). Behavior is ported 1:1 from the legacy handlers + services
// (routes/shared/client-leads.js, services/main/shared/leadServices.js,
// staff/staffServices.js, shared/{payment,delivery,utility}Services.js,
// admin/adminServices.js). Errors are thrown as AppError(code, statusCode); the
// envelope serializes them. The IDOR fix lives in checkIfUserCanAccessLead /
// checkIfUserCanMutateLead (the keystone) + the per-sub-resource ownership checks.
//
// SIDE EFFECTS (notifications, telegram channels, Stripe, BullMQ, updateLead) are a
// later migration phase; we invoke the EXISTING implementations via lazy imports so
// observable behavior is preserved without duplicating thousands of lines — the same
// pattern used by the migrated courses module.
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { leadsMessagesCodes as C } from "@dms/shared";
import { leadRepository } from "./lead.repo.js";
import {
  computeLeadCapabilities,
  filterDealsByContractLevel,
  mapColumnLeadsContractStage,
} from "./lead.dto.js";
// Cross-cluster side effects stay in their CURRENT infra locations (imported directly
// from where they live — NOT moved). These do not import the leads module, so the static
// imports introduce no cycle (previously reached lazily through the shared/legacy barrel).
import {
  assignLeadNotification,
  assignMultipleLeadsNotification,
  convertALeadNotification,
  updateLeadStatusNotification,
  newCallNotification,
  newFileUploaded,
  newNoteNotification,
  newPriceOffer,
  updateCallNotification,
  updateMettingNotification,
} from "../../../infra/notifications/legacy-notification.js";
import { ClientLeadStatus } from "../../../infra/config/legacy-enums.js";
import { telegramChannelQueue } from "../../../infra/queues/telegram-channel.queue.js";
import { v4 as uuidv4 } from "uuid";
// Telegram channel side effects for note/file uploads (stay at their infra home).
import {
  getChannelEntitiyByTeleRecordAndLeadId,
  uploadAnAttachment,
  uploadANote,
} from "../../../infra/telegram/telegram-functions.js";
// The canonical "touch the lead" side effect the staff sub-resources interleave — kept
// at its CURRENT home in the utilities legacy service (a separate later task owns that).
import { updateLead } from "../../utilities/legacy/utility.js";
// Payment functions migrated to the leads/payment sub-entity (Stripe + email side effects).
import {
  makePayments as paymentMakePayments,
  makeExtraServicePayments as paymentMakeExtraServicePayments,
  remindUserToPay as paymentRemindUserToPay,
  remindUserToCompleteRegister as paymentRemindUserToCompleteRegister,
} from "../payment/payment.usecase.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// ════════════════════════════════════════════════════════════════════════════════
//  REPO-BACKED module functions (ported 1:1 from the legacy shared/legacy/lead-services.js
//  mutations + read aggregators). Prisma I/O is delegated to leadRepository; the
//  notification / telegram-queue side effects are invoked from their current infra
//  locations (imported above). These replace the former shared/legacy barrel lazy-imports
//  and are wired into the `legacyDefaults` DI seam below — mirroring the migrated
//  delivery/update/task usecases. Behavior, error strings, and typos are preserved verbatim.
// ════════════════════════════════════════════════════════════════════════════════
async function checkIfUserAllowedToTakeALead(userId, country) {
  const user = await leadRepository.getUserAllowedCountries({ userId });
  const notAllowed = user?.notAllowedCountries ?? [];

  const allowed = !notAllowed.includes(country);
  return allowed;
}

async function assignLeadToAUser(clientLeadId, userId, isAdmin) {
  const clientLead = await leadRepository.findFullLead({ id: clientLeadId });
  if (
    clientLead.status !== "NEW" &&
    clientLead.status !== "ON_HOLD" &&
    !isAdmin
  ) {
    throw new Error("This lead has already been assigned to a user");
  }
  const isAlloedToTakeThisLead = await checkIfUserAllowedToTakeALead(
    Number(userId),
    clientLead.country,
  );
  if (!isAlloedToTakeThisLead) {
    throw new Error(
      "You are not allowed to take this lead cause it is out of your allowed countries range",
    );
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
    throw new Error(
      `You cannot take more than ${
        maxUserLeadsCount.maxLeadsCounts || 50
      } active leads.`,
    );
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
    throw new Error(
      `You cannot take more than ${
        maxUserLeadsCount.maxLeadCountPerDay || 5
      } leads per day.`,
    );
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

async function bulkAssignLeadTsoAUser(leadsIds, userId, isAdmin) {
  await leadRepository.bulkAssignLeads({ leadsIds, userId });
  await assignMultipleLeadsNotification(leadsIds, userId);

  return true;
}

async function updateClientLeadStatus({
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
        "You cant change the status from rejected or finalized or archived only admin can ,Contact your administrator to take an action",
      );
    }
    if (oldStatus === "ON_HOLD") {
      throw new Error(
        "You cant change the status from hold only admin can ,Contact your administrator to take an action",
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

async function markClientLeadAsConverted(
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

async function getClientLeadsByDateRange({ searchParams, isAdmin, user }) {
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
  const clientLeads = await leadRepository.findDeals({
    where,
    callRemindersWhere,
    updatesWhere,
    sharedUpdatesWhere,
  });
  return filterDealsByContractLevel(clientLeads, filters);
}

async function getClientLeadsColumnStatus({ searchParams, isAdmin, user }) {
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
    console.log(e.message, "error in column statsus");
  }
}

// ════════════════════════════════════════════════════════════════════════════════
//  STAFF sub-resource orchestration (ported 1:1 from the former legacy/staff-services.js).
//  Prisma I/O is delegated to leadRepository; the interleaved SIDE EFFECTS (notifications,
//  telegram channels, updateLead, uuid tokens, dayjs tz) run from their CURRENT infra
//  locations (imported above). Behavior, guards, error strings, and typos are verbatim.
// ════════════════════════════════════════════════════════════════════════════════
async function createNote({ clientLeadId, userId, content }) {
  if (!content.trim()) {
    throw new Error("Note content cannot be empty.");
  }

  const newNote = await leadRepository.createNoteRecord({
    content,
    clientLeadId,
    userId,
  });
  if (clientLeadId) {
    const teleChannel = await getChannelEntitiyByTeleRecordAndLeadId({
      clientLeadId: Number(clientLeadId),
    });
    const note = await leadRepository.findNoteWithUser({ id: newNote.id });
    if (teleChannel) {
      await uploadANote(note, teleChannel);
    }
  }
  await updateLead(clientLeadId);
  newNote.content = content;
  await newNoteNotification(clientLeadId, content, newNote.user.id);
  return newNote;
}

async function createCallReminder({
  clientLeadId,
  userId,
  time,
  reminderReason,
}) {
  const userTimezone = dayjs.tz.guess(); // Detect user's timezone

  let formattedTime = dayjs(time).tz(userTimezone).utc(); // Convert to UTC
  if (formattedTime.isBefore(dayjs().utc())) {
    throw new Error("The reminder time must be in the future.");
  }
  formattedTime = formattedTime.toDate().toISOString();
  const newReminder = await leadRepository.createCallReminderRecord({
    clientLeadId,
    userId,
    time: formattedTime,
    reminderReason,
  });
  await newCallNotification(clientLeadId, newReminder);
  let latestTwo = await leadRepository.findLatestCallReminders({ clientLeadId });
  await updateLead(clientLeadId);
  return { latestTwo, newReminder };
}

async function createMeetingReminder({
  clientLeadId,
  userId,
  time,
  reminderReason,
  isAdmin,
  adminId,
  type,
  currentUser,
}) {
  if (
    currentUser.role === "THREE_D_DESIGNER" ||
    currentUser.role === "TWO_D_DESIGNER"
  ) {
    throw new Error("You are not allow to create meeting");
  }
  const userTimezone = dayjs.tz.guess(); // Detect user's timezone

  let formattedTime = dayjs(time).tz(userTimezone).utc();
  if (formattedTime.isBefore(dayjs().utc())) {
    throw new Error("The reminder time must be in the future.");
  }
  formattedTime = formattedTime.toDate().toISOString();
  const submittedTime = dayjs(formattedTime); // already UTC ISO

  const minTime = submittedTime.subtract(15, "minute").toISOString();
  const maxTime = submittedTime.add(15, "minute").toISOString();
  const data = { clientLeadId, userId, time: formattedTime, reminderReason };

  if (adminId) {
    const matchingSlot = await leadRepository.findMatchingAvailableSlot({
      adminId,
      minTime,
      maxTime,
    });
    if (!matchingSlot) {
      throw new Error("No available time for this admin in the current dates");
    }
    data.time = matchingSlot.startTime;
    data.availableSlotId = matchingSlot.id;
  }

  if (isAdmin) {
    data.isAdmin = true;
  }
  if (adminId) {
    data.adminId = Number(adminId);
  }
  if (type) {
    data.type = type;
  }
  const newReminder = await leadRepository.createMeetingReminderRecord({ data });
  if (newReminder.availableSlotId) {
    await leadRepository.bookAvailableSlot({
      id: newReminder.availableSlotId,
      meetingReminderId: newReminder.id,
    });
  }
  await newCallNotification(clientLeadId, newReminder);
  let latestTwo = await leadRepository.findLatestMeetingReminders({
    clientLeadId,
  });
  await updateLead(clientLeadId);
  return { latestTwo, newReminder };
}

async function createMeetingReminderWithToken({
  clientLeadId,
  userId,
  reminderReason,
  isAdmin,
  adminId,
  type,
  currentUser,
}) {
  if (
    currentUser.role === "THREE_D_DESIGNER" ||
    currentUser.role === "TWO_D_DESIGNER"
  ) {
    throw new Error("You are not allow to create meeting");
  }
  const token = uuidv4();

  const data = { clientLeadId, userId, reminderReason, token };

  if (isAdmin) {
    data.isAdmin = true;
  }
  if (adminId) {
    data.adminId = Number(adminId);
    const today = dayjs().startOf("day").toDate();
    const halfNextMonth = dayjs()
      .add(1, "month")
      .startOf("month")
      .add(14, "day")
      .endOf("day")
      .toDate();

    const availableSlot = await leadRepository.findAvailableSlotInRange({
      adminId,
      from: today,
      to: halfNextMonth,
    });

    if (!availableSlot) {
      throw new Error(
        "No available slots found for this admin in the coming days ,ask admin to add available slots"
      );
    }
  }
  if (type) {
    data.type = type;
  }

  const newReminder = await leadRepository.createMeetingReminderTokenRecord({
    data,
  });
  let latestTwo = await leadRepository.findLatestMeetingReminders({
    clientLeadId,
  });
  await updateLead(clientLeadId);
  return { latestTwo, newReminder };
}

async function createPriceOffer({ clientLeadId, userId, priceOffer }) {
  if (priceOffer.minPrice > priceOffer.maxPrice) {
    throw new Error("End price must be bigger or equal to start price");
  }
  const newPrice = await leadRepository.createPriceOfferRecord({
    clientLeadId,
    userId,
    priceOffer,
  });
  await updateLead(clientLeadId);
  await newPriceOffer(clientLeadId, newPrice);
  return newPrice;
}

async function createFile({
  clientLeadId,
  url,
  name,
  description,
  userId,
}) {
  if (!url || !name) {
    throw new Error("Fill all the fields please");
  }
  const data = {
    name,
    clientLeadId,
    url,
    description,
  };
  if (userId) {
    data.userId = Number(userId);
  }
  const file = await leadRepository.createFileRecord({ data });
  if (file.clientLeadId) {
    const teleChannel = await getChannelEntitiyByTeleRecordAndLeadId({
      clientLeadId: Number(file.clientLeadId),
    });
    if (teleChannel) {
      await uploadAnAttachment(file, teleChannel);
    }
  }
  if (userId !== null) {
    await newFileUploaded(clientLeadId, data, userId);
  }
  await updateLead(clientLeadId);
  return { ...file, name, url, description, isUserFile: userId !== null };
}

async function updateCallReminderStatus({
  reminderId,
  currentUser,
  status,
  callResult = null,
}) {
  if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
    const callReminder = await leadRepository.findCallReminderOwner({
      reminderId,
    });
    if (callReminder.user.id !== currentUser.id) {
      throw new Error(
        "You are not allowed to update this call result ask admin to do that"
      );
    }
  }
  const updatedReminder = await leadRepository.updateCallReminderStatusRecord({
    reminderId,
    status,
    callResult: status === "DONE" ? callResult : "Missed call",
  });
  await updateLead(updatedReminder.clientLeadId);
  await updateCallNotification(
    updatedReminder.clientLeadId,
    updatedReminder,
    currentUser.id
  );
  return updatedReminder;
}

async function updateMeetingReminderStatus({
  reminderId,
  currentUser,
  status,
  meetingResult = null,
}) {
  if (
    currentUser.role === "THREE_D_DESIGNER" ||
    currentUser.role === "TWO_D_DESIGNER"
  ) {
    throw new Error("You are not allow to update this meeting");
  }

  if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
    const meetingReminder = await leadRepository.findMeetingReminderOwner({
      reminderId,
    });
    if (meetingReminder.user.id !== currentUser.id) {
      throw new Error(
        "You are not allowed to update this call result ask admin to do that"
      );
    }
  }
  const updatedReminder = await leadRepository.updateMeetingReminderStatusRecord({
    reminderId,
    status,
    meetingResult: status === "DONE" ? meetingResult : "Missed Meeting",
  });
  await updateLead(updatedReminder.clientLeadId);
  await updateMettingNotification(
    updatedReminder.clientLeadId,
    updatedReminder,
    currentUser.id
  );
  return updatedReminder;
}

export const getCallReminders = async (searchParams) => {
  const staffFilter = searchParams.staffId
    ? { userId: Number(searchParams.staffId) }
    : {};

  try {
    const callReminders = await leadRepository.findInProgressCallReminders({
      staffFilter,
    });

    return callReminders;
  } catch (error) {
    console.error("Error fetching call reminders:", error);
    throw new Error("Unable to fetch call reminders");
  }
};

// ── DI seam (unchanged shape). `legacyDefaults` now points at the REPO-BACKED module
// functions above (assign/status/convert + the STAFF sub-resources) + the leads/payment
// sub-entity, with only `updateLeadField` still lazily reaching admin-residual's own
// legacy folder (a separate later task), instead of the removed shared/legacy barrel.
// Tests can still override the whole bag via the constructor.
const legacyDefaults = {
  // migrated to repo-backed module functions in THIS file
  assignLeadToAUser,
  bulkAssignLeadTsoAUser,
  markClientLeadAsConverted,
  updateClientLeadStatus,
  checkIfUserAllowedToTakeALead,
  getClientLeadsByDateRange,
  getClientLeadsColumnStatus,
  // migrated to the leads/payment sub-entity (Stripe + email side effects)
  makePayments: paymentMakePayments,
  makeExtraServicePayments: paymentMakeExtraServicePayments,
  remindUserToPay: paymentRemindUserToPay,
  remindUserToCompleteRegister: paymentRemindUserToCompleteRegister,
  // price-offer DATA now lives in the lead repo
  editPriceOfferStatus: (...a) => leadRepository.editPriceOfferStatus(...a),
  // still in admin-residual's OWN legacy folder (separate later task)
  updateLeadField: (a) => import("../../admin-residual/legacy/admin-services.js").then((m) => m.updateLeadField(a)),
  // staff sub-resources — now the repo-backed module functions above
  createCallReminder,
  createMeetingReminder,
  createMeetingReminderWithToken,
  createPriceOffer,
  createFile,
  createNote,
  updateCallReminderStatus,
  updateMeetingReminderStatus,
};

// Roles that historically had FULL read scope on the LIST (legacy excluded these from
// the country narrowing in getClientLeads).
const LIST_FULL_ROLES = ["SUPER_ADMIN", "ADMIN", "SUPER_SALES", "CONTACT_INITIATOR"];

export class LeadUsecase {
  /**
   * @param {import("./lead.repo.js").LeadRepository} repository
   * @param {Partial<typeof legacyDefaults>} [legacy]
   */
  constructor(repository, legacy = {}) {
    this.repo = repository;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  isAdminUser(authUser) {
    return (
      authUser?.role === "ADMIN" ||
      authUser?.role === "SUPER_ADMIN" ||
      Boolean(authUser?.isSuperSales)
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  SCOPE CHECKERS — the keystone IDOR fix
  // ════════════════════════════════════════════════════════════════════════════
  // Read scope: full-scope roles see all; a scoped user sees their own assigned
  // leads PLUS an unassigned NEW lead (the claimable pool legacy exposed). Throws
  // 403 LEAD_ACCESS_DENIED when the lead is outside scope (or does not exist — we do
  // not leak existence to an unauthorized caller).
  async checkIfUserCanAccessLead({ id, authUser }) {
    const where = this.repo.buildAuthUserLeadWhere({
      authUser,
      where: { id: Number(id) },
      mode: "view",
      includeContactInitiator: true,
    });
    const lead = await this.repo.findScopedLead({ where });
    if (!lead) {
      throw new AppError(C.LEAD_ACCESS_DENIED, 403);
    }
    return lead;
  }

  // Write scope: stricter — owned-only for scoped users (no claimable-pool write).
  async checkIfUserCanMutateLead({ id, authUser }) {
    const where = this.repo.buildAuthUserLeadWhere({
      authUser,
      where: { id: Number(id) },
      mode: "mutate",
    });
    const lead = await this.repo.findScopedLead({ where });
    if (!lead) {
      throw new AppError(C.LEAD_MUTATE_DENIED, 403);
    }
    return lead;
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  LIST SURFACES
  // ════════════════════════════════════════════════════════════════════════════
  // Legacy getClientLeads: status/filter where + (for non-privileged roles) a
  // country restriction. Does NOT scope by assignment — the list is the shared pool.
  async list({ query, authUser, page, limit, skip }) {
    const searchParams = { ...query, checkConsult: true };
    const where = await this.#buildListWhere(searchParams, authUser.id);
    const { items, total } = await this.repo.listLeads({ where, skip, take: limit });
    return { items, total, page, pageSize: limit };
  }

  async #buildListWhere(searchParams, userId) {
    let where = { leadType: "NORMAL" };
    const { isNew = false, status = null, assignedOverdue = false } = searchParams;
    const filters = JSON.parse(searchParams.filters);

    if (assignedOverdue) {
      where = { status: "ON_HOLD" };
      if (searchParams?.staffId) {
        where.assignedTo = { is: { id: { not: Number(searchParams.staffId) } } };
      }
    } else {
      if (isNew) where.status = "NEW";
      else if (status) where.status = status;
      else where.status = { notIn: ["NEW", "CONVERTED", "ON_HOLD"] };
      if (searchParams?.staffId) where.userId = Number(searchParams.staffId);
    }
    if (filters?.clientId && filters.clientId !== "all" && filters.clientId !== null) {
      where.clientId = Number(filters.clientId);
    }
    if (filters?.staffId && filters.staffId !== "all") where.userId = Number(filters.staffId);
    if (filters?.type && filters.type !== "all") where.selectedCategory = filters.type;
    if (filters?.range) {
      const { startDate, endDate } = filters.range;
      const now = dayjs();
      const start = startDate ? dayjs(startDate) : now.subtract(30, "days");
      const end = endDate ? dayjs(endDate).endOf("day") : now;
      where.assignedAt = { gte: start.toDate(), lte: end.toDate() };
    }
    if (searchParams.checkConsult) where.initialConsult = true;
    if (searchParams.noConsulted && searchParams.noConsulted === "true") where = { initialConsult: false };
    if (filters.id && filters.id !== "all") where.id = Number(filters.id);

    const user = await this.repo.getUserCountryRole({ userId });
    if (!LIST_FULL_ROLES.includes(user.role)) {
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
    return where;
  }

  // Counts for the leads-page KPI rail + tab badges, in ONE call. Each count reuses the
  // SAME where-builder its pool uses so the badge equals what that pool actually lists:
  //   new          → isNew (status NEW + initialConsult) pool
  //   nonConsulted → noConsulted (initialConsult:false) pool
  //   stale        → assignedOverdue (ON_HOLD not-assigned-to-me) pool — staffId = caller
  //   calls/meetings → the IN_PROGRESS reminder countWhere (#staffFilter scoping)
  async summary({ query, authUser }) {
    const F = "{}"; // no extra filters for the headline counts
    const [newWhere, nonConsultedWhere, staleWhere] = await Promise.all([
      this.#buildListWhere({ isNew: true, checkConsult: true, filters: F }, authUser.id),
      this.#buildListWhere({ noConsulted: "true", filters: F }, authUser.id),
      this.#buildListWhere(
        { assignedOverdue: true, staffId: authUser.id, filters: F },
        authUser.id,
      ),
    ]);

    const reminderCountWhere = {
      status: "IN_PROGRESS",
      clientLead: {
        status: { notIn: ["CONVERTED", "ON_HOLD", "FINALIZED", "REJECTED"] },
        ...this.#staffFilter(query),
      },
    };

    const [newCount, nonConsulted, stale, calls, meetings] = await Promise.all([
      this.repo.countLeads({ where: newWhere }),
      this.repo.countLeads({ where: nonConsultedWhere }),
      this.repo.countLeads({ where: staleWhere }),
      this.repo.countCalls({ where: reminderCountWhere }),
      this.repo.countMeetings({ where: reminderCountWhere }),
    ]);

    return { new: newCount, nonConsulted, stale, calls, meetings };
  }

  // Deals / columns delegate to the legacy aggregators (identical filter+select
  // logic, heavy and self-contained) so behavior is preserved 1:1. We apply the same
  // self-scoping the legacy ROUTE applied before calling them.
  async deals({ query, authUser }) {
    const searchParams = { ...query };
    const admin = this.isAdminUser(authUser);
    if (
      authUser.role !== "ADMIN" &&
      authUser.role !== "SUPER_ADMIN" &&
      authUser.role !== "ACCOUNTANT" &&
      authUser.role !== "SUPER_SALES"
    ) {
      searchParams.selfId = authUser.id;
      searchParams.userId = authUser.id;
    }
    const isAdmin =
      authUser.role === "ADMIN" ||
      authUser.role === "SUPER_ADMIN" ||
      authUser.role !== "SUPER_SALES"; // verbatim legacy expression (see /deals)
    const items = await this.legacy.getClientLeadsByDateRange({ searchParams, isAdmin, user: authUser });
    return items;
  }

  async columns({ query, authUser }) {
    const searchParams = { ...query };
    if (
      authUser.role !== "ADMIN" &&
      authUser.role !== "SUPER_ADMIN" &&
      authUser.role !== "ACCOUNTANT" &&
      !authUser.isSuperSales
    ) {
      searchParams.selfId = authUser.id;
      searchParams.userId = authUser.id;
    }
    const isAdmin =
      authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN" || Boolean(authUser.isSuperSales);
    return this.legacy.getClientLeadsColumnStatus({ searchParams, isAdmin, user: authUser });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DETAIL — scope already enforced by the checker; here we reproduce the legacy
  //  admin-vs-staff branch + the staff-detail extra carve-outs, then add capabilities.
  // ════════════════════════════════════════════════════════════════════════════
  async getById({ id, query, authUser }) {
    const lead = await this.#getDetail({ id, query, authUser });
    return { ...lead, capabilities: computeLeadCapabilities(lead, authUser) };
  }

  // Shared detail resolver (the legacy admin-vs-staff branch + the staff carve-outs).
  // Used by getById AND the per-tab readers below, so every tab observes the SAME
  // scoped subset / record shapes the full detail returns (no fileWhere divergence).
  async #getDetail({ id, query, authUser }) {
    const role = authUser.role;
    const searchParams = { ...query };
    const privileged =
      role === "ADMIN" || role === "SUPER_ADMIN" || authUser.isSuperSales || role === "CONTACT_INITIATOR";

    if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "ACCOUNTANT" && !authUser.isSuperSales) {
      searchParams.userId = authUser.id;
    }
    if (role !== "ADMIN" && role !== "CONTACT_INITIATOR" && role !== "SUPER_ADMIN" && !authUser.isSuperSales) {
      searchParams.checkConsult = true;
    }

    return privileged
      ? await this.#getAdminDetail(Number(id), searchParams)
      : await this.#getStaffDetail(Number(id), searchParams, role, authUser.id, authUser);
  }

  // ── Per-tab readers (lazy, object-scoped) ──────────────────────────────────────
  // Each returns ONLY its slice of the detail so the FE can fetch a tab independently
  // and refetch just that tab after a mutation. They reuse #getDetail so the exact
  // admin/staff scoping + per-record shapes of the full detail are preserved 1:1
  // (the route already enforced lead-access scope via checkIfUserCanAccessLead).
  async getLeadNotes({ id, query, authUser }) {
    const lead = await this.#getDetail({ id, query, authUser });
    return lead?.notes ?? [];
  }

  async getLeadCalls({ id, query, authUser }) {
    const lead = await this.#getDetail({ id, query, authUser });
    return lead?.callReminders ?? [];
  }

  async getLeadMeetings({ id, query, authUser }) {
    const lead = await this.#getDetail({ id, query, authUser });
    return lead?.meetingReminders ?? [];
  }

  async getLeadFiles({ id, query, authUser }) {
    const lead = await this.#getDetail({ id, query, authUser });
    return lead?.files ?? [];
  }

  async getLeadPriceOffers({ id, query, authUser }) {
    const lead = await this.#getDetail({ id, query, authUser });
    return lead?.priceOffers ?? [];
  }

  async #getAdminDetail(clientLeadId, searchParams) {
    const where = { id: Number(clientLeadId) };
    if (searchParams.checkConsult) where.initialConsult = true;
    const clientLead = await this.repo.findAdminLeadDetail({ where });
    if (clientLead?.contracts?.length > 0) this.#decorateContractStage(clientLead);
    return clientLead;
  }

  async #getStaffDetail(clientLeadId, searchParams, role, userId, user) {
    let where = {};
    let leadWhere = {};

    if (searchParams.userId && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      const assigned = await this.repo.findFirstByUserId({ userId: Number(searchParams.userId) });
      if (!assigned) where.userId = Number(searchParams.userId);
    }
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      const shuffle = await this.repo.findOnHoldOwner({ id: Number(clientLeadId) });
      if (shuffle && shuffle.userId !== Number(userId)) {
        where = {};
      } else if (!user.isPrimary) {
        leadWhere.status = { notIn: ["NEW", "ARCHIVED", "ON_HOLD", "FINALIZED", "REJECTED", "CONVERTED"] };
      }
    }
    const isNew = await this.repo.findUnassignedNew({ id: Number(clientLeadId) });
    if (isNew) delete where.userId;

    const initialConsultWhere = searchParams.checkConsult ? { initialConsult: true } : {};
    const fullWhere = { id: Number(clientLeadId), ...initialConsultWhere, ...where, ...leadWhere };
    const clientLead = await this.repo.findLeadDetail({ where: fullWhere, fileWhere: where });
    if (!clientLead) throw new AppError(C.LEAD_NOT_FOUND, 404);

    clientLead.callReminders = [
      ...clientLead.callReminders.filter((c) => c.status === "IN_PROGRESS"),
      ...clientLead.callReminders.filter((c) => c.status !== "IN_PROGRESS"),
    ];
    if (clientLead.contracts?.length > 0) this.#decorateContractStage(clientLead);
    return clientLead;
  }

  #decorateContractStage(clientLead) {
    const currentStage = clientLead.contracts[0].stages?.find((s) => s.stageStatus === "IN_PROGRESS");
    clientLead.contracts[0].stage = currentStage;
    clientLead.contracts[0].contractLevel = currentStage?.title;
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  ASSIGN / CONVERT / STATUS
  // ════════════════════════════════════════════════════════════════════════════
  async assign({ body, authUser }) {
    const isAdmin = this.isAdminUser(authUser);
    // The PUT / endpoint is overloaded: "claim to self" vs admin "assign to other".
    // Self-claim (the FE "استلام" button) sends ONLY { id } — no userId. An admin
    // claiming a lead to themselves previously fell through to `body.userId`
    // (undefined → NaN → prisma.user.findUnique missing-id 500). Distinguish on the
    // PRESENCE of an explicit userId, not on admin status: assign-to-other only when
    // an admin-tier caller actually supplies a target user; otherwise claim to self.
    const wantsAssignToOther = isAdmin && body.userId != null;
    const targetUserId = wantsAssignToOther ? Number(body.userId) : Number(authUser.id);
    const result = await this.legacy.assignLeadToAUser(Number(body.id), targetUserId, isAdmin);
    return { data: result, assignedToOther: wantsAssignToOther };
  }

  async bulkConvert({ body, authUser }) {
    if (!this.isAdminUser(authUser)) throw new AppError(C.BULK_CONVERT_FORBIDDEN, 403);
    const result = await this.legacy.bulkAssignLeadTsoAUser(body.ids, body.userId, true);
    return result;
  }

  async convert({ body }) {
    // "تحويل إلى صفقة" moves the lead to ON_HOLD (the legacy "owner gave up the lead,
    // free it for another user" path). markClientLeadAsConverted → convertALeadNotification
    // dereferences the CURRENT owner (lead.userId) to notify them; on an UNASSIGNED lead
    // that is null → `null.id` 500. Convert is only meaningful for an assigned lead, so
    // reject the unassigned case with a clean domain error instead of crashing.
    const lead = await this.repo.findLeadOwner({ id: Number(body.id) });
    if (!lead) throw new AppError(C.LEAD_NOT_FOUND, 404);
    if (lead.userId == null) throw new AppError(C.LEAD_CONVERT_REQUIRES_OWNER, 409);
    return this.legacy.markClientLeadAsConverted(Number(body.id), body.reasonToConvert, "ON_HOLD");
  }

  async changeStatus({ id, body, authUser, currentStatus }) {
    const isAdmin = this.isAdminUser(authUser);
    // SECURITY: the legacy non-admin transition lock keys off `oldStatus`. A client
    // could forge `oldStatus` to bypass the FINALIZED/REJECTED/ARCHIVED/ON_HOLD lock
    // and re-open a finalized deal. Derive `oldStatus` from the server (the scope
    // checker's loaded row, falling back to a fresh repo read) and override the body —
    // the client value is never trusted.
    const { oldStatus: _ignoredClientOldStatus, ...rest } = body;
    const serverOldStatus =
      currentStatus ?? (await this.repo.findLeadStatus({ id: Number(id) }))?.status;
    await this.legacy.updateClientLeadStatus({
      clientLeadId: Number(id),
      ...rest,
      oldStatus: serverOldStatus,
      isAdmin,
      userId: Number(authUser.id),
    });
    return { updatePrice: Boolean(body.updatePrice) };
  }

  async updateField({ id, body }) {
    return this.legacy.updateLeadField({ data: { ...body }, leadId: id });
  }

  async checkCountry({ userId, country }) {
    const allowed = await this.legacy.checkIfUserAllowedToTakeALead(userId, country);
    return { allowed: Boolean(allowed) };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  CALLS
  // ════════════════════════════════════════════════════════════════════════════
  async listCalls({ query, skip, limit, page }) {
    const where = {
      status: "IN_PROGRESS",
      ...this.#staffFilter(query),
      clientLead: { status: { notIn: ["CONVERTED", "ON_HOLD", "REJECTED"] }, ...this.#staffFilter(query) },
    };
    const countWhere = {
      status: "IN_PROGRESS",
      clientLead: {
        status: { notIn: ["CONVERTED", "ON_HOLD", "FINALIZED", "REJECTED"] },
        ...this.#staffFilter(query),
      },
    };
    const { items, total } = await this.repo.findNextCalls({ where, countWhere, skip, take: limit });
    return { items, total, page, pageSize: limit };
  }

  async createCall({ id, body, authUser }) {
    return this.legacy.createCallReminder({ clientLeadId: Number(id), userId: authUser.id, ...body });
  }

  async updateCall({ reminderId, body, authUser }) {
    return this.legacy.updateCallReminderStatus({ reminderId: Number(reminderId), currentUser: authUser, ...body });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  MEETINGS
  // ════════════════════════════════════════════════════════════════════════════
  async listMeetings({ query, skip, limit, page }) {
    const where = {
      status: "IN_PROGRESS",
      time: { not: null },
      ...this.#staffFilter(query),
      clientLead: { status: { notIn: ["CONVERTED", "ON_HOLD", "REJECTED"] }, ...this.#staffFilter(query) },
    };
    const countWhere = {
      status: "IN_PROGRESS",
      clientLead: {
        status: { notIn: ["CONVERTED", "ON_HOLD", "FINALIZED", "REJECTED"] },
        ...this.#staffFilter(query),
      },
    };
    const { items, total } = await this.repo.findNextMeetings({ where, countWhere, skip, take: limit });
    return { items, total, page, pageSize: limit };
  }

  getMeetingById({ meetingId }) {
    return this.repo.findMeetingById({ meetingId });
  }

  getMeetingRemindersByLead({ clientLeadId }) {
    return this.repo.findMeetingRemindersByLead({ clientLeadId });
  }

  async createMeeting({ id, body, authUser }) {
    return this.legacy.createMeetingReminder({ clientLeadId: Number(id), currentUser: authUser, userId: authUser.id, ...body });
  }

  async createMeetingWithToken({ id, body, authUser }) {
    return this.legacy.createMeetingReminderWithToken({ clientLeadId: Number(id), currentUser: authUser, userId: authUser.id, ...body });
  }

  async updateMeeting({ reminderId, body, authUser }) {
    return this.legacy.updateMeetingReminderStatus({ reminderId: Number(reminderId), currentUser: authUser, ...body });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  PRICE OFFERS / PAYMENTS / FILES / NOTES / REMINDERS
  // ════════════════════════════════════════════════════════════════════════════
  async createPriceOffer({ id, body, authUser }) {
    return this.legacy.createPriceOffer({ clientLeadId: Number(id), userId: authUser.id, ...body });
  }

  async changePriceOfferStatus({ body }) {
    return this.legacy.editPriceOfferStatus(body.priceOfferId, body.isAccepted);
  }

  async makePayments({ id, body }) {
    if (body.paymentType === "extra-service") {
      return this.legacy.makeExtraServicePayments({ data: body.payments, leadId: Number(id), ...body });
    }
    return this.legacy.makePayments(body.payments, Number(id));
  }

  async createFile({ id, body }) {
    return this.legacy.createFile({ clientLeadId: Number(id), ...body });
  }

  async createNote({ id, body, authUser }) {
    return this.legacy.createNote({ clientLeadId: Number(id), userId: authUser.id, ...body });
  }

  async sendPaymentReminder({ clientLeadId }) {
    return this.legacy.remindUserToPay({ clientLeadId: Number(clientLeadId) });
  }

  async sendCompleteRegisterReminder({ clientLeadId }) {
    return this.legacy.remindUserToCompleteRegister({ clientLeadId: Number(clientLeadId) });
  }

  // ── ownership lookups for sub-resource mutate checks ────────────────────────────
  async resolveCallReminderLead({ reminderId }) {
    const row = await this.repo.findCallReminderOwner({ reminderId });
    if (!row) throw new AppError(C.CALL_REMINDER_NOT_FOUND, 404);
    return row;
  }

  // A "meeting reminder" and a "meeting" are the same MeetingReminder row, keyed by
  // id. The PUT mutate path passes `reminderId`; the GET read path passes `meetingId`.
  // Accept either so the same resolver serves both.
  async resolveMeetingReminderLead({ reminderId, meetingId }) {
    const id = reminderId ?? meetingId;
    const row = await this.repo.findMeetingReminderOwner({ reminderId: id });
    if (!row) throw new AppError(C.MEETING_REMINDER_NOT_FOUND, 404);
    return row;
  }

  async resolvePriceOfferLead({ priceOfferId }) {
    const row = await this.repo.findPriceOfferLeadId({ priceOfferId });
    if (!row) throw new AppError(C.PRICE_OFFER_NOT_FOUND, 404);
    return row;
  }

  #staffFilter(query) {
    return query?.staffId && query.staffId !== "undefined" ? { userId: Number(query.staffId) } : {};
  }
}

export const leadUsecase = new LeadUsecase(leadRepository);

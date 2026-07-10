// leads/lead repository — Prisma I/O ONLY (no business rules, no AppError). Read
// queries + scope `where` builders are ported VERBATIM (selects/filters/order) from
// the legacy services so observable shapes are preserved 1:1:
//   - getClientLeads / getClientLeadsByDateRange / getClientLeadsColumnStatus
//     (services/main/shared/leadServices.js)
//   - getClientLeadDetails (leadServices) + getAdminClientLeadDetails (admin/adminServices)
//   - getNextCalls / getNextMeetings (services/main/shared/utilityServices.js)
//   - getMeetingById / getAllMeetingRemindersByClientLeadId (shared/deliveryServices.js)
// Simple mutations (notes/files/price-offers/payments/reminder-status/field updates)
// are also ported here; the heavy SIDE EFFECTS that legacy interleaves (notifications,
// telegram channels, Stripe, BullMQ, updateLead) stay in the not-yet-migrated services
// and are invoked from the usecase via lazy imports — exactly the courses pattern.
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import prisma from "../../../infra/prisma/prisma.js";
import { parseJsonField } from "../../../shared/utility/json-field.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// ── Roles that historically saw/mutated EVERY lead (legacy `isAdmin` union + the
// detail-only CONTACT_INITIATOR read). Kept here as the single place the scope logic
// reads role facts; the predicates below are the only role usage in the module and
// they only NARROW a Prisma `where` (never grant by role alone — a permission code is
// still required at the route).
const FULL_SCOPE_ROLES = ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"];

class LeadRepository {
  model = prisma.clientLead;

  // ── Scope `where` builders (the IDOR fix) ─────────────────────────────────────
  // Translate the auth user → a Prisma `where` fragment. Full-scope users get `{}`
  // (no narrowing); a scoped user is restricted to leads assigned to them, PLUS the
  // unassigned NEW pool that legacy let anyone view/claim (status NEW, userId null).
  // `mode: "view"` includes the claimable pool; `mode: "mutate"` is owned-only.
  hasFullScope({ role, isSuperSales, includeContactInitiator = false }) {
    if (isSuperSales) return true;
    if (FULL_SCOPE_ROLES.includes(role)) return true;
    if (includeContactInitiator && role === "CONTACT_INITIATOR") return true;
    return false;
  }

  buildAuthUserLeadWhere({ authUser, where = {}, mode = "view", includeContactInitiator = false }) {
    if (this.hasFullScope({ ...authUser, includeContactInitiator })) {
      return { ...where };
    }
    const ownership =
      mode === "mutate"
        ? { userId: Number(authUser.id) }
        : { OR: [{ userId: Number(authUser.id) }, { userId: null, status: "NEW" }] };
    // Merge ownership into an AND so we never clobber a caller-supplied OR.
    const existingAnd = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];
    return { ...where, AND: [...existingAnd, ownership] };
  }

  findById({ id, select, include }) {
    return prisma.clientLead.findUnique({
      where: { id: Number(id) },
      ...(select ? { select } : {}),
      ...(include ? { include } : {}),
    });
  }

  // Used by the scope checkers: load id+userId+status under the scoped `where`.
  findScopedLead({ where }) {
    return prisma.clientLead.findFirst({
      where,
      select: { id: true, userId: true, status: true },
    });
  }

  // Current owner (for the convert guard — convert is only valid on an assigned lead).
  findLeadOwner({ id }) {
    return prisma.clientLead.findUnique({
      where: { id: Number(id) },
      select: { id: true, userId: true, status: true },
    });
  }

  // Server-authoritative current status (used to override any client-supplied
  // oldStatus in changeStatus — workflow-guard bypass fix).
  findLeadStatus({ id }) {
    return prisma.clientLead.findUnique({
      where: { id: Number(id) },
      select: { id: true, status: true },
    });
  }

  // ── List (legacy getClientLeads) ──────────────────────────────────────────────
  async listLeads({ where, skip, take }) {
    const [items, total] = await Promise.all([
      prisma.clientLead.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: LIST_SELECT,
      }),
      prisma.clientLead.count({ where }),
    ]);
    return { items, total };
  }

  async getUserCountryRole({ userId }) {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { notAllowedCountries: true, role: true },
    });
    // notAllowedCountries is now a String? (LongText) JSON column — decode to the array.
    if (user) user.notAllowedCountries = parseJsonField(user.notAllowedCountries);
    return user;
  }

  // ── Counts (lead-pool summary for the leads page KPI rail / tab badges) ──────────
  countLeads({ where }) {
    return prisma.clientLead.count({ where });
  }

  countCalls({ where }) {
    return prisma.callReminder.count({ where });
  }

  countMeetings({ where }) {
    return prisma.meetingReminder.count({ where });
  }

  // ── Deals (legacy getClientLeadsByDateRange) ──────────────────────────────────
  findDeals({ where, callRemindersWhere, updatesWhere, sharedUpdatesWhere }) {
    return prisma.clientLead.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: dealsSelect({ callRemindersWhere, updatesWhere, sharedUpdatesWhere }),
    });
  }

  // ── Columns (legacy getClientLeadsColumnStatus) ───────────────────────────────
  findColumnLeads({ where, skip, take, callRemindersWhere, updatesWhere, sharedUpdatesWhere }) {
    return prisma.clientLead.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: "desc" },
      select: columnsSelect({ callRemindersWhere, updatesWhere, sharedUpdatesWhere }),
    });
  }

  aggregateColumn({ where }) {
    return prisma.clientLead.aggregate({ where, _count: { id: true }, _sum: { averagePrice: true } });
  }

  aggregateExtraServices({ where }) {
    return prisma.extraService.aggregate({ where: { clientLead: { ...where } }, _sum: { price: true } });
  }

  // ── Detail (staff view) — legacy getClientLeadDetails inner query ─────────────
  findLeadDetail({ where, fileWhere }) {
    return prisma.clientLead.findUnique({ where, select: detailSelect(fileWhere) });
  }

  findFirstByUserId({ userId }) {
    return prisma.clientLead.findFirst({ where: { userId: Number(userId) } });
  }

  findOnHoldOwner({ id }) {
    return prisma.clientLead.findUnique({
      where: { id: Number(id), status: "ON_HOLD" },
      select: { userId: true },
    });
  }

  findUnassignedNew({ id }) {
    return prisma.clientLead.findUnique({ where: { id: Number(id), status: "NEW", userId: null } });
  }

  // ── Detail (admin view) — legacy getAdminClientLeadDetails ────────────────────
  findAdminLeadDetail({ where }) {
    return prisma.clientLead.findUnique({ where, include: ADMIN_DETAIL_INCLUDE });
  }

  // ── Cockpit bundle (Sales Deal Cockpit) ───────────────────────────────────────
  // ONE query returning ONLY the language-neutral state the pure `computeCockpit`
  // needs (plus `userId`/`status` for the capability computation). Deliberately
  // narrow — no PII, no free-text, no ids beyond what the rules read — so the
  // read-only endpoint never over-exposes. Prisma stays here.
  //
  // Defense-in-depth: the VERSA objection steps carry long free-text scripts/responses
  // that the engine only needs as presence booleans. We collapse each step to
  // `{ hasQuestion, hasResponse }` HERE, right after the query, so the raw free-text
  // never leaves this read path (never handed to the engine, DTO, or response).
  async findCockpitBundle({ clientLeadId }) {
    const bundle = await prisma.clientLead.findUnique({
      where: { id: Number(clientLeadId) },
      select: COCKPIT_BUNDLE_SELECT,
    });
    if (!bundle) return bundle;
    return { ...bundle, versaModel: (bundle.versaModel ?? []).map(reduceVersaModel) };
  }

  // ── Calls / meetings lists ────────────────────────────────────────────────────
  async findNextCalls({ where, countWhere, skip, take }) {
    const [items, total] = await Promise.all([
      prisma.callReminder.findMany({
        where,
        include: { clientLead: { select: { id: true, client: { select: { name: true } }, status: true } } },
        orderBy: { time: "asc" },
        take,
        skip,
      }),
      prisma.callReminder.count({ where: countWhere }),
    ]);
    return { items, total };
  }

  async findNextMeetings({ where, countWhere, skip, take }) {
    const [items, total] = await Promise.all([
      prisma.meetingReminder.findMany({
        where,
        include: { clientLead: { select: { id: true, client: { select: { name: true } }, status: true } } },
        orderBy: { time: "asc" },
        take,
        skip,
      }),
      prisma.meetingReminder.count({ where: countWhere }),
    ]);
    return { items, total };
  }

  findMeetingById({ meetingId }) {
    // PII narrowing: legacy returned the full assignee User row (include user:true);
    // the FE only renders `meeting.user.name`, so expose the minimal safe set.
    return prisma.meetingReminder.findUnique({
      where: { id: Number(meetingId) },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  findMeetingRemindersByLead({ clientLeadId }) {
    // PII narrowing: legacy returned the full assignee User row (include user:true);
    // the FE only renders `meeting.user.name`, so expose the minimal safe set.
    return prisma.meetingReminder.findMany({
      where: { clientLeadId: Number(clientLeadId) },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  // ── Reminder ownership lookups (for the per-record mutate check) ───────────────
  findCallReminderOwner({ reminderId }) {
    return prisma.callReminder.findUnique({
      where: { id: Number(reminderId) },
      select: { id: true, userId: true, clientLeadId: true, user: { select: { id: true } } },
    });
  }

  findMeetingReminderOwner({ reminderId }) {
    return prisma.meetingReminder.findUnique({
      where: { id: Number(reminderId) },
      select: { id: true, userId: true, clientLeadId: true, user: { select: { id: true } } },
    });
  }

  findPriceOfferLeadId({ priceOfferId }) {
    return prisma.priceOffers.findUnique({
      where: { id: Number(priceOfferId) },
      select: { id: true, clientLeadId: true },
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  ASSIGN / STATUS / CONVERT data ops (legacy lead-services mutations)
  // ════════════════════════════════════════════════════════════════════════════
  // Full lead record (legacy assignLeadToAUser read the whole row before the guards).
  findFullLead({ id }) {
    return prisma.clientLead.findUnique({ where: { id: Number(id) } });
  }

  // Per-user lead caps (legacy maxUserLeadsCount read).
  getUserLeadLimits({ userId }) {
    return prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { maxLeadsCounts: true, maxLeadCountPerDay: true },
    });
  }

  // notAllowedCountries only (legacy checkIfUserAllowedToTakeALead read).
  async getUserAllowedCountries({ userId }) {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { notAllowedCountries: true },
    });
    // notAllowedCountries is now a String? (LongText) JSON column — decode to the array.
    if (user) user.notAllowedCountries = parseJsonField(user.notAllowedCountries);
    return user;
  }

  // Shadow/CONVERTED lead create (legacy assignLeadToAUser ON_HOLD/admin branch).
  createLead({ data }) {
    return prisma.clientLead.create({ data });
  }

  // Assign update (legacy select preserved verbatim).
  assignLeadUpdate({ id, data }) {
    return prisma.clientLead.update({
      where: { id },
      data,
      select: {
        id: true,
        status: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  // Bulk assign (legacy bulkAssignLeadTsoAUser).
  bulkAssignLeads({ leadsIds, userId }) {
    return prisma.clientLead.updateMany({
      where: {
        id: { in: leadsIds },
      },
      data: {
        userId: Number(userId),
        assignedAt: new Date(),
      },
    });
  }

  // Status update returning the full row (legacy updateClientLeadStatus).
  updateLeadStatusData({ id, data }) {
    return prisma.clientLead.update({
      where: { id },
      data,
    });
  }

  // FINALIZED cleanup group (legacy updateClientLeadStatus admin path), verbatim.
  deleteInvoiceNotesByLead({ clientLeadId }) {
    return prisma.note.deleteMany({
      where: {
        invoice: {
          payment: {
            clientLeadId: clientLeadId,
          },
        },
      },
    });
  }

  deleteInvoicesByLead({ clientLeadId }) {
    return prisma.invoice.deleteMany({
      where: {
        payment: {
          clientLeadId: clientLeadId,
        },
      },
    });
  }

  deletePaymentNotesByLead({ clientLeadId }) {
    return prisma.note.deleteMany({
      where: {
        payment: {
          clientLeadId: clientLeadId,
        },
      },
    });
  }

  deletePaymentsByLead({ clientLeadId }) {
    return prisma.payment.deleteMany({
      where: {
        clientLeadId,
      },
    });
  }

  deleteExtraServicesByLead({ clientLeadId }) {
    return prisma.extraService.deleteMany({
      where: {
        clientLeadId,
      },
    });
  }

  findTelegramChannelByLead({ clientLeadId }) {
    return prisma.telegramChannel.findFirst({
      where: {
        clientLeadId: clientLeadId,
      },
    });
  }

  // Convert update with optional relation include (legacy markClientLeadAsConverted).
  convertLeadUpdate({ clientLeadId, status, reason, withInclude }) {
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
    return prisma.clientLead.update(updateQuery);
  }

  // Bump a clientLead's updatedAt (legacy shared-utility `updateALead` — the canonical
  // "touch the lead" side effect, now owned here). Coerces the id exactly as legacy did.
  touchLead({ id }) {
    return prisma.clientLead.update({
      where: { id: Number(id) },
      data: { updatedAt: new Date() },
    });
  }

  // Price-offer accept/reject (legacy payment-services editPriceOfferStatus — price-offer DATA).
  editPriceOfferStatus(priceOfferId, isAccepted) {
    return prisma.priceOffers.update({
      where: {
        id: Number(priceOfferId),
      },
      data: {
        isAccepted,
      },
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  STAFF sub-resource data ops (notes / call+meeting reminders / price-offers /
  //  files / reminder-status) — Prisma I/O ported VERBATIM from the former
  //  legacy/staff-services.js. The interleaved SIDE EFFECTS (notifications, telegram
  //  channels, updateLead) stay in the usecase module functions that orchestrate these.
  // ════════════════════════════════════════════════════════════════════════════
  createNoteRecord({ content, clientLeadId, userId }) {
    return prisma.note.create({
      data: {
        content,
        clientLeadId,
        userId,
      },
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  findNoteWithUser({ id }) {
    return prisma.note.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
      },
    });
  }

  createCallReminderRecord({ clientLeadId, userId, time, reminderReason }) {
    return prisma.callReminder.create({
      data: {
        clientLeadId,
        userId,
        time,
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
  }

  findLatestCallReminders({ clientLeadId }) {
    return prisma.callReminder.findMany({
      where: {
        clientLeadId,
      },
      orderBy: { time: "desc" },
      take: 2,
    });
  }

  // createMeetingReminder ±15-minute slot match (legacy verbatim).
  findMatchingAvailableSlot({ adminId, minTime, maxTime }) {
    return prisma.availableSlot.findFirst({
      where: {
        isBooked: false,
        startTime: {
          gte: minTime,
          lte: maxTime,
        },
        availableDay: {
          userId: Number(adminId),
        },
      },
    });
  }

  // createMeetingReminderWithToken date-range slot lookup (legacy verbatim).
  findAvailableSlotInRange({ adminId, from, to }) {
    return prisma.availableSlot.findFirst({
      where: {
        isBooked: false,
        startTime: {
          gte: from,
          lte: to,
        },
        availableDay: {
          userId: Number(adminId),
        },
      },
    });
  }

  createMeetingReminderRecord({ data }) {
    return prisma.meetingReminder.create({
      data,
      select: {
        id: true,
        time: true,
        status: true,
        reminderReason: true,
        meetingResult: true,
        userId: true,
        type: true,
        isAdmin: true,
        adminId: true,
        token: true,
        availableSlotId: true,
        admin: {
          select: {
            name: true,
          },
        },
        user: {
          select: { name: true },
        },
      },
    });
  }

  createMeetingReminderTokenRecord({ data }) {
    return prisma.meetingReminder.create({
      data,
      select: {
        id: true,
        time: true,
        status: true,
        reminderReason: true,
        meetingResult: true,
        userId: true,
        type: true,
        isAdmin: true,
        adminId: true,
        token: true,
        admin: {
          select: {
            name: true,
          },
        },
        user: {
          select: { name: true },
        },
      },
    });
  }

  bookAvailableSlot({ id, meetingReminderId }) {
    return prisma.availableSlot.update({
      where: { id },
      data: { isBooked: true, meetingReminderId },
    });
  }

  findLatestMeetingReminders({ clientLeadId }) {
    return prisma.meetingReminder.findMany({
      where: {
        clientLeadId,
      },
      orderBy: { time: "desc" },
      take: 2,
    });
  }

  createPriceOfferRecord({ clientLeadId, userId, priceOffer }) {
    return prisma.PriceOffers.create({
      data: {
        clientLeadId,
        userId,

        url: priceOffer.url,
        note: priceOffer.note,
      },
      select: {
        id: true,
        createdAt: true,
        minPrice: true,
        maxPrice: true,
        note: true,
        url: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  createFileRecord({ data }) {
    return prisma.file.create({
      data,
      select: {
        id: true,
        createdAt: true,
        clientLeadId: true,
        description: true,
        url: true,
        name: true,
        isUserFile: true,
        user: {
          select: {
            name: true,
            id: true,
            email: true,
            telegramUsername: true,
          },
        },
      },
    });
  }

  updateCallReminderStatusRecord({ reminderId, status, callResult }) {
    return prisma.callReminder.update({
      where: { id: reminderId },
      data: {
        status,
        callResult,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        time: true,
        status: true,
        reminderReason: true,
        callResult: true,
        userId: true,
        clientLeadId: true,
        updatedAt: true,
        user: {
          select: { name: true },
        },
      },
    });
  }

  updateMeetingReminderStatusRecord({ reminderId, status, meetingResult }) {
    return prisma.meetingReminder.update({
      where: { id: reminderId },
      data: {
        status,
        meetingResult,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        time: true,
        status: true,
        reminderReason: true,
        meetingResult: true,
        userId: true,
        clientLeadId: true,
        token: true,
        updatedAt: true,
        user: {
          select: { name: true },
        },
      },
    });
  }

  findInProgressCallReminders({ staffFilter }) {
    return prisma.callReminder.findMany({
      where: {
        clientLead: {
          status: {
            notIn: ["CONVERTED", "ON_HOLD", "FINALIZED", "REJECTED"],
          },
          ...staffFilter,
        },
        status: "IN_PROGRESS",
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
  }

  // ── New-lead code sequencing + client file upload (legacy client-leads-service.js).
  //  `generateCodeForNewLead` keeps its `tx = prisma` param so the public-lead create
  //  path can run it inside a transaction exactly as before.
  async generateCodeForNewLead(clientId, tx = prisma) {
    // 1) Stable prefix from the *oldest* lead id for this client
    const oldestLead = await tx.clientLead.findFirst({
      where: { clientId: Number(clientId) },
      orderBy: { id: "asc" },
      select: { id: true },
    });
    if (!oldestLead) return null; // same behavior you had

    const prefix = `${String(oldestLead.id).padStart(7, "0")}.`;

    // 2) Pull the last code for this client with that prefix, then +1
    const lastWithCode = await tx.clientLead.findFirst({
      where: {
        clientId: Number(clientId),
        code: { startsWith: prefix },
      },
      orderBy: { code: "desc" }, // lexicographic works here since suffix is plain int
      select: { code: true },
    });

    const nextSeq = lastWithCode
      ? (parseInt(lastWithCode.code.split(".").pop(), 10) || 0) + 1
      : 1;

    return `${prefix}${nextSeq}`;
  }

  async uploadFile(body, clientLeadId) {
    const data = {
      name: "Client File",
      clientLeadId: Number(clientLeadId),
      url: body.url,
      isUserFile: false,
    };
    const file = await prisma.file.create({
      data,
      select: { id: true },
    });
    return file;
  }
}

// ── Selects (verbatim from legacy) ───────────────────────────────────────────────
const LIST_SELECT = {
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
  stateOfTheProject: true,
  location: true,
  projectType: true,
  projectStage: true,
  previousWork: true,
  hasArchitecturalPlan: true,
  serviceType: true,
  decisionMaker: true,
  bookingRequestStatus: true,
  bookingSubmittedAt: true,
  userId: true,
  client: { select: { name: true, email: true, phone: true } },
  assignedTo: { select: { id: true, name: true } },
};

function dealsSelect({ callRemindersWhere, updatesWhere, sharedUpdatesWhere }) {
  return {
    id: true,
    createdAt: true,
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
    location: true,
    projectType: true,
    projectStage: true,
    previousWork: true,
    hasArchitecturalPlan: true,
    serviceType: true,
    decisionMaker: true,
    bookingRequestStatus: true,
    bookingSubmittedAt: true,
    callReminders: { where: callRemindersWhere, orderBy: { time: "desc" }, take: 2 },
    contracts: {
      where: { status: "IN_PROGRESS" },
      orderBy: { id: "desc" },
      take: 1,
      select: {
        id: true,
        status: true,
        amount: true,
        totalAmount: true,
        stages: { select: { title: true, stageStatus: true } },
      },
    },
    updates: {
      orderBy: { updatedAt: "desc" },
      where: updatesWhere,
      take: 6,
      include: { sharedSettings: { where: sharedUpdatesWhere } },
    },
  };
}

function columnsSelect(args) {
  return { ...dealsSelect(args), extraServices: { select: { price: true } } };
}

function detailSelect(fileWhere) {
  return {
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
    stateOfTheProject: true,
    stripieMetadata: true,
    location: true,
    projectType: true,
    projectStage: true,
    previousWork: true,
    hasArchitecturalPlan: true,
    serviceType: true,
    decisionMaker: true,
    bookingRequestStatus: true,
    bookingSubmittedAt: true,
    createdAt: true,
    updatedAt: true,
    assignedAt: true,
    contracts: {
      where: { status: "IN_PROGRESS" },
      orderBy: { id: "desc" },
      take: 1,
      select: {
        id: true,
        status: true,
        amount: true,
        totalAmount: true,
        stages: { select: { title: true, stageStatus: true } },
      },
    },
    client: { select: { id: true, name: true, phone: true, email: true, arName: true, enName: true } },
    assignedTo: { select: { id: true, name: true, email: true } },
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
      where: fileWhere,
      select: {
        id: true,
        name: true,
        url: true,
        createdAt: true,
        description: true,
        isUserFile: true,
        user: { select: { name: true } },
      },
    },
    priceOffers: {
      where: fileWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        minPrice: true,
        maxPrice: true,
        note: true,
        userId: true,
        isAccepted: true,
        url: true,
        user: { select: { name: true } },
        createdAt: true,
      },
    },
    notes: {
      where: fileWhere,
      orderBy: { createdAt: "desc" },
      select: { id: true, content: true, userId: true, user: { select: { name: true } }, createdAt: true },
    },
    callReminders: {
      where: fileWhere,
      select: {
        id: true,
        time: true,
        status: true,
        reminderReason: true,
        callResult: true,
        userId: true,
        updatedAt: true,
        user: { select: { name: true } },
      },
      orderBy: { time: "desc" },
    },
    meetingReminders: {
      where: fileWhere,
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
        admin: { select: { name: true, email: true } },
        type: true,
        user: { select: { name: true } },
      },
      orderBy: { time: "desc" },
    },
    payments: {
      select: { id: true, status: true, amount: true, amountPaid: true, amountLeft: true, paymentReason: true },
    },
    extraServices: { select: { id: true, price: true, note: true } },
    // Additive: related-record totals for the FE hub rail (independent of the take:1
    // IN_PROGRESS contracts select above — these are true counts of every relation).
    _count: { select: { projects: true, contracts: true, imageSessions: true } },
  };
}

// Cockpit bundle select — the minimal state the pure rules engine consumes. Note the
// relation is `versaModel` (schema name); the usecase normalizes it to `versaModels`
// for the pure function. `userId`/`status` also feed `computeLeadCapabilities`.
//
// VERSA free-text (question/answer/clientResponse) is selected ONLY because Prisma
// can't project an "is-empty" boolean; `findCockpitBundle` immediately reduces each
// step to `{ hasQuestion, hasResponse }` (see `reduceVersaModel`) so the text never
// leaves the repo. `meetingReminders.type` and `versaModel.categoryId` are NOT
// selected — the engine never reads them.
const COCKPIT_BUNDLE_SELECT = {
  id: true,
  userId: true, // capability scope (canMutateLead)
  status: true, // health + rules + capability status guard
  paymentStatus: true,
  salesStages: { select: { stage: true } },
  callReminders: { select: { time: true, status: true } },
  meetingReminders: { select: { time: true, status: true } },
  priceOffers: { select: { isAccepted: true } },
  // Only whether each SPIN question is answered — not the answer text.
  sessionQuestions: { select: { answer: { select: { id: true } } } },
  versaModel: {
    select: {
      v: { select: { question: true, answer: true, clientResponse: true } },
      e: { select: { question: true, answer: true, clientResponse: true } },
      r: { select: { question: true, answer: true, clientResponse: true } },
      s: { select: { question: true, answer: true, clientResponse: true } },
      a: { select: { question: true, answer: true, clientResponse: true } },
    },
  },
};

// Collapse one VERSA step's free-text to the two presence booleans the engine reads.
// "Has a response" = a scripted answer OR a captured client response.
function reduceVersaStep(step) {
  if (!step) return null;
  return {
    hasQuestion: Boolean(step.question),
    hasResponse: Boolean(step.answer) || Boolean(step.clientResponse),
  };
}

// Map a VERSA model row to the boolean-only shape (drops all free-text before it can
// enter the engine/DTO/response).
function reduceVersaModel(vm) {
  return {
    v: reduceVersaStep(vm?.v),
    e: reduceVersaStep(vm?.e),
    r: reduceVersaStep(vm?.r),
    s: reduceVersaStep(vm?.s),
    a: reduceVersaStep(vm?.a),
  };
}

const ADMIN_DETAIL_INCLUDE = {
  client: true,
  assignedTo: true,
  priceOffers: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
  payments: { include: { invoices: true } },
  contracts: {
    where: { status: "IN_PROGRESS" },
    orderBy: { id: "desc" },
    take: 1,
    select: { id: true, stages: { select: { title: true, stageStatus: true } } },
  },
  extraServices: true,
  notes: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
  callReminders: { orderBy: { time: "desc" }, include: { user: { select: { name: true } } } },
  meetingReminders: {
    include: { user: { select: { name: true } }, admin: { select: { name: true } } },
    orderBy: { time: "desc" },
  },
  files: { include: { user: { select: { name: true } } } },
  // Additive: related-record totals for the FE hub rail (independent of the take:1
  // IN_PROGRESS contracts include above — these are true counts of every relation).
  _count: { select: { projects: true, contracts: true, imageSessions: true } },
};

export const leadRepository = new LeadRepository();
export { LeadRepository };

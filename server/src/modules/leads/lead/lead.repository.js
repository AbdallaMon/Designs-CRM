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

  getUserCountryRole({ userId }) {
    return prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { notAllowedCountries: true, role: true },
    });
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
    userId: true,
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
};

export const leadRepository = new LeadRepository();
export { LeadRepository };

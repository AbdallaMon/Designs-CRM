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
import { leadRepository } from "./lead.repository.js";
import { computeLeadCapabilities } from "./lead.dto.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// ── Lazy adapters to the not-yet-migrated services (behavior-preserving) ──────────
// Each loads the legacy implementation on first use. Grouped so tests can override
// the whole bag via the constructor.
const legacyDefaults = {
  // mutation orchestrators (notifications/telegram/queue/stripe baked in)
  assignLeadToAUser: (...a) => import("../../../../services/main/shared/index.js").then((m) => m.assignLeadToAUser(...a)),
  bulkAssignLeadTsoAUser: (...a) => import("../../../../services/main/shared/index.js").then((m) => m.bulkAssignLeadTsoAUser(...a)),
  markClientLeadAsConverted: (...a) => import("../../../../services/main/shared/index.js").then((m) => m.markClientLeadAsConverted(...a)),
  updateClientLeadStatus: (a) => import("../../../../services/main/shared/index.js").then((m) => m.updateClientLeadStatus(a)),
  checkIfUserAllowedToTakeALead: (...a) => import("../../../../services/main/shared/index.js").then((m) => m.checkIfUserAllowedToTakeALead(...a)),
  remindUserToPay: (a) => import("../../../../services/main/shared/index.js").then((m) => m.remindUserToPay(a)),
  remindUserToCompleteRegister: (a) => import("../../../../services/main/shared/index.js").then((m) => m.remindUserToCompleteRegister(a)),
  updateLeadField: (a) => import("../../../../services/main/admin/adminServices.js").then((m) => m.updateLeadField(a)),
  createCallReminder: (a) => import("../../../../services/main/staff/staffServices.js").then((m) => m.createCallReminder(a)),
  createMeetingReminder: (a) => import("../../../../services/main/staff/staffServices.js").then((m) => m.createMeetingReminder(a)),
  createMeetingReminderWithToken: (a) => import("../../../../services/main/staff/staffServices.js").then((m) => m.createMeetingReminderWithToken(a)),
  createPriceOffer: (a) => import("../../../../services/main/staff/staffServices.js").then((m) => m.createPriceOffer(a)),
  createFile: (a) => import("../../../../services/main/staff/staffServices.js").then((m) => m.createFile(a)),
  createNote: (a) => import("../../../../services/main/staff/staffServices.js").then((m) => m.createNote(a)),
  updateCallReminderStatus: (a) => import("../../../../services/main/staff/staffServices.js").then((m) => m.updateCallReminderStatus(a)),
  updateMeetingReminderStatus: (a) => import("../../../../services/main/staff/staffServices.js").then((m) => m.updateMeetingReminderStatus(a)),
  makePayments: (...a) => import("../../../../services/main/shared/index.js").then((m) => m.makePayments(...a)),
  makeExtraServicePayments: (a) => import("../../../../services/main/shared/index.js").then((m) => m.makeExtraServicePayments(a)),
  editPriceOfferStatus: (...a) => import("../../../../services/main/shared/index.js").then((m) => m.editPriceOfferStatus(...a)),
  getClientLeadsByDateRange: (a) => import("../../../../services/main/shared/index.js").then((m) => m.getClientLeadsByDateRange(a)),
  getClientLeadsColumnStatus: (a) => import("../../../../services/main/shared/index.js").then((m) => m.getClientLeadsColumnStatus(a)),
};

// Roles that historically had FULL read scope on the LIST (legacy excluded these from
// the country narrowing in getClientLeads).
const LIST_FULL_ROLES = ["SUPER_ADMIN", "ADMIN", "SUPER_SALES", "CONTACT_INITIATOR"];

export class LeadUsecase {
  /**
   * @param {import("./lead.repository.js").LeadRepository} repository
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

    const lead = privileged
      ? await this.#getAdminDetail(Number(id), searchParams)
      : await this.#getStaffDetail(Number(id), searchParams, role, authUser.id, authUser);

    return { ...lead, capabilities: computeLeadCapabilities(lead, authUser) };
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

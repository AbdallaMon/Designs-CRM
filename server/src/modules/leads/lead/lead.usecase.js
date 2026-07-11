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
import { leadsMessagesCodes as C, AUDIT_MODULES, AUDIT_ACTIONS } from "@dms/shared";
import { recordAction } from "../../../infra/audit/record-action.js";
import { leadRepository } from "./lead.repo.js";
import { computeLeadCapabilities } from "./lead.dto.js";
// Payment functions migrated to the leads/payment sub-entity (Stripe + email side effects).
import {
  makePayments as paymentMakePayments,
  makeExtraServicePayments as paymentMakeExtraServicePayments,
  remindUserToPay as paymentRemindUserToPay,
  remindUserToCompleteRegister as paymentRemindUserToCompleteRegister,
} from "../payment/payment.usecase.js";
// Repo-backed module functions extracted VERBATIM to sibling usecase files (behavior-
// preserving split). Imported back and wired into the `legacyDefaults` DI seam below —
// the SAME pattern already used above for the payment sub-entity functions.
import {
  checkIfUserAllowedToTakeALead,
  assignLeadToAUser,
  bulkAssignLeadTsoAUser,
  updateClientLeadStatus,
  markClientLeadAsConverted,
  getClientLeadsByDateRange,
  getClientLeadsColumnStatus,
} from "./lead.assign-status.usecase.js";
import {
  createNote,
  createCallReminder,
  createMeetingReminder,
  createMeetingReminderWithToken,
  createPriceOffer,
  createFile,
  updateCallReminderStatus,
  updateMeetingReminderStatus,
} from "./lead.sub-resources.usecase.js";
// `getCallReminders` remains part of THIS module's public surface (admin-residual/staff
// lazy-imports it from here); re-export it from its new home so importers are unchanged.
export { getCallReminders } from "./lead.sub-resources.usecase.js";

dayjs.extend(utc);
dayjs.extend(timezone);


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
  // admin-residual's lead field-update repo (relocated from the former god-file)
  updateLeadField: (a) => import("../../admin-residual/admin-leads/admin-leads.repo.js").then((m) => m.adminLeadsRepository.updateLeadField(a)),
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

  // Admin-tier lead operator = ADMIN/SUPER_ADMIN base role OR an admin-tier profile
  // (SUPER_SALES). Profile-authoritative — the legacy isSuperSales flag is NOT read.
  isAdminUser(authUser) {
    return (
      Boolean(authUser?.isAdminTier) ||
      authUser?.role === "ADMIN" ||
      authUser?.role === "SUPER_ADMIN"
    );
  }

  // Full read-scope over ALL leads (the super-sales pool), by active profile.
  #isSuperSalesScope(authUser) {
    return authUser?.currentProfileKey === "SUPER_SALES";
  }

  // Primary-tier lead-visibility carve-out (SUPER_SALES ⊇ PRIMARY_SALES).
  #isPrimaryScope(authUser) {
    return (
      authUser?.currentProfileKey === "SUPER_SALES" ||
      authUser?.currentProfileKey === "PRIMARY_SALES"
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
      !this.#isSuperSalesScope(authUser)
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
      !this.#isSuperSalesScope(authUser)
    ) {
      searchParams.selfId = authUser.id;
      searchParams.userId = authUser.id;
    }
    const isAdmin =
      authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN" || this.#isSuperSalesScope(authUser);
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
      role === "ADMIN" || role === "SUPER_ADMIN" || this.#isSuperSalesScope(authUser) || role === "CONTACT_INITIATOR";

    if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "ACCOUNTANT" && !this.#isSuperSalesScope(authUser)) {
      searchParams.userId = authUser.id;
    }
    if (role !== "ADMIN" && role !== "CONTACT_INITIATOR" && role !== "SUPER_ADMIN" && !this.#isSuperSalesScope(authUser)) {
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
      } else if (!this.#isPrimaryScope(user)) {
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

  async changeStatus({ id, body, authUser, currentStatus, auditCtx }) {
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
    // Semantic audit: lead status transition (before/after snapshot → diff).
    await recordAction(auditCtx, {
      module: AUDIT_MODULES.LEAD,
      action: AUDIT_ACTIONS.LEAD_STATUS_CHANGED,
      entityType: "ClientLead",
      entityId: Number(id),
      clientLeadId: Number(id),
      summary: `Lead #${id} status ${serverOldStatus ?? "?"} → ${rest.status}`,
      before: { status: serverOldStatus ?? null },
      after: { status: rest.status },
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

  async createCall({ id, body, authUser, auditCtx }) {
    const result = await this.legacy.createCallReminder({ clientLeadId: Number(id), userId: authUser.id, ...body });
    // Semantic audit: a call reminder was logged against the lead.
    await recordAction(auditCtx, {
      module: AUDIT_MODULES.LEAD,
      action: AUDIT_ACTIONS.LEAD_CALL_LOGGED,
      entityType: "ClientLead",
      entityId: Number(id),
      clientLeadId: Number(id),
      summary: `Call logged on lead #${id}`,
      detail: { reminderId: result?.newReminder?.id ?? null, time: result?.newReminder?.time ?? null },
    });
    return result;
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
  async createPriceOffer({ id, body, authUser, auditCtx }) {
    const result = await this.legacy.createPriceOffer({ clientLeadId: Number(id), userId: authUser.id, ...body });
    // Semantic audit: a price offer was created for the lead.
    await recordAction(auditCtx, {
      module: AUDIT_MODULES.LEAD,
      action: AUDIT_ACTIONS.PRICE_OFFER_CREATED,
      entityType: "ClientLead",
      entityId: Number(id),
      clientLeadId: Number(id),
      summary: `Price offer created on lead #${id}`,
      detail: {
        priceOfferId: result?.id ?? null,
        minPrice: result?.minPrice ?? body?.priceOffer?.minPrice ?? null,
        maxPrice: result?.maxPrice ?? body?.priceOffer?.maxPrice ?? null,
      },
    });
    return result;
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

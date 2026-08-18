// Thin controller for the authenticated leads-management surface. Reads validated
// input (Zod coerced params/query), delegates to the usecase, responds via the shared
// envelope. No business logic. The `checkIfUserCan*` methods are the object-scope
// gates wired with requireSpecialChecker — they THROW on denial (via the usecase) and
// return the loaded row on success; the sub-resource ones first resolve the parent
// lead id, then run the lead mutate check.
//
// Methods are plain (no `this`): the router passes them as BARE refs
// (`asyncHandler(leadController.getLeads)` / `requireSpecialChecker(leadController.checkX)`),
// so they call the directly-imported usecase singletons instead of an injected instance.
import { ok, created } from "../../../shared/http/response.js";
import { leadsMessagesCodes, messagesNames } from "@dms/shared";
import { auditCtxFromReq } from "../../../infra/audit/record-action.js";
import { leadUsecase } from "./lead.usecase.js";
import { leadCockpitUsecase } from "./lead.cockpit.usecase.js";
import { withListCapabilities } from "./lead.dto.js";

const TK = messagesNames.leadsMessages;

import { paginate } from "../../../shared/utility/pagination.js";

class LeadController {
  // ── object-scope checkers ──────────────────────────────────────────────────────
  // The lead-id param is `:id` on most routes and `:clientLeadId` on a few legacy
  // paths — accept either so the same checker wires onto both.
  checkIfUserCanAccessLead(req) {
    return leadUsecase.checkIfUserCanAccessLead({ id: req.params.id ?? req.params.clientLeadId, authUser: req.auth });
  }

  checkIfUserCanMutateLead(req) {
    return leadUsecase.checkIfUserCanMutateLead({ id: req.params.id ?? req.params.clientLeadId, authUser: req.auth });
  }

  checkIfUserCanMutateLeadActivity(req) {
    return leadUsecase.checkIfUserCanMutateLeadActivity({
      id: req.params.id ?? req.params.clientLeadId,
      authUser: req.auth,
    });
  }

  // Sub-resource mutate checks: resolve the parent lead, then enforce lead-mutate scope.
  async checkIfUserCanMutateCallReminder(req) {
    const { clientLeadId } = await leadUsecase.resolveCallReminderLead({ reminderId: req.params.id });
    return leadUsecase.checkIfUserCanMutateLead({ id: clientLeadId, authUser: req.auth });
  }

  async checkIfUserCanMutateDesignerCallReminder(req) {
    const { clientLeadId } = await leadUsecase.resolveCallReminderLead({ reminderId: req.params.id });
    return leadUsecase.checkIfUserCanMutateLeadActivity({ id: clientLeadId, authUser: req.auth });
  }

  async checkIfUserCanMutateMeetingReminder(req) {
    const { clientLeadId } = await leadUsecase.resolveMeetingReminderLead({ reminderId: req.params.id });
    return leadUsecase.checkIfUserCanMutateLead({ id: clientLeadId, authUser: req.auth });
  }

  // READ scope for GET /meeting-reminders/:meetingId — caller must be able to ACCESS
  // the parent lead (IDOR fix: P.VIEW alone is held by every authenticated role).
  async checkIfUserCanAccessMeetingReminder(req) {
    const { clientLeadId } = await leadUsecase.resolveMeetingReminderLead({ meetingId: req.params.meetingId });
    return leadUsecase.checkIfUserCanAccessLead({ id: clientLeadId, authUser: req.auth });
  }

  async checkIfUserCanMutatePriceOffer(req) {
    const { clientLeadId } = await leadUsecase.resolvePriceOfferLead({ priceOfferId: req.body.priceOfferId });
    return leadUsecase.checkIfUserCanMutateLead({ id: clientLeadId, authUser: req.auth });
  }

  // ── list surfaces ────────────────────────────────────────────────────────────
  async getLeads(req, res) {
    const { page, limit, skip } = paginate(req.query);
    const result = await leadUsecase.listLeads({ query: req.query, authUser: req.auth, page, limit, skip });
    const items = withListCapabilities(result.items, req.auth);
    return ok(res, { ...result, items }, leadsMessagesCodes.LEADS_FETCHED, TK);
  }

  async getDeals(req, res) {
    const items = await leadUsecase.getDeals({ query: req.query, authUser: req.auth });
    return ok(res, { items: withListCapabilities(items, req.auth) }, leadsMessagesCodes.DEALS_FETCHED, TK);
  }

  // Lead-pool counts for the leads-page KPI rail + tab badges (one call, no list bodies).
  async getLeadsSummary(req, res) {
    const data = await leadUsecase.getLeadsSummary({ query: req.query, authUser: req.auth });
    return ok(res, data, leadsMessagesCodes.LEADS_FETCHED, TK);
  }

  async getColumns(req, res) {
    const result = await leadUsecase.getColumns({ query: req.query, authUser: req.auth });
    const data = result?.data ? { ...result, data: withListCapabilities(result.data, req.auth) } : result;
    return ok(res, data, leadsMessagesCodes.COLUMNS_FETCHED, TK);
  }

  // ── detail ─────────────────────────────────────────────────────────────────────
  async getLead(req, res) {
    const data = await leadUsecase.getLead({ id: req.params.id, query: req.query, authUser: req.auth });
    return ok(res, data, leadsMessagesCodes.LEAD_FETCHED, TK);
  }

  // ── per-tab readers (lazy lead sub-resource reads) ─────────────────────────────
  // Each returns just one slice of the lead detail so the FE can load a tab on demand
  // and refetch only that tab after a mutation. Object-scope enforced by the route
  // (requireSpecialChecker(checkIfUserCanAccessLead)). The `id` param is `:clientLeadId`.
  async getLeadNotes(req, res) {
    const items = await leadUsecase.getLeadNotes({ id: req.params.clientLeadId, query: req.query, authUser: req.auth });
    return ok(res, items, leadsMessagesCodes.LEAD_FETCHED, TK);
  }

  async getLeadCalls(req, res) {
    const items = await leadUsecase.getLeadCalls({ id: req.params.clientLeadId, query: req.query, authUser: req.auth });
    return ok(res, items, leadsMessagesCodes.LEAD_FETCHED, TK);
  }

  async getLeadMeetings(req, res) {
    const items = await leadUsecase.getLeadMeetings({ id: req.params.clientLeadId, query: req.query, authUser: req.auth });
    return ok(res, items, leadsMessagesCodes.LEAD_FETCHED, TK);
  }

  async getLeadFiles(req, res) {
    const items = await leadUsecase.getLeadFiles({ id: req.params.clientLeadId, query: req.query, authUser: req.auth });
    return ok(res, items, leadsMessagesCodes.LEAD_FETCHED, TK);
  }

  async getLeadPriceOffers(req, res) {
    const items = await leadUsecase.getLeadPriceOffers({ id: req.params.clientLeadId, query: req.query, authUser: req.auth });
    return ok(res, items, leadsMessagesCodes.LEAD_FETCHED, TK);
  }

  // Sales Deal Cockpit — read-only next-best-action strip. Delegates to the focused
  // cockpit usecase; object scope enforced by the route (checkIfUserCanAccessLead).
  async getLeadCockpit(req, res) {
    const data = await leadCockpitUsecase.getLeadCockpit({ clientLeadId: req.params.clientLeadId, authUser: req.auth });
    return ok(res, data, leadsMessagesCodes.LEAD_COCKPIT_FETCHED, TK);
  }

  // ── assign / convert / status ────────────────────────────────────────────────
  async assignLead(req, res) {
    const { data, assignedToOther } = await leadUsecase.assignLead({ body: req.body, authUser: req.auth });
    return ok(res, data, assignedToOther ? leadsMessagesCodes.LEAD_CONVERTED : leadsMessagesCodes.LEAD_ASSIGNED, TK);
  }

  async bulkConvert(req, res) {
    const data = await leadUsecase.bulkConvert({ body: req.body, authUser: req.auth });
    return ok(res, data, leadsMessagesCodes.LEADS_BULK_CONVERTED, TK);
  }

  async convertLead(req, res) {
    const data = await leadUsecase.convertLead({ body: req.body });
    return ok(res, data, leadsMessagesCodes.LEAD_MOVED_TO_CONVERTED, TK);
  }

  async updateLeadField(req, res) {
    const data = await leadUsecase.updateLeadField({ id: req.params.id, body: req.body });
    return ok(res, data, leadsMessagesCodes.LEAD_UPDATED, TK);
  }

  async changeLeadStatus(req, res) {
    // The mutate scope checker (requireSpecialChecker) loaded the scoped lead and
    // stashed it on req.scoped; pass its TRUE current status so the usecase can ignore
    // any client-supplied oldStatus (workflow-guard bypass fix).
    const { updatePrice } = await leadUsecase.changeLeadStatus({
      id: req.params.id,
      body: req.body,
      authUser: req.auth,
      currentStatus: req.scoped?.status,
      auditCtx: auditCtxFromReq(req),
    });
    return ok(res, null, updatePrice ? leadsMessagesCodes.LEAD_PRICE_UPDATED : leadsMessagesCodes.LEAD_STATUS_CHANGED, TK);
  }

  async checkCountry(req, res) {
    const data = await leadUsecase.checkCountry({ userId: req.params.userId, country: req.body.country });
    return ok(res, data, leadsMessagesCodes.COUNTRY_CHECK_DONE, TK);
  }

  // ── calls ─────────────────────────────────────────────────────────────────────
  async listCalls(req, res) {
    const { page, limit, skip } = paginate(req.query);
    const result = await leadUsecase.listCalls({ query: req.query, skip, limit, page });
    return ok(res, result, leadsMessagesCodes.CALLS_FETCHED, TK);
  }

  async createCall(req, res) {
    const data = await leadUsecase.createCall({ id: req.params.id, body: req.body, authUser: req.auth, auditCtx: auditCtxFromReq(req) });
    return created(res, data, leadsMessagesCodes.CALL_REMINDER_CREATED, TK);
  }

  async updateCall(req, res) {
    const data = await leadUsecase.updateCall({ reminderId: req.params.id, body: req.body, authUser: req.auth });
    return ok(res, data, leadsMessagesCodes.CALL_REMINDER_UPDATED, TK);
  }

  // ── meetings ─────────────────────────────────────────────────────────────────
  async listMeetings(req, res) {
    const { page, limit, skip } = paginate(req.query);
    const result = await leadUsecase.listMeetings({ query: req.query, skip, limit, page });
    return ok(res, result, leadsMessagesCodes.MEETINGS_FETCHED, TK);
  }

  async getMeetingRemindersByLead(req, res) {
    const items = await leadUsecase.getMeetingRemindersByLead({ clientLeadId: req.params.clientLeadId });
    return ok(res, items, leadsMessagesCodes.MEETING_REMINDERS_FETCHED, TK);
  }

  async getMeetingById(req, res) {
    const data = await leadUsecase.getMeetingById({ meetingId: req.params.meetingId });
    return ok(res, data, leadsMessagesCodes.MEETING_REMINDER_FETCHED, TK);
  }

  async createMeeting(req, res) {
    const data = await leadUsecase.createMeeting({ id: req.params.id, body: req.body, authUser: req.auth });
    return created(res, data, leadsMessagesCodes.MEETING_REMINDER_CREATED, TK);
  }

  async createMeetingWithToken(req, res) {
    const data = await leadUsecase.createMeetingWithToken({ id: req.params.id, body: req.body, authUser: req.auth });
    return created(res, data, leadsMessagesCodes.MEETING_REMINDER_CREATED, TK);
  }

  async updateMeeting(req, res) {
    const data = await leadUsecase.updateMeeting({ reminderId: req.params.id, body: req.body, authUser: req.auth });
    return ok(res, data, leadsMessagesCodes.MEETING_REMINDER_UPDATED, TK);
  }

  // ── price offers / payments / files / notes / reminders ────────────────────────
  async createPriceOffer(req, res) {
    const data = await leadUsecase.createPriceOffer({ id: req.params.id, body: req.body, authUser: req.auth, auditCtx: auditCtxFromReq(req) });
    return created(res, data, leadsMessagesCodes.PRICE_OFFER_CREATED, TK);
  }

  async changePriceOfferStatus(req, res) {
    const data = await leadUsecase.changePriceOfferStatus({ body: req.body });
    return ok(res, data, leadsMessagesCodes.PRICE_OFFER_STATUS_CHANGED, TK);
  }

  async makePayments(req, res) {
    const data = await leadUsecase.makePayments({ id: req.params.id, body: req.body });
    return created(res, data, leadsMessagesCodes.PAYMENTS_ADDED, TK);
  }

  async createFile(req, res) {
    const data = await leadUsecase.createFile({ id: req.params.id, body: req.body });
    return created(res, data, leadsMessagesCodes.FILE_SAVED, TK);
  }

  async createNote(req, res) {
    const data = await leadUsecase.createNote({ id: req.params.id, body: req.body, authUser: req.auth });
    return created(res, data, leadsMessagesCodes.NOTE_ADDED, TK);
  }

  async sendPaymentReminder(req, res) {
    const data = await leadUsecase.sendPaymentReminder({ clientLeadId: req.params.clientLeadId });
    return ok(res, data, leadsMessagesCodes.REMINDER_SENT, TK);
  }

  async sendCompleteRegisterReminder(req, res) {
    const data = await leadUsecase.sendCompleteRegisterReminder({ clientLeadId: req.params.clientLeadId });
    return ok(res, data, leadsMessagesCodes.REMINDER_SENT, TK);
  }
}

export const leadController = new LeadController();
export { LeadController };

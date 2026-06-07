// Thin controller for the authenticated leads-management surface. Reads validated
// input (Zod coerced params/query), delegates to the usecase, responds via the shared
// envelope. No business logic. The `checkIfUserCan*` methods are the object-scope
// gates wired with requireSpecialChecker — they THROW on denial (via the usecase) and
// return the loaded row on success; the sub-resource ones first resolve the parent
// lead id, then run the lead mutate check.
import { ok, created } from "../../../shared/http/response.js";
import { leadsMessagesCodes, messagesNames } from "@dms/shared";
import { leadUsecase } from "./lead.usecase.js";
import { withListCapabilities } from "./lead.dto.js";

const C = leadsMessagesCodes;
const TK = messagesNames.leadsMessages;

// Legacy default pagination: page=1, limit=10 (services/main/utility getPagination).
function paginate(query) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  return { page, limit, skip: (page - 1) * limit };
}

export class LeadController {
  /** @param {import("./lead.usecase.js").LeadUsecase} usecase */
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── object-scope checkers ──────────────────────────────────────────────────────
  // The lead-id param is `:id` on most routes and `:clientLeadId` on a few legacy
  // paths — accept either so the same checker wires onto both.
  checkIfUserCanAccessLead = (req) =>
    this.usecase.checkIfUserCanAccessLead({ id: req.params.id ?? req.params.clientLeadId, authUser: req.auth });

  checkIfUserCanMutateLead = (req) =>
    this.usecase.checkIfUserCanMutateLead({ id: req.params.id ?? req.params.clientLeadId, authUser: req.auth });

  // Sub-resource mutate checks: resolve the parent lead, then enforce lead-mutate scope.
  checkIfUserCanMutateCallReminder = async (req) => {
    const { clientLeadId } = await this.usecase.resolveCallReminderLead({ reminderId: req.params.id });
    return this.usecase.checkIfUserCanMutateLead({ id: clientLeadId, authUser: req.auth });
  };

  checkIfUserCanMutateMeetingReminder = async (req) => {
    const { clientLeadId } = await this.usecase.resolveMeetingReminderLead({ reminderId: req.params.id });
    return this.usecase.checkIfUserCanMutateLead({ id: clientLeadId, authUser: req.auth });
  };

  // READ scope for GET /meeting-reminders/:meetingId — caller must be able to ACCESS
  // the parent lead (IDOR fix: P.VIEW alone is held by every authenticated role).
  checkIfUserCanAccessMeetingReminder = async (req) => {
    const { clientLeadId } = await this.usecase.resolveMeetingReminderLead({ meetingId: req.params.meetingId });
    return this.usecase.checkIfUserCanAccessLead({ id: clientLeadId, authUser: req.auth });
  };

  checkIfUserCanMutatePriceOffer = async (req) => {
    const { clientLeadId } = await this.usecase.resolvePriceOfferLead({ priceOfferId: req.body.priceOfferId });
    return this.usecase.checkIfUserCanMutateLead({ id: clientLeadId, authUser: req.auth });
  };

  // ── list surfaces ────────────────────────────────────────────────────────────
  list = async (req, res) => {
    const { page, limit, skip } = paginate(req.query);
    const result = await this.usecase.list({ query: req.query, authUser: req.auth, page, limit, skip });
    const items = withListCapabilities(result.items, req.auth);
    return ok(res, { ...result, items }, C.LEADS_FETCHED, TK);
  };

  deals = async (req, res) => {
    const items = await this.usecase.deals({ query: req.query, authUser: req.auth });
    return ok(res, { items: withListCapabilities(items, req.auth) }, C.DEALS_FETCHED, TK);
  };

  columns = async (req, res) => {
    const result = await this.usecase.columns({ query: req.query, authUser: req.auth });
    const data = result?.data ? { ...result, data: withListCapabilities(result.data, req.auth) } : result;
    return ok(res, data, C.COLUMNS_FETCHED, TK);
  };

  // ── detail ─────────────────────────────────────────────────────────────────────
  getById = async (req, res) => {
    const data = await this.usecase.getById({ id: req.params.id, query: req.query, authUser: req.auth });
    return ok(res, data, C.LEAD_FETCHED, TK);
  };

  // ── assign / convert / status ────────────────────────────────────────────────
  assign = async (req, res) => {
    const { data, assignedToOther } = await this.usecase.assign({ body: req.body, authUser: req.auth });
    return ok(res, data, assignedToOther ? C.LEAD_CONVERTED : C.LEAD_ASSIGNED, TK);
  };

  bulkConvert = async (req, res) => {
    const data = await this.usecase.bulkConvert({ body: req.body, authUser: req.auth });
    return ok(res, data, C.LEADS_BULK_CONVERTED, TK);
  };

  convert = async (req, res) => {
    const data = await this.usecase.convert({ body: req.body });
    return ok(res, data, C.LEAD_MOVED_TO_CONVERTED, TK);
  };

  updateField = async (req, res) => {
    const data = await this.usecase.updateField({ id: req.params.id, body: req.body });
    return ok(res, data, C.LEAD_UPDATED, TK);
  };

  changeStatus = async (req, res) => {
    // The mutate scope checker (requireSpecialChecker) loaded the scoped lead and
    // stashed it on req.scoped; pass its TRUE current status so the usecase can ignore
    // any client-supplied oldStatus (workflow-guard bypass fix).
    const { updatePrice } = await this.usecase.changeStatus({
      id: req.params.id,
      body: req.body,
      authUser: req.auth,
      currentStatus: req.scoped?.status,
    });
    return ok(res, null, updatePrice ? C.LEAD_PRICE_UPDATED : C.LEAD_STATUS_CHANGED, TK);
  };

  checkCountry = async (req, res) => {
    const data = await this.usecase.checkCountry({ userId: req.params.userId, country: req.body.country });
    return ok(res, data, C.COUNTRY_CHECK_DONE, TK);
  };

  // ── calls ─────────────────────────────────────────────────────────────────────
  listCalls = async (req, res) => {
    const { page, limit, skip } = paginate(req.query);
    const result = await this.usecase.listCalls({ query: req.query, skip, limit, page });
    return ok(res, result, C.CALLS_FETCHED, TK);
  };

  createCall = async (req, res) => {
    const data = await this.usecase.createCall({ id: req.params.id, body: req.body, authUser: req.auth });
    return created(res, data, C.CALL_REMINDER_CREATED, TK);
  };

  updateCall = async (req, res) => {
    const data = await this.usecase.updateCall({ reminderId: req.params.id, body: req.body, authUser: req.auth });
    return ok(res, data, C.CALL_REMINDER_UPDATED, TK);
  };

  // ── meetings ─────────────────────────────────────────────────────────────────
  listMeetings = async (req, res) => {
    const { page, limit, skip } = paginate(req.query);
    const result = await this.usecase.listMeetings({ query: req.query, skip, limit, page });
    return ok(res, result, C.MEETINGS_FETCHED, TK);
  };

  getMeetingRemindersByLead = async (req, res) => {
    const items = await this.usecase.getMeetingRemindersByLead({ clientLeadId: req.params.clientLeadId });
    return ok(res, items, C.MEETING_REMINDERS_FETCHED, TK);
  };

  getMeetingById = async (req, res) => {
    const data = await this.usecase.getMeetingById({ meetingId: req.params.meetingId });
    return ok(res, data, C.MEETING_REMINDER_FETCHED, TK);
  };

  createMeeting = async (req, res) => {
    const data = await this.usecase.createMeeting({ id: req.params.id, body: req.body, authUser: req.auth });
    return created(res, data, C.MEETING_REMINDER_CREATED, TK);
  };

  createMeetingWithToken = async (req, res) => {
    const data = await this.usecase.createMeetingWithToken({ id: req.params.id, body: req.body, authUser: req.auth });
    return created(res, data, C.MEETING_REMINDER_CREATED, TK);
  };

  updateMeeting = async (req, res) => {
    const data = await this.usecase.updateMeeting({ reminderId: req.params.id, body: req.body, authUser: req.auth });
    return ok(res, data, C.MEETING_REMINDER_UPDATED, TK);
  };

  // ── price offers / payments / files / notes / reminders ────────────────────────
  createPriceOffer = async (req, res) => {
    const data = await this.usecase.createPriceOffer({ id: req.params.id, body: req.body, authUser: req.auth });
    return created(res, data, C.PRICE_OFFER_CREATED, TK);
  };

  changePriceOfferStatus = async (req, res) => {
    const data = await this.usecase.changePriceOfferStatus({ body: req.body });
    return ok(res, data, C.PRICE_OFFER_STATUS_CHANGED, TK);
  };

  makePayments = async (req, res) => {
    const data = await this.usecase.makePayments({ id: req.params.id, body: req.body });
    return created(res, data, C.PAYMENTS_ADDED, TK);
  };

  createFile = async (req, res) => {
    const data = await this.usecase.createFile({ id: req.params.id, body: req.body });
    return created(res, data, C.FILE_SAVED, TK);
  };

  createNote = async (req, res) => {
    const data = await this.usecase.createNote({ id: req.params.id, body: req.body, authUser: req.auth });
    return created(res, data, C.NOTE_ADDED, TK);
  };

  sendPaymentReminder = async (req, res) => {
    const data = await this.usecase.sendPaymentReminder({ clientLeadId: req.params.clientLeadId });
    return ok(res, data, C.REMINDER_SENT, TK);
  };

  sendCompleteRegisterReminder = async (req, res) => {
    const data = await this.usecase.sendCompleteRegisterReminder({ clientLeadId: req.params.clientLeadId });
    return ok(res, data, C.REMINDER_SENT, TK);
  };
}

export const leadController = new LeadController(leadUsecase);

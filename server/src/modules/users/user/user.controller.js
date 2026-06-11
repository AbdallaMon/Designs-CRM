// Thin controller for the users/user surface. Reads validated input (Zod-coerced
// params/query), delegates to the usecase, responds via the shared envelope. No business
// logic. The `checkIfUserCan*Profile` methods are the object-scope gates wired with
// requireSpecialChecker — they THROW on denial (via the usecase) and return the resolved
// scope context on success (stashed on req.scoped so updateProfile can read adminTier).
import { ok, created } from "../../../shared/http/response.js";
import { userMessagesCodes, messagesNames } from "@dms/shared";
import { userUsecase } from "./user.usecase.js";

const C = userMessagesCodes;
const TK = messagesNames.usersMessages;

// Legacy default pagination: page=1, limit=10 (services/main/utility getPagination).
function paginate(query) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  return { page, limit, skip: (page - 1) * limit };
}

export class UserController {
  /** @param {import("./user.usecase.js").UserUsecase} usecase */
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── object-scope checkers (profile IDOR fix) ─────────────────────────────────
  checkIfUserCanAccessProfile = (req) =>
    this.usecase.checkIfUserCanAccessProfile({ userId: req.params.userId, authUser: req.auth });

  checkIfUserCanMutateProfile = (req) =>
    this.usecase.checkIfUserCanMutateProfile({ userId: req.params.userId, authUser: req.auth });

  // ── directory (broad authed pick-lists) ──────────────────────────────────────
  directory = async (req, res) => {
    const data = await this.usecase.directory({ query: req.query, authUser: req.auth });
    return ok(res, data, C.USERS_DIRECTORY_FETCHED, TK);
  };

  relatedChatDirectory = async (req, res) => {
    const data = await this.usecase.directory({ query: req.query, authUser: req.auth, relatedOnly: true });
    return ok(res, data, C.USERS_DIRECTORY_FETCHED, TK);
  };

  // ── admin management lists ───────────────────────────────────────────────────
  list = async (req, res) => {
    const { page, limit, skip } = paginate(req.query);
    const data = await this.usecase.list({ query: req.query, authUser: req.auth, page, limit, skip });
    return ok(res, data, C.USERS_FETCHED, TK);
  };

  allUsers = async (req, res) => {
    const data = await this.usecase.allUsers({ query: req.query, authUser: req.auth });
    return ok(res, data, C.ALL_USERS_FETCHED, TK);
  };

  // chat member-picker — one endpoint; the usecase branches on req.auth (admin-tier →
  // admin-wide list; non-admin → related-by-project). Returns the legacy bare user array
  // under `data` (the chat FE reads response.data directly).
  chatDirectory = async (req, res) => {
    const data = await this.usecase.chatDirectory({ query: req.query, authUser: req.auth });
    return ok(res, data, C.USERS_DIRECTORY_FETCHED, TK);
  };

  // ── profile (self OR admin via scope checker) ────────────────────────────────
  getProfile = async (req, res) => {
    const data = await this.usecase.getProfile({ userId: req.params.userId, authUser: req.auth });
    return ok(res, data, C.USER_PROFILE_FETCHED, TK);
  };

  updateProfile = async (req, res) => {
    const data = await this.usecase.updateProfile({ userId: req.params.userId, body: req.body, scoped: req.scoped });
    return ok(res, data, C.USER_PROFILE_UPDATED, TK);
  };

  // ── admin user-management ────────────────────────────────────────────────────
  create = async (req, res) => {
    const data = await this.usecase.create({ body: req.body, authUser: req.auth });
    return created(res, data, C.USER_CREATED, TK);
  };

  update = async (req, res) => {
    const data = await this.usecase.update({ userId: req.params.userId, body: req.body, authUser: req.auth });
    return ok(res, data, C.USER_UPDATED, TK);
  };

  changeStatus = async (req, res) => {
    const data = await this.usecase.changeStatus({ userId: req.params.userId, body: req.body });
    return ok(res, data, C.USER_STATUS_TOGGLED, TK);
  };

  staffExtra = async (req, res) => {
    const data = await this.usecase.toggleStaffExtra({ userId: req.params.userId, body: req.body });
    return ok(res, data, C.USER_STAFF_EXTRA_UPDATED, TK);
  };

  manageRoles = async (req, res) => {
    const data = await this.usecase.manageRoles({ userId: req.params.userId, body: req.body });
    return ok(res, data, C.USER_ROLES_UPDATED, TK);
  };

  getAutoAssignments = async (req, res) => {
    const data = await this.usecase.getAutoAssignments({ userId: req.params.userId });
    return ok(res, data, C.AUTO_ASSIGNMENTS_FETCHED, TK);
  };

  updateAutoAssignments = async (req, res) => {
    const data = await this.usecase.updateAutoAssignments({ userId: req.params.userId, body: req.body });
    return ok(res, data, C.AUTO_ASSIGNMENTS_UPDATED, TK);
  };

  getRestrictedCountries = async (req, res) => {
    const data = await this.usecase.getRestrictedCountries({ userId: req.params.userId });
    return ok(res, data, C.RESTRICTED_COUNTRIES_FETCHED, TK);
  };

  updateRestrictedCountries = async (req, res) => {
    const data = await this.usecase.updateRestrictedCountries({ userId: req.params.userId, body: req.body });
    return ok(res, data, C.RESTRICTED_COUNTRIES_UPDATED, TK);
  };

  setMaxLeads = async (req, res) => {
    const data = await this.usecase.setMaxLeads({ userId: req.params.userId, body: req.body });
    return ok(res, data, C.USER_MAX_LEADS_UPDATED, TK);
  };

  setMaxLeadsPerDay = async (req, res) => {
    const data = await this.usecase.setMaxLeadsPerDay({ userId: req.params.userId, body: req.body });
    return ok(res, data, C.USER_MAX_LEADS_PER_DAY_UPDATED, TK);
  };

  getLogs = async (req, res) => {
    const data = await this.usecase.getLogs({ userId: req.params.userId });
    return ok(res, data, C.USER_LOGS_FETCHED, TK);
  };

  getLastSeen = async (req, res) => {
    const data = await this.usecase.getLastSeen({ userId: req.params.userId, query: req.query });
    return ok(res, data, C.USER_LAST_SEEN_FETCHED, TK);
  };
}

export const userController = new UserController(userUsecase);

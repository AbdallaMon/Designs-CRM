// Thin controller for the users/user surface. Reads validated input (Zod-coerced
// params/query), delegates to the usecase, responds via the shared envelope. No business
// logic. The `checkIfUserCan*Profile` methods are the object-scope gates wired with
// requireSpecialChecker — they THROW on denial (via the usecase) and return the resolved
// scope context on success (stashed on req.scoped so updateProfile can read adminTier).
import { ok, created } from "../../../shared/http/response.js";
import { userMessagesCodes, messagesNames } from "@dms/shared";
import { auditCtxFromReq } from "../../../infra/audit/record-action.js";
import { userUsecase } from "./user.usecase.js";

const TK = messagesNames.usersMessages;

import { paginate } from "../../../shared/utility/pagination.js";

export class UserController {
  // ── object-scope checkers (profile IDOR fix) ─────────────────────────────────
  checkIfUserCanAccessProfile(req) {
    return userUsecase.checkIfUserCanAccessProfile({ userId: req.params.userId, authUser: req.auth });
  }

  checkIfUserCanMutateProfile(req) {
    return userUsecase.checkIfUserCanMutateProfile({ userId: req.params.userId, authUser: req.auth });
  }

  checkIfUserCanManageUser(req) {
    return userUsecase.checkIfUserCanManageUser({
      userId: req.params.userId,
      authUser: req.auth,
    });
  }

  // ── directory (broad authed pick-lists) ──────────────────────────────────────
  async getDirectory(req, res) {
    const data = await userUsecase.getDirectory({ query: req.query, authUser: req.auth });
    return ok(res, data, userMessagesCodes.USERS_DIRECTORY_FETCHED, TK);
  }

  async getRelatedChatDirectory(req, res) {
    const data = await userUsecase.getDirectory({ query: req.query, authUser: req.auth, relatedOnly: true });
    return ok(res, data, userMessagesCodes.USERS_DIRECTORY_FETCHED, TK);
  }

  // ── admin management lists ───────────────────────────────────────────────────
  async getUsers(req, res) {
    const { page, limit, skip } = paginate(req.query);
    const data = await userUsecase.listUsers({ query: req.query, authUser: req.auth, page, limit, skip });
    return ok(res, data, userMessagesCodes.USERS_FETCHED, TK);
  }

  async getAllUsers(req, res) {
    const data = await userUsecase.getAllUsers({ query: req.query, authUser: req.auth });
    return ok(res, data, userMessagesCodes.ALL_USERS_FETCHED, TK);
  }

  // The usecase applies active-profile directory scope.
  async getChatDirectory(req, res) {
    const data = await userUsecase.getChatDirectory({ query: req.query, authUser: req.auth });
    return ok(res, data, userMessagesCodes.USERS_DIRECTORY_FETCHED, TK);
  }

  // ── profile (self OR admin via scope checker) ────────────────────────────────
  async getProfile(req, res) {
    const data = await userUsecase.getProfile({ userId: req.params.userId, authUser: req.auth });
    return ok(res, data, userMessagesCodes.USER_PROFILE_FETCHED, TK);
  }

  async updateProfile(req, res) {
    const data = await userUsecase.updateProfile({ userId: req.params.userId, body: req.body, scoped: req.scoped });
    return ok(res, data, userMessagesCodes.USER_PROFILE_UPDATED, TK);
  }

  // ── admin user-management ────────────────────────────────────────────────────
  async createUser(req, res) {
    const data = await userUsecase.createUser({ body: req.body, authUser: req.auth, auditCtx: auditCtxFromReq(req) });
    return created(res, data, userMessagesCodes.USER_CREATED, TK);
  }

  async updateUser(req, res) {
    const data = await userUsecase.updateUser({ userId: req.params.userId, body: req.body, authUser: req.auth, auditCtx: auditCtxFromReq(req) });
    return ok(res, data, userMessagesCodes.USER_UPDATED, TK);
  }

  async changeStatus(req, res) {
    const data = await userUsecase.changeStatus({ userId: req.params.userId, body: req.body });
    return ok(res, data, userMessagesCodes.USER_STATUS_TOGGLED, TK);
  }

  // ── DB-relational profiles (admin assign/remove + list) ──────────────────────
  async listProfiles(req, res) {
    const data = await userUsecase.listAssignableProfiles({ authUser: req.auth });
    return ok(res, data, userMessagesCodes.USER_PROFILES_FETCHED, TK);
  }

  async updateProfiles(req, res) {
    const data = await userUsecase.updateUserProfiles({
      authUser: req.auth,
      userId: req.params.userId,
      profileIds: req.body.profileIds,
      currentProfileId: req.body.currentProfileId,
    });
    return ok(res, data, userMessagesCodes.USER_PROFILES_UPDATED, TK);
  }

  async getAutoAssignments(req, res) {
    const data = await userUsecase.getAutoAssignments({ userId: req.params.userId });
    return ok(res, data, userMessagesCodes.AUTO_ASSIGNMENTS_FETCHED, TK);
  }

  async updateAutoAssignments(req, res) {
    const data = await userUsecase.updateAutoAssignments({ userId: req.params.userId, body: req.body });
    return ok(res, data, userMessagesCodes.AUTO_ASSIGNMENTS_UPDATED, TK);
  }

  async getRestrictedCountries(req, res) {
    const data = await userUsecase.getRestrictedCountries({ userId: req.params.userId });
    return ok(res, data, userMessagesCodes.RESTRICTED_COUNTRIES_FETCHED, TK);
  }

  async updateRestrictedCountries(req, res) {
    const data = await userUsecase.updateRestrictedCountries({ userId: req.params.userId, body: req.body });
    return ok(res, data, userMessagesCodes.RESTRICTED_COUNTRIES_UPDATED, TK);
  }

  async setMaxLeads(req, res) {
    const data = await userUsecase.setMaxLeads({ userId: req.params.userId, body: req.body });
    return ok(res, data, userMessagesCodes.USER_MAX_LEADS_UPDATED, TK);
  }

  async setMaxLeadsPerDay(req, res) {
    const data = await userUsecase.setMaxLeadsPerDay({ userId: req.params.userId, body: req.body });
    return ok(res, data, userMessagesCodes.USER_MAX_LEADS_PER_DAY_UPDATED, TK);
  }

  async getLogs(req, res) {
    const data = await userUsecase.getLogs({ userId: req.params.userId });
    return ok(res, data, userMessagesCodes.USER_LOGS_FETCHED, TK);
  }

  async getLastSeen(req, res) {
    const data = await userUsecase.getLastSeen({ userId: req.params.userId, query: req.query });
    return ok(res, data, userMessagesCodes.USER_LAST_SEEN_FETCHED, TK);
  }
}

export const userController = new UserController();

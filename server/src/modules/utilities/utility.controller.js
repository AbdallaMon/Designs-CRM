// utilities controller — thin. Reads validated input, delegates to the usecase, responds
// via the shared envelope helpers. No business rules. Primitive coercion only.
import { ok, created } from "../../shared/http/response.js";
import { utilitiesMessagesCodes, messagesNames } from "@dms/shared";
import { utilityUsecase } from "./utility.usecase.js";

const TK = messagesNames.utilitiesMessages;

export class UtilityController {
  async listFixedData(req, res) {
    const data = await utilityUsecase.listFixedData();
    return ok(res, data, utilitiesMessagesCodes.FIXED_DATA_FETCHED, TK);
  }

  async checkUserLog(req, res) {
    // Self-scoped: the subject is the authenticated user, never a query userId (FIX 1).
    const data = await utilityUsecase.checkUserLog({ query: req.query, authUser: req.auth });
    return ok(res, data, utilitiesMessagesCodes.USER_LOG_FETCHED, TK);
  }

  async submitUserLog(req, res) {
    // Self-scoped: the subject is the authenticated user, never a body userId (FIX 1).
    const data = await utilityUsecase.submitUserLog({ body: req.body, authUser: req.auth });
    return created(res, data, utilitiesMessagesCodes.USER_LOG_SUBMITTED, TK);
  }

  async getUserCurrentProfile(req, res) {
    const data = await utilityUsecase.getUserCurrentProfile({
      userId: parseInt(req.params.userId, 10),
    });
    return ok(res, data, utilitiesMessagesCodes.USER_PROFILE_FETCHED, TK);
  }

  async getAdmins(req, res) {
    const data = await utilityUsecase.getAdmins();
    return ok(res, data, utilitiesMessagesCodes.ADMINS_FETCHED, TK);
  }

  async getImages(req, res) {
    const data = await utilityUsecase.getImages({ query: req.query });
    return ok(res, data, utilitiesMessagesCodes.IMAGES_FETCHED, TK);
  }

  async getModelData(req, res) {
    const data = await utilityUsecase.getModelData({ query: req.query });
    return ok(res, data, utilitiesMessagesCodes.MODEL_FETCHED, TK);
  }

  async getModelIds(req, res) {
    const data = await utilityUsecase.getModelIds({ query: req.query });
    return ok(res, data, utilitiesMessagesCodes.MODEL_IDS_FETCHED, TK);
  }

  async search(req, res) {
    const data = await utilityUsecase.search({ query: req.query, authUser: req.auth });
    return ok(res, data, utilitiesMessagesCodes.SEARCH_RESULTS_FETCHED, TK);
  }
}

export const utilityController = new UtilityController();

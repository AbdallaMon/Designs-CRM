// utilities controller — thin. Reads validated input, delegates to the usecase, responds
// via the shared envelope helpers. No business rules. Primitive coercion only.
import { ok, created } from "../../shared/http/response.js";
import { utilitiesMessagesCodes, messagesNames } from "@dms/shared";
import { utilityUsecase } from "./utility.usecase.js";

const C = utilitiesMessagesCodes;
const TK = messagesNames.utilitiesMessages;

export class UtilityController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  listFixedData = async (req, res) => {
    const data = await this.usecase.listFixedData();
    return ok(res, data, C.FIXED_DATA_FETCHED, TK);
  };

  checkUserLog = async (req, res) => {
    // Self-scoped: the subject is the authenticated user, never a query userId (FIX 1).
    const data = await this.usecase.checkUserLog({ query: req.query, authUser: req.auth });
    return ok(res, data, C.USER_LOG_FETCHED, TK);
  };

  submitUserLog = async (req, res) => {
    // Self-scoped: the subject is the authenticated user, never a body userId (FIX 1).
    const data = await this.usecase.submitUserLog({ body: req.body, authUser: req.auth });
    return created(res, data, C.USER_LOG_SUBMITTED, TK);
  };

  getUserRole = async (req, res) => {
    const data = await this.usecase.getUserRole({ userId: parseInt(req.params.userId, 10) });
    return ok(res, data, C.USER_ROLE_FETCHED, TK);
  };

  getRoles = async (req, res) => {
    // The token user's own roles (legacy used the decoded token id).
    const data = await this.usecase.getOtherRoles({ userId: req.auth.id });
    return ok(res, data, C.ROLES_FETCHED, TK);
  };

  getAdmins = async (req, res) => {
    const data = await this.usecase.getAdmins();
    return ok(res, data, C.ADMINS_FETCHED, TK);
  };

  getImages = async (req, res) => {
    const data = await this.usecase.getImages({ query: req.query });
    return ok(res, data, C.IMAGES_FETCHED, TK);
  };

  getModelData = async (req, res) => {
    const data = await this.usecase.getModelData({ query: req.query });
    return ok(res, data, C.MODEL_FETCHED, TK);
  };

  getModelIds = async (req, res) => {
    const data = await this.usecase.getModelIds({ query: req.query });
    return ok(res, data, C.MODEL_IDS_FETCHED, TK);
  };

  search = async (req, res) => {
    const data = await this.usecase.search({ query: req.query, authUser: req.auth });
    return ok(res, data, C.SEARCH_RESULTS_FETCHED, TK);
  };
}

export const utilityController = new UtilityController(utilityUsecase);

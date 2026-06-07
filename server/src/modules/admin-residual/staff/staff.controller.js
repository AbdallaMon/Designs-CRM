// admin-residual/staff controller — thin. Language-neutral code on the envelope.
import { ok } from "../../../shared/http/response.js";
import { adminResidualMessagesCodes, messagesNames } from "@dms/shared";
import { staffUsecase } from "./staff.usecase.js";

const M = adminResidualMessagesCodes;
const TK = messagesNames.adminResidualMessages;

export class StaffController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  latestCalls = async (req, res) => {
    const data = await this.usecase.latestCalls({ query: req.query, authUser: req.auth });
    return ok(res, data, M.LATEST_CALLS_FETCHED, TK);
  };
}

export const staffController = new StaffController(staffUsecase);

// admin-residual/staff controller — thin. Language-neutral code on the envelope.
import { ok } from "../../../shared/http/response.js";
import { adminResidualMessagesCodes, messagesNames } from "@dms/shared";
import { staffUsecase } from "./staff.usecase.js";

const TK = messagesNames.adminResidualMessages;

class StaffController {
  async latestCalls(req, res) {
    const data = await staffUsecase.latestCalls({ query: req.query, authUser: req.auth });
    return ok(res, data, adminResidualMessagesCodes.LATEST_CALLS_FETCHED, TK);
  }
}

export const staffController = new StaffController();
export { StaffController };

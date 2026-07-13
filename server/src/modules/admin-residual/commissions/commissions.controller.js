// admin-residual/commissions controller — thin. Reads validated input, calls the usecase,
// responds via the envelope helpers with language-neutral codes (REPLACING the legacy prose
// "Created/Updated successfully"). Money validation is enforced by Zod at the route.
import { ok, created } from "../../../shared/http/response.js";
import { adminResidualMessagesCodes, messagesNames } from "@dms/shared";
import { commissionsUsecase } from "./commissions.usecase.js";

const TK = messagesNames.adminResidualMessages;

class CommissionsController {
  async getCommissions(req, res) {
    const data = await commissionsUsecase.listCommissions({ userId: req.query.userId });
    return ok(res, data, adminResidualMessagesCodes.COMMISSIONS_FETCHED, TK);
  }

  async createCommission(req, res) {
    const data = await commissionsUsecase.createCommission({
      userId: req.body.userId,
      leadId: req.body.leadId,
      amount: req.body.amount,
      commissionReason: req.body.commissionReason,
    });
    return created(res, data, adminResidualMessagesCodes.COMMISSION_CREATED, TK);
  }

  async updateCommission(req, res) {
    const data = await commissionsUsecase.updateCommission({ commissionId: req.params.id, amount: req.body.amount });
    return ok(res, data, adminResidualMessagesCodes.COMMISSION_UPDATED, TK);
  }
}

export const commissionsController = new CommissionsController();
export { CommissionsController };

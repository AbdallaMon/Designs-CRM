// admin-residual/commissions controller — thin. Reads validated input, calls the usecase,
// responds via the envelope helpers with language-neutral codes (REPLACING the legacy prose
// "Created/Updated successfully"). Money validation is enforced by Zod at the route.
import { ok, created } from "../../../shared/http/response.js";
import { adminResidualMessagesCodes, messagesNames } from "@dms/shared";
import { commissionsUsecase } from "./commissions.usecase.js";

const M = adminResidualMessagesCodes;
const TK = messagesNames.adminResidualMessages;

export class CommissionsController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  list = async (req, res) => {
    const data = await this.usecase.list({ userId: req.query.userId });
    return ok(res, data, M.COMMISSIONS_FETCHED, TK);
  };

  create = async (req, res) => {
    const data = await this.usecase.create({
      userId: req.body.userId,
      leadId: req.body.leadId,
      amount: req.body.amount,
      commissionReason: req.body.commissionReason,
    });
    return created(res, data, M.COMMISSION_CREATED, TK);
  };

  update = async (req, res) => {
    const data = await this.usecase.update({ commissionId: req.params.id, amount: req.body.amount });
    return ok(res, data, M.COMMISSION_UPDATED, TK);
  };
}

export const commissionsController = new CommissionsController(commissionsUsecase);

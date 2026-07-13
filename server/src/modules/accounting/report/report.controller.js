// accounting/report controller — thin. Outcome list + summary.
import { ok } from "../../../shared/http/response.js";
import { accountingMessagesCodes, messagesNames } from "@dms/shared";
import { reportUsecase } from "./report.usecase.js";

const TK = messagesNames.accountingMessages;

import { paginate } from "../../../shared/utility/pagination.js";

class ReportController {
  async getOutcomes(req, res) {
    const { page, limit, skip } = paginate(req.query);
    const result = await reportUsecase.listOutcomes({ query: req.query, skip, limit, page });
    return ok(
      res,
      { items: result.data ?? [], total: result.total ?? 0, page, pageSize: limit },
      accountingMessagesCodes.OUTCOMES_FETCHED,
      TK,
    );
  }

  async getSummary(req, res) {
    const result = await reportUsecase.getSummary();
    return ok(res, result.data ?? result, accountingMessagesCodes.SUMMARY_FETCHED, TK);
  }
}

export const reportController = new ReportController();
export { ReportController };

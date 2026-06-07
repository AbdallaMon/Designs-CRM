// accounting/report controller — thin. Outcome list + summary.
import { ok } from "../../../shared/http/response.js";
import { accountingMessagesCodes, messagesNames } from "@dms/shared";
import { reportUsecase } from "./report.usecase.js";

const C = accountingMessagesCodes;
const TK = messagesNames.accountingMessages;

function paginate(query) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  return { page, limit, skip: (page - 1) * limit };
}

export class ReportController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  outcomes = async (req, res) => {
    const { page, limit, skip } = paginate(req.query);
    const result = await this.usecase.outcomes({ query: req.query, skip, limit, page });
    return ok(
      res,
      { items: result.data ?? [], total: result.total ?? 0, page, pageSize: limit },
      C.OUTCOMES_FETCHED,
      TK,
    );
  };

  summary = async (req, res) => {
    const result = await this.usecase.summary();
    return ok(res, result.data ?? result, C.SUMMARY_FETCHED, TK);
  };
}

export const reportController = new ReportController(reportUsecase);

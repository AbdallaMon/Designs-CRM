// accounting/salary controller — thin. Reads validated input, delegates, responds via the
// shared envelope. The legacy route mutated req.body to inject the id/userId param; we
// pass them explicitly to the usecase instead (no body mutation).
import { ok, created } from "../../../shared/http/response.js";
import { accountingMessagesCodes, messagesNames } from "@dms/shared";
import { salaryUsecase } from "./salary.usecase.js";

const C = accountingMessagesCodes;
const TK = messagesNames.accountingMessages;

function paginate(query) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  return { page, limit, skip: (page - 1) * limit };
}

export class SalaryController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  // accountant-scoped user helper lists (for salaries)
  listUsers = async (req, res) => {
    const { page, limit, skip } = paginate(req.query);
    const { users, total } = await this.usecase.listUsers({ query: req.query, limit, skip });
    return ok(res, { items: users ?? [], total: total ?? 0, page, pageSize: limit }, C.USERS_FETCHED, TK);
  };

  userLastSeen = async (req, res) => {
    const data = await this.usecase.userLastSeen({
      userId: req.params.userId,
      month: req.query.month,
      year: req.query.year,
    });
    return ok(res, data, C.USER_LAST_SEEN_FETCHED, TK);
  };

  // salaries
  salaryData = async (req, res) => {
    const data = await this.usecase.salaryData({ query: req.query });
    return ok(res, data, C.SALARY_DATA_FETCHED, TK);
  };

  createBase = async (req, res) => {
    const result = await this.usecase.createBase({ userId: req.params.userId, body: req.body });
    return created(res, result.data ?? result, C.SALARY_CREATED, TK);
  };

  editBase = async (req, res) => {
    const result = await this.usecase.editBase({ id: req.params.id, body: req.body });
    return ok(res, result.data ?? result, C.SALARY_UPDATED, TK);
  };

  payMonthly = async (req, res) => {
    const result = await this.usecase.payMonthly({ body: req.body });
    return created(res, result.data ?? result, C.MONTHLY_SALARY_PAID, TK);
  };
}

export const salaryController = new SalaryController(salaryUsecase);

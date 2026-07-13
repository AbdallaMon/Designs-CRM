// accounting/salary controller — thin. Reads validated input, delegates, responds via the
// shared envelope. The legacy route mutated req.body to inject the id/userId param; we
// pass them explicitly to the usecase instead (no body mutation).
import { ok, created } from "../../../shared/http/response.js";
import { accountingMessagesCodes, messagesNames } from "@dms/shared";
import { salaryUsecase } from "./salary.usecase.js";

const TK = messagesNames.accountingMessages;

import { paginate } from "../../../shared/utility/pagination.js";

class SalaryController {
  // accountant-scoped user helper lists (for salaries)
  async listUsers(req, res) {
    const { page, limit, skip } = paginate(req.query);
    const { users, total } = await salaryUsecase.listUsers({ query: req.query, limit, skip });
    return ok(res, { items: users ?? [], total: total ?? 0, page, pageSize: limit }, accountingMessagesCodes.USERS_FETCHED, TK);
  }

  async getUserLastSeen(req, res) {
    const data = await salaryUsecase.getUserLastSeen({
      userId: req.params.userId,
      month: req.query.month,
      year: req.query.year,
    });
    return ok(res, data, accountingMessagesCodes.USER_LAST_SEEN_FETCHED, TK);
  }

  // salaries
  async getSalaryData(req, res) {
    const data = await salaryUsecase.getSalaryData({ query: req.query });
    return ok(res, data, accountingMessagesCodes.SALARY_DATA_FETCHED, TK);
  }

  async createBase(req, res) {
    const result = await salaryUsecase.createBase({ userId: req.params.userId, body: req.body });
    return created(res, result.data ?? result, accountingMessagesCodes.SALARY_CREATED, TK);
  }

  async editBase(req, res) {
    const result = await salaryUsecase.editBase({ id: req.params.id, body: req.body });
    return ok(res, result.data ?? result, accountingMessagesCodes.SALARY_UPDATED, TK);
  }

  async payMonthly(req, res) {
    const result = await salaryUsecase.payMonthly({ body: req.body });
    return created(res, result.data ?? result, accountingMessagesCodes.MONTHLY_SALARY_PAID, TK);
  }
}

export const salaryController = new SalaryController();
export { SalaryController };

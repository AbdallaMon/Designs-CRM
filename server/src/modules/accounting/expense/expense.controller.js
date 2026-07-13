// accounting/expense controller — thin. Reads validated input, delegates, responds.
import { ok, created } from "../../../shared/http/response.js";
import { accountingMessagesCodes, messagesNames } from "@dms/shared";
import { expenseUsecase } from "./expense.usecase.js";

const TK = messagesNames.accountingMessages;

import { paginate } from "../../../shared/utility/pagination.js";

class ExpenseController {
  async getExpenses(req, res) {
    const { page, limit, skip } = paginate(req.query);
    const result = await expenseUsecase.listExpenses({ skip, limit, page });
    return ok(
      res,
      { items: result.data ?? [], total: result.total ?? 0, page, pageSize: limit },
      accountingMessagesCodes.OPERATIONAL_EXPENSES_FETCHED,
      TK,
    );
  }

  async createExpense(req, res) {
    const result = await expenseUsecase.createExpense({ body: req.body });
    return created(res, result.data ?? result, accountingMessagesCodes.OPERATIONAL_EXPENSE_CREATED, TK);
  }
}

export const expenseController = new ExpenseController();
export { ExpenseController };

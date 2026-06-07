// accounting/expense controller — thin. Reads validated input, delegates, responds.
import { ok, created } from "../../../shared/http/response.js";
import { accountingMessagesCodes, messagesNames } from "@dms/shared";
import { expenseUsecase } from "./expense.usecase.js";

const C = accountingMessagesCodes;
const TK = messagesNames.accountingMessages;

function paginate(query) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  return { page, limit, skip: (page - 1) * limit };
}

export class ExpenseController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  list = async (req, res) => {
    const { page, limit, skip } = paginate(req.query);
    const result = await this.usecase.list({ skip, limit, page });
    return ok(
      res,
      { items: result.data ?? [], total: result.total ?? 0, page, pageSize: limit },
      C.OPERATIONAL_EXPENSES_FETCHED,
      TK,
    );
  };

  create = async (req, res) => {
    const result = await this.usecase.create({ body: req.body });
    return created(res, result.data ?? result, C.OPERATIONAL_EXPENSE_CREATED, TK);
  };
}

export const expenseController = new ExpenseController(expenseUsecase);

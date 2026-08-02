// accounting/expense usecase — orchestration only (no Prisma). createOperationalExpense's
// required-fields guard + numeric coercion live here; the two interleaved writes
// (OperationalExpenses + linked Outcome) are delegated to expense.repo.js so that write
// behavior is preserved exactly. The guard string is byte-identical to legacy (it currently
// surfaces as a 500 because this usecase does not translate it — legacy behavior preserved).
//
// The `legacy` constructor param remains a dependency-injection seam; its defaults now point
// at the relocated repo/usecase code instead of the deleted accountant service.
import { expenseRepository } from "./expense.repo.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { accountingMessagesCodes } from "@dms/shared";

async function createOperationalExpense({
  category,
  amount,
  description,
  paymentDate,
}) {
  if (!category || !amount || !paymentDate) {
    throw new AppError({ code: accountingMessagesCodes.REQUIRED_FIELDS_MISSING, statusCode: 400 });
  }

  amount = Number(amount);
  const newExpense = await expenseRepository.createOperationalExpense({
    category,
    amount,
    description,
    paymentDate,
  });

  return {
    data: newExpense,
  };
}

class ExpenseUsecase {
  listExpenses({ skip, limit }) {
    return expenseRepository.getOperationalExpenses({ limit: Number(limit), skip: Number(skip) });
  }

  createExpense({ body }) {
    return createOperationalExpense(body);
  }
}

export const expenseUsecase = new ExpenseUsecase();
export { ExpenseUsecase };

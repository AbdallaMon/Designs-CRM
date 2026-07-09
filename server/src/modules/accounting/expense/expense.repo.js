// accounting/expense repository — Prisma I/O ONLY. Relocated from the legacy accountant
// service. `getOperationalExpenses` is a verbatim list read; `createOperationalExpense`
// performs the two interleaved writes (OperationalExpenses.create + the linked Outcome)
// exactly as legacy did. The required-fields guard + numeric coercion live in the usecase.
import prisma from "../../../infra/prisma/prisma.js";

class ExpenseRepository {
  async getOperationalExpenses({ limit = 1, skip = 10 }) {
    const expenses = await prisma.OperationalExpenses.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        amount: true,
        description: true,
        category: true,
        createdAt: true,
        paymentDate: true,
      },
    });
    const total = await prisma.OperationalExpenses.count();
    const totalPages = Math.ceil(total / limit);

    return {
      data: expenses,
      total,
      totalPages,
    };
  }

  async createOperationalExpense({ category, amount, description, paymentDate }) {
    const newExpense = await prisma.OperationalExpenses.create({
      data: {
        category,
        amount,
        description,
        paymentDate: new Date(paymentDate),
        paymentStatus: "FULLY_PAID",
      },
    });
    const outcome = await prisma.outcome.create({
      data: {
        amount,
        description: `${category} - ${description}`,
        type: "OPERATIONAL_EXPENSE",
        createdAt: new Date(paymentDate),
        operationalExpensesByOutcome: {
          connect: {
            id: newExpense.id,
          },
        },
      },
    });

    return newExpense;
  }
}

export const expenseRepository = new ExpenseRepository();
export { ExpenseRepository };

import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
    OperationalExpenses: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    outcome: { create: vi.fn() },
  },
}));

vi.mock("../../../infra/prisma/prisma.js", () => ({ default: prisma }));

import { ExpenseRepository } from "../expense/expense.repo.js";

beforeEach(() => {
  vi.clearAllMocks();
});

function arrangeTransactions({ failOutcome = false } = {}) {
  const committed = { expenses: [], outcomes: [] };
  let nextExpenseId = 1;
  let tail = Promise.resolve();

  prisma.$transaction.mockImplementation(async (work) => {
    const previous = tail;
    let release;
    tail = new Promise((resolve) => {
      release = resolve;
    });
    await previous;
    const staged = { expenses: [], outcomes: [] };
    const client = {
      OperationalExpenses: {
        create: vi.fn(async ({ data }) => {
          const expense = { id: nextExpenseId++, ...data };
          staged.expenses.push(expense);
          return expense;
        }),
      },
      outcome: {
        create: vi.fn(async ({ data }) => {
          staged.outcomes.push(data);
          if (failOutcome) throw new Error("expense outcome failed");
          return data;
        }),
      },
    };

    try {
      const result = await work(client);
      committed.expenses.push(...staged.expenses);
      committed.outcomes.push(...staged.outcomes);
      return result;
    } finally {
      release();
    }
  });

  return committed;
}

describe("operational expense transaction", () => {
  const input = {
    category: "Utilities",
    amount: 250,
    description: "Electricity",
    paymentDate: "2026-08-01",
  };

  it("rolls back the expense when linked Outcome creation fails", async () => {
    const committed = arrangeTransactions({ failOutcome: true });

    await expect(new ExpenseRepository().createOperationalExpense(input)).rejects.toThrow(
      "expense outcome failed",
    );

    expect(committed).toEqual({ expenses: [], outcomes: [] });
  });

  it("keeps concurrent expenses as complete expense/outcome pairs", async () => {
    const committed = arrangeTransactions();
    const repository = new ExpenseRepository();

    await Promise.all([
      repository.createOperationalExpense(input),
      repository.createOperationalExpense({ ...input, description: "Water" }),
    ]);

    expect(committed.expenses).toHaveLength(2);
    expect(committed.outcomes).toHaveLength(2);
    const linkedIds = committed.outcomes.map(
      (outcome) => outcome.operationalExpensesByOutcome.connect.id,
    );
    expect(linkedIds.sort()).toEqual(committed.expenses.map(({ id }) => id).sort());
  });
});

// accounting/expense usecase — orchestration only (no Prisma). Behavior ported 1:1 from
// the legacy handlers + accountant service. createOperationalExpense writes BOTH the
// OperationalExpenses row and the linked Outcome row (legacy interleaves them); we invoke
// the existing service so that two-write behavior is preserved exactly.
const legacyDefaults = {
  getOperationalExpenses: (a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) =>
      m.getOperationalExpenses(a),
    ),
  createOperationalExpense: (a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) =>
      m.createOperationalExpense(a),
    ),
};

export class ExpenseUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  list({ skip, limit }) {
    return this.legacy.getOperationalExpenses({ limit: Number(limit), skip: Number(skip) });
  }

  create({ body }) {
    return this.legacy.createOperationalExpense(body);
  }
}

export const expenseUsecase = new ExpenseUsecase();

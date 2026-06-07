// accounting/salary usecase — orchestration only (no Prisma). Behavior ported 1:1 from
// the legacy handlers + accountant service (getSalaryData / createBaseSalary /
// editBaseSalary / generateMonthlySalary / getUsersWithSalaries) and adminServices
// (getUserLogs — the accountant-scoped last-seen helper). generateMonthlySalary runs a
// $transaction inside the service (monthly salary + outcome); we invoke it as-is so the
// atomic multi-write + the "already exists this month" rule are preserved exactly.
//
// The /users + /users/:userId/last-seen endpoints are the ACCOUNTANT-scoped helper lists
// the legacy accountant router exposed for salaries; they are ported here (NOT coupled to
// the users module) to keep behavior 1:1 with the legacy accountant versions.

const legacyDefaults = {
  getSalaryData: (a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) => m.getSalaryData(a)),
  createBaseSalary: (a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) =>
      m.createBaseSalary(a),
    ),
  editBaseSalary: (a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) =>
      m.editBaseSalary(a),
    ),
  generateMonthlySalary: (a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) =>
      m.generateMonthlySalary(a),
    ),
  getUsersWithSalaries: (...a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) =>
      m.getUsersWithSalaries(...a),
    ),
  getUserLogs: (...a) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.getUserLogs(...a)),
};

export class SalaryUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // ── accountant-scoped user helper lists (for salaries) ──────────────────────────
  listUsers({ query, limit, skip }) {
    return this.legacy.getUsersWithSalaries(query, limit, skip);
  }

  userLastSeen({ userId, month, year }) {
    return this.legacy.getUserLogs(userId, month, year);
  }

  // ── salaries ────────────────────────────────────────────────────────────────────
  salaryData({ query }) {
    return this.legacy.getSalaryData(query);
  }

  // Legacy route did: req.body.userId = userId; createBaseSalary(req.body).
  createBase({ userId, body }) {
    return this.legacy.createBaseSalary({ ...body, userId });
  }

  // Legacy route did: req.body.id = id; editBaseSalary(req.body).
  editBase({ id, body }) {
    return this.legacy.editBaseSalary({ ...body, id });
  }

  payMonthly({ body }) {
    return this.legacy.generateMonthlySalary(body);
  }
}

export const salaryUsecase = new SalaryUsecase();

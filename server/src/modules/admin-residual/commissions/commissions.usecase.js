// admin-residual/commissions usecase — orchestration only. The commission read/create/
// update logic (eligible-lead scan + 5% auto-commission seeding, balance arithmetic,
// admin manual commission) lives in the FROZEN `services/main/admin/adminServices.js`
// (heavy Prisma + money rules) and is invoked via lazy adapters — never duplicated.
const legacyDefaults = {
  getCommissionByUserId: (userId) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.getCommissionByUserId(userId)),
  createCommissionByAdmin: (a) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.createCommissionByAdmin(a)),
  updateCommission: (a) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.updateCommission(a)),
};

export class CommissionsUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  list({ userId }) {
    return this.legacy.getCommissionByUserId(userId);
  }

  create({ userId, leadId, amount, commissionReason }) {
    return this.legacy.createCommissionByAdmin({ userId, leadId, amount, commissionReason });
  }

  update({ commissionId, amount }) {
    return this.legacy.updateCommission({ commissionId, amount });
  }
}

export const commissionsUsecase = new CommissionsUsecase();

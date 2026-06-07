// admin-residual/fixed-data usecase — orchestration only. The FixedData create/edit/delete
// Prisma logic lives in the FROZEN `services/main/admin/adminServices.js` and is invoked via
// lazy adapters (no duplication). NOTE: the GET fixed-data read is NOT here — it lives in the
// already-migrated utilities module (UTILITY.FIXED_DATA_LIST). Only the WRITES are residual.
const legacyDefaults = {
  createAFixedData: (a) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.createAFixedData(a)),
  editAFixedData: (a) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.editAFixedData(a)),
  deleteAFixedData: (a) =>
    import("../../../../services/main/admin/adminServices.js").then((m) => m.deleteAFixedData(a)),
};

export class FixedDataUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  create({ data }) {
    return this.legacy.createAFixedData({ data });
  }

  update({ id, data }) {
    return this.legacy.editAFixedData({ id: Number(id), data });
  }

  remove({ id }) {
    return this.legacy.deleteAFixedData({ id: Number(id) });
  }
}

export const fixedDataUsecase = new FixedDataUsecase();

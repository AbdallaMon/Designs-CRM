// admin-residual/fixed-data usecase — orchestration only. The FixedData create/edit/delete
// Prisma writes live in fixed-data.repo.js and are invoked via the DI seam (no duplication).
// NOTE: the GET fixed-data read is NOT here — it lives in the already-migrated utilities
// module (UTILITY.FIXED_DATA_LIST). Only the WRITES are residual.
import { fixedDataRepository } from "./fixed-data.repo.js";

const legacyDefaults = {
  createAFixedData: (a) => fixedDataRepository.createAFixedData(a),
  editAFixedData: (a) => fixedDataRepository.editAFixedData(a),
  deleteAFixedData: (a) => fixedDataRepository.deleteAFixedData(a),
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

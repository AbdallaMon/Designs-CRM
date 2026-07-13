// admin-residual/fixed-data usecase — orchestration only. The FixedData create/edit/delete
// Prisma writes live in fixed-data.repo.js and are invoked via the DI seam (no duplication).
// NOTE: the GET fixed-data read is NOT here — it lives in the already-migrated utilities
// module (UTILITY.FIXED_DATA_LIST). Only the WRITES are residual.
import { fixedDataRepository } from "./fixed-data.repo.js";

class FixedDataUsecase {
  createFixedData({ data }) {
    return fixedDataRepository.createAFixedData({ data });
  }

  updateFixedData({ id, data }) {
    return fixedDataRepository.editAFixedData({ id: Number(id), data });
  }

  deleteFixedData({ id }) {
    return fixedDataRepository.deleteAFixedData({ id: Number(id) });
  }
}

export const fixedDataUsecase = new FixedDataUsecase();
export { FixedDataUsecase };

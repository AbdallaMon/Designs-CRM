// projects/update repository — Prisma I/O ONLY. The update read/write flows in legacy
// updateServices are laden with side effects (re-fetch via utilityServices.getClientLeadUpdate,
// updateALead, etc.), so they stay in the legacy service and are invoked from the
// usecase via lazy imports. This repo holds only the simple shared-settings read.
import prisma from "../../../infra/prisma/prisma.js";

class UpdateRepository {
  model = prisma.clientLeadUpdate;

  // GET /shared-settings/:updateId — legacy getSharedSettings.
  findSharedSettings({ updateId }) {
    return prisma.sharedUpdate.findMany({ where: { updateId: Number(updateId) } });
  }
}

export const updateRepository = new UpdateRepository();
export { UpdateRepository };

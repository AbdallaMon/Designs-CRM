// sales-stages repository — Prisma I/O ONLY (no business rules, no AppError). The
// stage-list read and the advance/roll-back mutation are ported VERBATIM from the legacy
// service (services/main/shared/salesStageServices.js) so observable behavior is
// preserved 1:1 (the unique [clientLeadId, stage] guard, the create-if-absent on
// advance, the delete-on-back).
import prisma from "../../infra/prisma/prisma.js";

class SalesStagesRepository {
  getSalesStages({ clientLeadId }) {
    return prisma.salesStage.findMany({
      where: { clientLeadId: Number(clientLeadId) },
    });
  }

  findStage({ clientLeadId, stage }) {
    return prisma.salesStage.findUnique({
      where: { clientLeadId_stage: { clientLeadId: Number(clientLeadId), stage } },
    });
  }

  createStage({ clientLeadId, stage }) {
    return prisma.salesStage.create({
      data: { stage, clientLeadId: Number(clientLeadId) },
    });
  }

  deleteStage({ clientLeadId, stage }) {
    return prisma.salesStage.delete({
      where: { clientLeadId_stage: { clientLeadId: Number(clientLeadId), stage } },
    });
  }
}

export const salesStagesRepository = new SalesStagesRepository();

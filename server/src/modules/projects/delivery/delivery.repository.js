// projects/delivery repository — Prisma I/O ONLY. The simple schedule read lives here;
// create/link/delete in legacy deliveryServices carry side effects (telegram note on
// create) so they stay in the legacy service, invoked from the usecase via lazy imports.
import prisma from "../../../infra/prisma/prisma.js";

class DeliveryRepository {
  model = prisma.deliverySchedule;

  // GET /:projectId/schedules — legacy getDeliveryScheduleByProjectId.
  findByProject({ projectId }) {
    return prisma.deliverySchedule.findMany({
      where: { projectId: Number(projectId) },
      include: { meeting: true, createdBy: true },
      orderBy: { deliveryAt: "asc" },
    });
  }
}

export const deliveryRepository = new DeliveryRepository();
export { DeliveryRepository };

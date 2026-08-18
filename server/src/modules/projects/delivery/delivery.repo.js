// projects/delivery repository — Prisma I/O ONLY. Reads + create/link/delete relocated
// verbatim from legacy deliveryServices; the telegram-note side effect on create stays in
// the usecase (orchestration).
import prisma from "../../../infra/prisma/prisma.js";
import { CONTRACT_STATUSES, WORK_STAGE_STATUSES } from "@dms/shared";

class DeliveryRepository {
  model = prisma.deliverySchedule;

  // GET /:projectId/schedules — legacy getDeliveryScheduleByProjectId.
  findByProject({ projectId }) {
    return prisma.deliverySchedule.findMany({
      where: {
        projectId: Number(projectId),
        OR: [
          { stageId: null },
          {
            stage: {
              is: {
                stageStatus: { not: WORK_STAGE_STATUSES.NOT_STARTED },
                contract: { is: { status: { not: CONTRACT_STATUSES.CANCELLED } } },
              },
            },
          },
        ],
      },
      include: { meeting: true, createdBy: true },
      orderBy: { deliveryAt: "asc" },
    });
  }

  create({ projectId, deliveryAt, userId, name }) {
    return prisma.deliverySchedule.create({
      data: {
        projectId: Number(projectId),
        deliveryAt: new Date(deliveryAt),
        createdById: Number(userId),
        name,
      },
    });
  }

  findProjectById({ projectId }) {
    return prisma.project.findUnique({ where: { id: Number(projectId) } });
  }

  deleteById({ id }) {
    return prisma.deliverySchedule.delete({ where: { id: Number(id) } });
  }

  // legacy linkADeliveryToMeeting: reads the meeting (result currently unused — the
  // deliveryAt sync is commented out), then updates the schedule's meetingReminderId.
  findMeetingReminderById({ meetingReminderId }) {
    return prisma.meetingReminder.findUnique({
      where: { id: Number(meetingReminderId) },
    });
  }

  linkMeeting({ deliveryId, meetingReminderId }) {
    return prisma.deliverySchedule.update({
      where: { id: Number(deliveryId) },
      data: { meetingReminderId: Number(meetingReminderId) },
      select: { projectId: true },
    });
  }
}

export const deliveryRepository = new DeliveryRepository();
export { DeliveryRepository };

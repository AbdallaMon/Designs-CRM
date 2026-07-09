// projects/task repository — Prisma I/O ONLY. The task reads plus the Prisma pieces of
// the notification-laden create/update flows (ported from the legacy taskServices) live
// here as thin methods; the orchestration (notifications) stays in the usecase. The note
// helpers (getNotes/addNote/deleteAModel) are generic shared services invoked from the
// usecase. Behavior-preserving: every query object is copied verbatim.
import prisma from "../../../infra/prisma/prisma.js";

class TaskRepository {
  model = prisma.task;

  // GET / — tasks list (legacy getTasksWithNotesIncluded). `where` is built in the
  // usecase from the legacy searchParams narrowing.
  list({ where }) {
    return prisma.task.findMany({
      where,
      include: {
        notes: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // Server-authoritative task status (override any client value in the DONE guard).
  findTaskStatus({ id }) {
    return prisma.task.findUnique({ where: { id: Number(id) }, select: { id: true, status: true } });
  }

  createTask({ data }) {
    return prisma.task.create({ data });
  }

  updateTaskById({ id, data }) {
    return prisma.task.update({ where: { id: Number(id) }, data });
  }

  findTaskById({ id }) {
    return prisma.task.findUnique({ where: { id: Number(id) } });
  }

  // Minimal project assignments (create/update notification fan-out).
  findProjectAssignments({ id }) {
    return prisma.project.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        assignments: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
  }

  // Task core fields (title/projectId) after an update, for notification fan-out.
  findTaskCore({ id }) {
    return prisma.task.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        projectId: true,
        title: true,
      },
    });
  }

  // GET /:id detail (no userId narrowing) — legacy getTaskDetails first branch.
  findTaskDetailNoUser({ id }) {
    return prisma.task.findUnique({
      where: { id: Number(id) },
      include: {
        notes: true,
        clientLead: {
          select: { id: true },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // GET /:id detail (userId narrowing path) — legacy getTaskDetails second branch.
  findTaskDetailWithProject({ id }) {
    return prisma.task.findUnique({
      where: { id: Number(id) },
      include: {
        notes: true,
        project: true,
        clientLead: {
          select: { id: true },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Assignment userIds of a task's project (the getTaskDetails access probe).
  findProjectAssignmentUserIds({ id }) {
    return prisma.project.findFirst({
      where: {
        id: Number(id),
      },
      select: {
        assignments: {
          select: { userId: true },
        },
      },
    });
  }
}

export const taskRepository = new TaskRepository();
export { TaskRepository };

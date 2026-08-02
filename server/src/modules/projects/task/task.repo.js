// Task Prisma I/O. Notification orchestration and cross-module note/delete operations
// remain in their owning usecases.
import prisma from "../../../infra/prisma/prisma.js";

class TaskRepository {
  model = prisma.task;

  // GET / — the usecase supplies the scoped where clause.
  list({ where }) {
    return prisma.task.findMany({
      where,
      include: {
        notes: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            currentProfile: { select: { key: true, label: true, isAdminTier: true } },
          },
        },
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

  // GET /:id detail without user narrowing.
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
            currentProfile: { select: { key: true, label: true, isAdminTier: true } },
          },
        },
      },
    });
  }

  // GET /:id detail for the user-narrowed path.
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
            currentProfile: { select: { key: true, label: true, isAdminTier: true } },
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

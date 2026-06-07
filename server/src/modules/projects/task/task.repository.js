// projects/task repository — Prisma I/O ONLY. Simple task reads live here; the
// notification-laden create/update stay in the legacy taskServices (invoked from the
// usecase via lazy imports — the courses/leads pattern). The note helpers (getNotes/
// addNote/deleteAModel) are generic shared services and are invoked from the usecase.
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
}

export const taskRepository = new TaskRepository();
export { TaskRepository };

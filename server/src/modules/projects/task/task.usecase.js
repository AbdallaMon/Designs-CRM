// projects/task usecase — business logic / orchestration. Prisma NEVER appears here
// (only repo + the shared project-scope usecase). Behavior ported 1:1 from legacy
// (routes/shared/tasks.js, services/main/shared/{taskServices,noteServices}.js).
//
// Object scope is enforced through the SHARED project-scope checker
// (projectUsecase.checkIfUserCanAccessProject / MutateProject) after resolving the
// task's parent project — there is no separate task-scope copy. Tasks not linked to a
// project (projectId null) fall back to the legacy behavior (no project gate).
import { AppError } from "../../../shared/errors/AppError.js";
import { TASK_STATUSES, PROFILES, projectsMessagesCodes } from "@dms/shared";
import { taskRepository } from "./task.repo.js";
import { projectUsecase } from "../shared/project-scope.js";
import {
  updateTaskNotification,
  newTaskCreatedNotification,
} from "../../../infra/notifications/index.js";
import { getNotes, addNote } from "../../notes/note.usecase.js";
import { deleteAllowedModel } from "../../generic-delete/generic-delete.usecase.js";

// Task orchestration. Prisma I/O is delegated to taskRepository; notification fan-out
// stays here. Note and allow-listed delete helpers come from their owner modules.
async function createNewTask({ data, isAdmin = false, staffId }) {
  const { userId, projectId, ...rest } = data;

  const createdTask = await taskRepository.createTask({ data: { ...rest } });
  const update = {};
  let project = null;
  if (projectId) {
    update.projectId = Number(projectId);
    project = await taskRepository.findProjectAssignments({ id: projectId });
  }
  if (userId) {
    update.userId = Number(userId);
  }
  if (Object.keys(update).length > 0) {
    await taskRepository.updateTaskById({ id: createdTask.id, data: update });
  }

  const newTask = await taskRepository.findTaskById({ id: createdTask.id });

  await newTaskCreatedNotification(
    newTask.id,
    staffId && !isAdmin ? staffId : null,
    projectId,
    newTask.title,
    isAdmin,
    newTask.type === "MODIFICATION"
  );
  if (project && project.assignments && isAdmin) {
    project.assignments.forEach(async (assignment) => {
      await newTaskCreatedNotification(
        newTask.id,
        assignment.userId,
        projectId,
        newTask.title,
        null,
        newTask.type === "MODIFICATION"
      );
    });
  }
  return newTask;
}

export async function updateTask({ data, taskId, isAdmin = false, userId }) {
  const oldTask = await taskRepository.findTaskStatus({ id: taskId });
  if (!isAdmin && oldTask.status === TASK_STATUSES.DONE) {
    throw new AppError({ code: projectsMessagesCodes.TASK_STATUS_TRANSITION_FORBIDDEN, statusCode: 403 });
  }

  if (data.status && data.status === TASK_STATUSES.DONE) {
    data.finishedAt = new Date();
  }
  data.updatedAt = new Date();
  const updatedTask = await taskRepository.updateTaskById({ id: taskId, data });

  const task = await taskRepository.findTaskCore({ id: taskId });
  let project = null;
  if (task.projectId) {
    project = await taskRepository.findProjectAssignments({ id: task.projectId });
  }
  await updateTaskNotification(
    task.id,
    userId && !isAdmin ? userId : null,
    task.projectId,
    task.title,
    isAdmin,
    task.type === "MODIFICATION"
  );
  if (project && project.assignments && isAdmin) {
    project.assignments.forEach(async (assignment) => {
      await updateTaskNotification(
        task.id,
        assignment.userId,
        task.projectId,
        task.title,
        false,
        task.type === "MODIFICATION"
      );
    });
  }
  return updatedTask;
}

async function getTaskDetails({ searchParams, id }) {
  const taskId = Number(id);
  if (!searchParams.userId || searchParams.userId === "null") {
    return await taskRepository.findTaskDetailNoUser({ id: taskId });
  }

  const userId = Number(searchParams.userId);

  const task = await taskRepository.findTaskDetailWithProject({ id: taskId });
  if (!task) {
    return null;
  }

  if (task.projectId) {
    const projectUser = await taskRepository.findProjectAssignmentUserIds({ id: task.projectId });
    let passed = false;
    projectUser.assignments?.forEach((assignment) => {
      if (assignment.userId === Number(userId)) {
        passed = true;
        return;
      }
    });
    if (passed) {
      return task;
    }
  }

  throw new AppError({ code: projectsMessagesCodes.TASK_ACCESS_DENIED, statusCode: 403 });
}

export const taskOperations = {
  getTaskDetails,
  createNewTask,
  updateTask,
  getNotes,
  addNote,
  deleteAllowedModel,
};

class TaskUsecase {
  isAdminUser(authUser) {
    return (
      Boolean(authUser?.isAdminTier) ||
      authUser?.currentProfileKey === PROFILES.SUPER_SALES
    );
  }

  // The frontend sends `dueDate` as a date-only string ("2026-06-12"), but Prisma
  // Task.dueDate is DateTime? and rejects a bare date ("premature end of input").
  // Coerce any provided date-only field to a real Date before it reaches the repo,
  // while leaving null/undefined/empty as null (never `new Date("")` → Invalid Date).
  // Mirrors the existing last-mile coercion style in deliveryServices/projectServices.
  coerceTaskDates(data) {
    const out = { ...data };
    if ("dueDate" in out) {
      out.dueDate = out.dueDate ? new Date(out.dueDate) : null;
    }
    return out;
  }

  // ── object-scope: resolve the task's parent project, then run project scope ───────
  async checkIfUserCanAccessTask({ taskId, authUser }) {
    const task = await projectUsecase.resolveTaskProject({ taskId });
    if (task.projectId) {
      await projectUsecase.checkIfUserCanAccessProject({ id: task.projectId, authUser });
    }
    // task without a project: legacy applied no project gate — preserve (the route's
    // permission code still applies).
    return task;
  }

  async checkIfUserCanMutateTask({ taskId, authUser }) {
    const task = await projectUsecase.resolveTaskProject({ taskId });
    if (task.projectId) {
      await projectUsecase.checkIfUserCanMutateProject({ id: task.projectId, authUser });
    }
    return task;
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  TASKS
  // ════════════════════════════════════════════════════════════════════════════
  // GET / — list. Legacy narrowed designers/staff to self (searchParams.userId).
  async listTasks({ query, authUser }) {
    const searchParams = { ...query };
    if (
      [
        PROFILES.DESIGNER_3D,
        PROFILES.DESIGNER_2D,
        PROFILES.NORMAL_SALES,
        PROFILES.PRIMARY_SALES,
      ].includes(authUser.currentProfileKey)
    ) {
      searchParams.userId = authUser.id;
    }
    // reproduce legacy getTasksWithNotesIncluded `where` so we keep Prisma in the repo.
    const where = {};
    if (searchParams.userId && searchParams.userId !== "null") where.userId = Number(searchParams.userId);
    if (searchParams.projectId) {
      where.projectId = Number(searchParams.projectId);
      delete where.userId;
    }
    if (searchParams.type) where.type = searchParams.type;
    if (searchParams.clientLeadId) where.clientLeadId = Number(searchParams.clientLeadId);
    return taskRepository.list({ where });
  }

  // GET /:id — detail. Object scope already enforced; reproduce the legacy self-narrow.
  async getTask({ id, query, authUser }) {
    const searchParams = { ...query };
    if (
      [
        PROFILES.DESIGNER_3D,
        PROFILES.DESIGNER_2D,
        PROFILES.NORMAL_SALES,
        PROFILES.PRIMARY_SALES,
      ].includes(authUser.currentProfileKey)
    ) {
      searchParams.userId = authUser.id;
    }
    return taskOperations.getTaskDetails({ searchParams, id: Number(id) });
  }

  // POST / — create. Legacy did NOT object-scope creation (any authed role could create
  // a task and optionally link a project). Preserve that; the route requires TASK.CREATE.
  async createTask({ body, authUser }) {
    const isAdmin = this.isAdminUser(authUser);
    const data = this.coerceTaskDates({ ...body, createdById: Number(authUser.id) });
    const task = await taskOperations.createNewTask({ data, isAdmin, staffId: authUser.id });
    return { task, isModification: task?.type === "MODIFICATION" };
  }

  // PUT /:taskId — update. Object scope already enforced via the parent project.
  async updateTask({ taskId, body, authUser }) {
    const isAdmin = this.isAdminUser(authUser);
    const task = await taskOperations.updateTask({ data: this.coerceTaskDates({ ...body }), taskId: Number(taskId), isAdmin, userId: authUser.id });
    return { task, isModification: task?.type === "MODIFICATION" };
  }

  // DELETE /:id — TASK delete only (IDOR fix). The validation layer guarantees
  // body.model === "Task" and strips any other key, so this route can ONLY ever delete a
  // Task. We ALWAYS resolve the task's parent project and run the project MUTATE scope
  // before deleting, then delegate with a server-fixed model:"Task". Clients cannot
  // provide model names or cascade instructions for this route.
  async deleteTask({ id, body, authUser }) {
    if (!body?.model) throw new AppError({ code: projectsMessagesCodes.DELETE_MODEL_REQUIRED, statusCode: 400 });
    await this.checkIfUserCanMutateTask({ taskId: id, authUser });
    const isAdmin = this.isAdminUser(authUser);
    return taskOperations.deleteAllowedModel({ id: Number(id), isAdmin, data: { model: "Task" } });
  }

  // ── notes (generic shared helpers) ───────────────────────────────────────────────
  getNotes({ query }) {
    return taskOperations.getNotes(query);
  }

  addNote({ body, authUser }) {
    const isAdmin = this.isAdminUser(authUser);
    return taskOperations.addNote({ ...body, userId: authUser.id, isAdmin });
  }
}

export const taskUsecase = new TaskUsecase();
export { TaskUsecase };

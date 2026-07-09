// projects/task usecase — business logic / orchestration. Prisma NEVER appears here
// (only repo + the shared project-scope usecase). Behavior ported 1:1 from legacy
// (routes/shared/tasks.js, services/main/shared/{taskServices,noteServices}.js).
//
// Object scope is enforced through the SHARED project-scope checker
// (projectUsecase.checkIfUserCanAccessProject / MutateProject) after resolving the
// task's parent project — there is no separate task-scope copy. Tasks not linked to a
// project (projectId null) fall back to the legacy behavior (no project gate).
import { AppError } from "../../../shared/errors/AppError.js";
import { projectsMessagesCodes as C } from "@dms/shared";
import { taskRepository } from "./task.repo.js";
import { projectUsecase } from "../shared/project-scope.js";
import {
  updateTaskNotification,
  newTaskCreatedNotification,
} from "../../../infra/notifications/legacy-notification.js";

// ── task flows ported 1:1 from the legacy shared/legacy/task-services.js. Prisma I/O is
// delegated to taskRepository; the notification fan-out stays here. The note helpers
// (getNotes/addNote/deleteAModel) live in the cross-cluster note-services and are still
// invoked via lazy barrel imports below.
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
  if (!isAdmin && oldTask.status === "DONE") {
    throw new Error("You can't change the task after DONE only admin can");
  }

  if (data.status && data.status === "DONE") {
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

  throw new Error("You are not allowed to see this task");
}

const legacyDefaults = {
  getTaskDetails,
  createNewTask,
  updateTask,
  getNotes: (a) => import("../../../shared/legacy/index.js").then((m) => m.getNotes(a)),
  addNote: (a) => import("../../../shared/legacy/index.js").then((m) => m.addNote(a)),
  deleteAModel: (a) => import("../../../shared/legacy/index.js").then((m) => m.deleteAModel(a)),
};

export class TaskUsecase {
  constructor(repository, projects = projectUsecase, legacy = {}) {
    this.repo = repository;
    this.projects = projects;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  isAdminUser(authUser) {
    return authUser?.role === "ADMIN" || authUser?.role === "SUPER_ADMIN";
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
    const task = await this.projects.resolveTaskProject({ taskId });
    if (task.projectId) {
      await this.projects.checkIfUserCanAccessProject({ id: task.projectId, authUser });
    }
    // task without a project: legacy applied no project gate — preserve (the route's
    // permission code still applies).
    return task;
  }

  async checkIfUserCanMutateTask({ taskId, authUser }) {
    const task = await this.projects.resolveTaskProject({ taskId });
    if (task.projectId) {
      await this.projects.checkIfUserCanMutateProject({ id: task.projectId, authUser });
    }
    return task;
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  TASKS
  // ════════════════════════════════════════════════════════════════════════════
  // GET / — list. Legacy narrowed designers/staff to self (searchParams.userId).
  async list({ query, authUser }) {
    const { role } = authUser;
    const searchParams = { ...query };
    if (role === "THREE_D_DESIGNER" || role === "TWO_D_DESIGNER" || role === "STAFF") {
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
    return this.repo.list({ where });
  }

  // GET /:id — detail. Object scope already enforced; reproduce the legacy self-narrow.
  async getById({ id, query, authUser }) {
    const { role } = authUser;
    const searchParams = { ...query };
    if (role === "THREE_D_DESIGNER" || role === "TWO_D_DESIGNER" || role === "STAFF") {
      searchParams.userId = authUser.id;
    }
    return this.legacy.getTaskDetails({ searchParams, id: Number(id) });
  }

  // POST / — create. Legacy did NOT object-scope creation (any authed role could create
  // a task and optionally link a project). Preserve that; the route requires TASK.CREATE.
  async create({ body, authUser }) {
    const isAdmin = this.isAdminUser(authUser);
    const data = this.coerceTaskDates({ ...body, createdById: Number(authUser.id) });
    const task = await this.legacy.createNewTask({ data, isAdmin, staffId: authUser.id });
    return { task, isModification: task?.type === "MODIFICATION" };
  }

  // PUT /:taskId — update. Object scope already enforced via the parent project.
  async update({ taskId, body, authUser }) {
    const isAdmin = this.isAdminUser(authUser);
    const task = await this.legacy.updateTask({ data: this.coerceTaskDates({ ...body }), taskId: Number(taskId), isAdmin, userId: authUser.id });
    return { task, isModification: task?.type === "MODIFICATION" };
  }

  // DELETE /:id — TASK delete only (IDOR fix). The validation layer guarantees
  // body.model === "Task" and strips any other key, so this route can ONLY ever delete a
  // Task. We ALWAYS resolve the task's parent project and run the project MUTATE scope
  // BEFORE deleting (never conditionally), then delegate to the legacy deleteAModel with a
  // SERVER-FIXED model:"Task" and NO client-supplied deleteModelesBeforeMain — preserving
  // the legacy non-admin createdAt time-window / super-sales guard for Task deletion while
  // closing the broad-delete hole. Other legacy models retain their own legacy endpoints
  // (e.g. /shared/delete/:id) under the strangler, so capability is not removed.
  async remove({ id, body, authUser }) {
    if (!body?.model) throw new AppError(C.DELETE_MODEL_REQUIRED, 400);
    await this.checkIfUserCanMutateTask({ taskId: id, authUser });
    const isAdmin = this.isAdminUser(authUser);
    return this.legacy.deleteAModel({ id: Number(id), isAdmin, data: { model: "Task" } });
  }

  // ── notes (generic shared helpers) ───────────────────────────────────────────────
  notes({ query }) {
    return this.legacy.getNotes(query);
  }

  addNote({ body, authUser }) {
    const isAdmin = this.isAdminUser(authUser);
    return this.legacy.addNote({ ...body, userId: authUser.id, isAdmin });
  }
}

export const taskUsecase = new TaskUsecase(taskRepository);

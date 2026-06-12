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
import { taskRepository } from "./task.repository.js";
import { projectUsecase } from "../shared/project-scope.js";

const legacyDefaults = {
  getTasksWithNotesIncluded: (a) => import("../../../../services/main/shared/index.js").then((m) => m.getTasksWithNotesIncluded(a)),
  getTaskDetails: (a) => import("../../../../services/main/shared/index.js").then((m) => m.getTaskDetails(a)),
  createNewTask: (a) => import("../../../../services/main/shared/index.js").then((m) => m.createNewTask(a)),
  updateTask: (a) => import("../../../../services/main/shared/index.js").then((m) => m.updateTask(a)),
  getNotes: (a) => import("../../../../services/main/shared/index.js").then((m) => m.getNotes(a)),
  addNote: (a) => import("../../../../services/main/shared/index.js").then((m) => m.addNote(a)),
  deleteAModel: (a) => import("../../../../services/main/shared/index.js").then((m) => m.deleteAModel(a)),
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

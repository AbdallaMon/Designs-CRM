// Thin controller for the tasks surface. The checkIfUserCan* methods resolve the task's
// parent project (in the usecase) and run the SHARED project scope checker.
import { ok, created } from "../../../shared/http/response.js";
import { projectsMessagesCodes, messagesNames } from "@dms/shared";
import { taskUsecase } from "./task.usecase.js";
import { withTaskListCapabilities, computeTaskCapabilities } from "./task.dto.js";

const TK = messagesNames.projectsMessages;

class TaskController {
  // ── object-scope checkers (parent-project scope) ─────────────────────────────────
  // GET /:id → `:id`; PUT /:taskId → `:taskId`.
  checkIfUserCanAccessTask(req) {
    return taskUsecase.checkIfUserCanAccessTask({ taskId: req.params.id, authUser: req.auth });
  }

  checkIfUserCanMutateTask(req) {
    return taskUsecase.checkIfUserCanMutateTask({ taskId: req.params.taskId, authUser: req.auth });
  }

  // ── tasks ────────────────────────────────────────────────────────────────────────
  async getTasks(req, res) {
    const items = await taskUsecase.listTasks({ query: req.query, authUser: req.auth });
    return ok(res, { items: withTaskListCapabilities(items, req.auth) }, projectsMessagesCodes.TASKS_FETCHED, TK);
  }

  async getTask(req, res) {
    const data = await taskUsecase.getTask({ id: req.params.id, query: req.query, authUser: req.auth });
    const withCaps = data ? { ...data, capabilities: computeTaskCapabilities(data, req.auth) } : data;
    return ok(res, withCaps, projectsMessagesCodes.TASK_FETCHED, TK);
  }

  async createTask(req, res) {
    const { task, isModification } = await taskUsecase.createTask({ body: req.body, authUser: req.auth });
    return created(res, task, isModification ? projectsMessagesCodes.MODIFICATION_CREATED : projectsMessagesCodes.TASK_CREATED, TK);
  }

  async updateTask(req, res) {
    const { task, isModification } = await taskUsecase.updateTask({ taskId: req.params.taskId, body: req.body, authUser: req.auth });
    return ok(res, task, isModification ? projectsMessagesCodes.MODIFICATION_UPDATED : projectsMessagesCodes.TASK_UPDATED, TK);
  }

  async deleteTask(req, res) {
    const data = await taskUsecase.deleteTask({ id: req.params.id, body: req.body, authUser: req.auth });
    return ok(res, data, projectsMessagesCodes.TASK_DELETED, TK);
  }

  // ── notes ──────────────────────────────────────────────────────────────────────
  async getNotes(req, res) {
    const data = await taskUsecase.getNotes({ query: req.query });
    return ok(res, data, projectsMessagesCodes.NOTES_FETCHED, TK);
  }

  async addNote(req, res) {
    const data = await taskUsecase.addNote({ body: req.body, authUser: req.auth });
    return created(res, data, projectsMessagesCodes.NOTE_ADDED, TK);
  }
}

export const taskController = new TaskController();
export { TaskController };

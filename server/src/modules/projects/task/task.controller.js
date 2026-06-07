// Thin controller for the tasks surface. The checkIfUserCan* methods resolve the task's
// parent project (in the usecase) and run the SHARED project scope checker.
import { ok, created } from "../../../shared/http/response.js";
import { projectsMessagesCodes, messagesNames } from "@dms/shared";
import { taskUsecase } from "./task.usecase.js";
import { withTaskListCapabilities, computeTaskCapabilities } from "./task.dto.js";

const C = projectsMessagesCodes;
const TK = messagesNames.projectsMessages;

export class TaskController {
  /** @param {import("./task.usecase.js").TaskUsecase} usecase */
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── object-scope checkers (parent-project scope) ─────────────────────────────────
  // GET /:id → `:id`; PUT /:taskId → `:taskId`.
  checkIfUserCanAccessTask = (req) =>
    this.usecase.checkIfUserCanAccessTask({ taskId: req.params.id, authUser: req.auth });

  checkIfUserCanMutateTask = (req) =>
    this.usecase.checkIfUserCanMutateTask({ taskId: req.params.taskId, authUser: req.auth });

  // ── tasks ────────────────────────────────────────────────────────────────────────
  list = async (req, res) => {
    const items = await this.usecase.list({ query: req.query, authUser: req.auth });
    return ok(res, { items: withTaskListCapabilities(items, req.auth) }, C.TASKS_FETCHED, TK);
  };

  getById = async (req, res) => {
    const data = await this.usecase.getById({ id: req.params.id, query: req.query, authUser: req.auth });
    const withCaps = data ? { ...data, capabilities: computeTaskCapabilities(data, req.auth) } : data;
    return ok(res, withCaps, C.TASK_FETCHED, TK);
  };

  create = async (req, res) => {
    const { task, isModification } = await this.usecase.create({ body: req.body, authUser: req.auth });
    return created(res, task, isModification ? C.MODIFICATION_CREATED : C.TASK_CREATED, TK);
  };

  update = async (req, res) => {
    const { task, isModification } = await this.usecase.update({ taskId: req.params.taskId, body: req.body, authUser: req.auth });
    return ok(res, task, isModification ? C.MODIFICATION_UPDATED : C.TASK_UPDATED, TK);
  };

  remove = async (req, res) => {
    const data = await this.usecase.remove({ id: req.params.id, body: req.body, authUser: req.auth });
    return ok(res, data, C.TASK_DELETED, TK);
  };

  // ── notes ──────────────────────────────────────────────────────────────────────
  notes = async (req, res) => {
    const data = await this.usecase.notes({ query: req.query });
    return ok(res, data, C.NOTES_FETCHED, TK);
  };

  addNote = async (req, res) => {
    const data = await this.usecase.addNote({ body: req.body, authUser: req.auth });
    return created(res, data, C.NOTE_ADDED, TK);
  };
}

export const taskController = new TaskController(taskUsecase);

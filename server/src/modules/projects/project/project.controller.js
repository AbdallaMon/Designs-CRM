// Thin controller for the projects surface. Reads validated input, delegates to the
// usecase, responds via the shared envelope. No business logic. The `checkIfUserCan*`
// methods are the object-scope gates wired with requireSpecialChecker — they THROW on
// denial (via the usecase) and return the loaded row on success.
import { ok, created } from "../../../shared/http/response.js";
import { projectsMessagesCodes, messagesNames } from "@dms/shared";
import { projectUsecase } from "./project.usecase.js";
import { withProjectListCapabilities, computeProjectCapabilities } from "./project.dto.js";

const C = projectsMessagesCodes;
const TK = messagesNames.projectsMessages;

// Legacy default pagination: page=1, limit=10 (services/main/utility getPagination).
function paginate(query) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  return { page, limit, skip: (page - 1) * limit };
}

export class ProjectController {
  /** @param {import("./project.usecase.js").ProjectUsecase} usecase */
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── object-scope checkers ──────────────────────────────────────────────────────
  // GET/PUT /:id and GET /designers/:id → project id is `:id`.
  checkIfUserCanAccessProject = (req) =>
    this.usecase.checkIfUserCanAccessProject({ id: req.params.id, authUser: req.auth });

  checkIfUserCanMutateProject = (req) =>
    this.usecase.checkIfUserCanMutateProject({ id: req.params.id, authUser: req.auth });

  // POST /designers/:leadId/actions/change-status → the PROJECT id is in the BODY
  // (`body.id`); scope on that, not the `:leadId` path param.
  checkIfUserCanMutateProjectFromBody = (req) =>
    this.usecase.checkIfUserCanMutateProject({ id: req.body.id, authUser: req.auth });

  // GET /user-profile/:userId — admin-tier may query any user; others only themselves.
  checkIfUserCanAccessUserProfile = (req) =>
    this.usecase.checkIfUserCanAccessUserProfile({ userId: req.params.userId, authUser: req.auth });

  // clientLead-keyed reads: GET / (?clientLeadId in query), GET /:leadId/groups.
  checkIfUserCanAccessLeadProjects = (req) =>
    this.usecase.checkIfUserCanAccessLeadProjects({
      clientLeadId: req.params.leadId ?? req.query.clientLeadId,
      authUser: req.auth,
    });

  // ── designer board lists (no object checker — collection narrowed by role/self) ──
  designers = async (req, res) => {
    const items = await this.usecase.designers({ query: req.query, authUser: req.auth });
    return ok(res, { items: withProjectListCapabilities(items, req.auth) }, C.DESIGNER_PROJECTS_FETCHED, TK);
  };

  designerColumns = async (req, res) => {
    const result = await this.usecase.designerColumns({ query: req.query, authUser: req.auth });
    const data = result?.data ? { ...result, data: withProjectListCapabilities(result.data, req.auth) } : result;
    return ok(res, data, C.DESIGNER_PROJECTS_FETCHED, TK);
  };

  designerLeadDetail = async (req, res) => {
    const data = await this.usecase.designerLeadDetail({ id: req.params.id, query: req.query, authUser: req.auth });
    return ok(res, data, C.DESIGNER_LEAD_FETCHED, TK);
  };

  // ── project list & detail ────────────────────────────────────────────────────
  listByClientLead = async (req, res) => {
    const items = await this.usecase.listByClientLead({ query: req.query, authUser: req.auth });
    return ok(res, { items: withProjectListCapabilities(items, req.auth) }, C.PROJECTS_FETCHED, TK);
  };

  archived = async (req, res) => {
    const { page, limit, skip } = paginate(req.query);
    const { items, total } = await this.usecase.archived({ query: req.query, authUser: req.auth, skip, limit });
    return ok(
      res,
      { items: withProjectListCapabilities(items, req.auth), total, page, pageSize: limit },
      C.ARCHIVED_PROJECTS_FETCHED,
      TK,
    );
  };

  userProjects = async (req, res) => {
    const { limit, skip } = paginate(req.query);
    const result = await this.usecase.userProjects({ userId: req.params.userId, query: req.query, limit, skip });
    return ok(res, result, C.USER_PROJECTS_FETCHED, TK);
  };

  getById = async (req, res) => {
    const data = await this.usecase.getById({ id: req.params.id, query: req.query, authUser: req.auth });
    const withCaps = data ? { ...data, capabilities: computeProjectCapabilities(data, req.auth) } : data;
    return ok(res, withCaps, C.PROJECT_FETCHED, TK);
  };

  groups = async (req, res) => {
    const data = await this.usecase.groups({ leadId: req.params.leadId });
    return ok(res, data, C.PROJECT_GROUPS_FETCHED, TK);
  };

  // ── mutations ──────────────────────────────────────────────────────────────────
  updateProject = async (req, res) => {
    const data = await this.usecase.updateProject({
      id: req.params.id,
      body: req.body,
      authUser: req.auth,
      currentStatus: req.scoped?.status,
    });
    return ok(res, data, C.PROJECT_UPDATED, TK);
  };

  assignDesigner = async (req, res) => {
    const data = await this.usecase.assignDesigner({ id: req.params.id, body: req.body });
    return ok(res, data, C.PROJECT_DESIGNER_ASSIGNED, TK);
  };

  changeDesignerStatus = async (req, res) => {
    const data = await this.usecase.changeDesignerStatus({
      body: req.body,
      authUser: req.auth,
      currentStatus: req.scoped?.status,
    });
    return ok(res, data, C.PROJECT_STATUS_CHANGED, TK);
  };
}

export const projectController = new ProjectController(projectUsecase);

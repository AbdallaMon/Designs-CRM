// Thin controller for the projects surface. Reads validated input, delegates to the
// usecase, responds via the shared envelope. No business logic. The `checkIfUserCan*`
// methods are the object-scope gates wired with requireSpecialChecker — they THROW on
// denial (via the usecase) and return the loaded row on success.
import { ok, created } from "../../../shared/http/response.js";
import { projectsMessagesCodes, messagesNames } from "@dms/shared";
import { projectUsecase } from "./project.usecase.js";
import {
  withProjectListCapabilities,
  withProjectDetailCapabilities,
  computeProjectCapabilities,
} from "./project.dto.js";

const TK = messagesNames.projectsMessages;

import { paginate } from "../../../shared/utility/pagination.js";

class ProjectController {
  // ── object-scope checkers ──────────────────────────────────────────────────────
  // GET/PUT /:id and GET /designers/:id → project id is `:id`.
  checkIfUserCanAccessProject(req) {
    return projectUsecase.checkIfUserCanAccessProject({ id: req.params.id, authUser: req.auth });
  }

  checkIfUserCanMutateProject(req) {
    return projectUsecase.checkIfUserCanMutateProject({ id: req.params.id, authUser: req.auth });
  }

  // POST /designers/:leadId/actions/change-status → the PROJECT id is in the BODY
  // (`body.id`); scope on that, not the `:leadId` path param.
  checkIfUserCanMutateProjectFromBody(req) {
    return projectUsecase.checkIfUserCanMutateProject({ id: req.body.id, authUser: req.auth });
  }

  // GET /user-profile/:userId — admin-tier may query any user; others only themselves.
  checkIfUserCanAccessUserProfile(req) {
    return projectUsecase.checkIfUserCanAccessUserProfile({ userId: req.params.userId, authUser: req.auth });
  }

  // clientLead-keyed reads: GET / (?clientLeadId in query), GET /:leadId/groups.
  checkIfUserCanAccessLeadProjects(req) {
    return projectUsecase.checkIfUserCanAccessLeadProjects({
      clientLeadId: req.params.leadId ?? req.query.clientLeadId,
      authUser: req.auth,
    });
  }

  // ── designer board lists (no object checker — collection narrowed by role/self) ──
  async getDesigners(req, res) {
    const items = await projectUsecase.getDesigners({ query: req.query, authUser: req.auth });
    return ok(res, { items: withProjectListCapabilities(items, req.auth) }, projectsMessagesCodes.DESIGNER_PROJECTS_FETCHED, TK);
  }

  async getDesignerColumns(req, res) {
    const result = await projectUsecase.getDesignerColumns({ query: req.query, authUser: req.auth });
    const data = result?.data ? { ...result, data: withProjectListCapabilities(result.data, req.auth) } : result;
    return ok(res, data, projectsMessagesCodes.DESIGNER_PROJECTS_FETCHED, TK);
  }

  async getDesignerLeadDetail(req, res) {
    const data = await projectUsecase.getDesignerLeadDetail({ id: req.params.id, query: req.query, authUser: req.auth });
    return ok(res, withProjectDetailCapabilities(data, req.auth), projectsMessagesCodes.DESIGNER_LEAD_FETCHED, TK);
  }

  // ── project list & detail ────────────────────────────────────────────────────
  async listByClientLead(req, res) {
    const items = await projectUsecase.listByClientLead({ query: req.query, authUser: req.auth });
    return ok(res, { items: withProjectListCapabilities(items, req.auth) }, projectsMessagesCodes.PROJECTS_FETCHED, TK);
  }

  async getArchivedProjects(req, res) {
    const { page, limit, skip } = paginate(req.query);
    const { items, total } = await projectUsecase.listArchivedProjects({ query: req.query, authUser: req.auth, skip, limit });
    return ok(
      res,
      { items: withProjectListCapabilities(items, req.auth), total, page, pageSize: limit },
      projectsMessagesCodes.ARCHIVED_PROJECTS_FETCHED,
      TK,
    );
  }

  async getUserProjects(req, res) {
    const { limit, skip } = paginate(req.query);
    const result = await projectUsecase.getUserProjects({ userId: req.params.userId, query: req.query, limit, skip });
    return ok(res, result, projectsMessagesCodes.USER_PROJECTS_FETCHED, TK);
  }

  async getProject(req, res) {
    const data = await projectUsecase.getProject({ id: req.params.id, query: req.query, authUser: req.auth });
    const withCaps = data ? { ...data, capabilities: computeProjectCapabilities(data, req.auth) } : data;
    return ok(res, withCaps, projectsMessagesCodes.PROJECT_FETCHED, TK);
  }

  async getProjectGroups(req, res) {
    const data = await projectUsecase.listProjectGroups({ leadId: req.params.leadId });
    return ok(res, data, projectsMessagesCodes.PROJECT_GROUPS_FETCHED, TK);
  }

  // ── mutations ──────────────────────────────────────────────────────────────────
  async updateProject(req, res) {
    const data = await projectUsecase.updateProject({
      id: req.params.id,
      body: req.body,
      authUser: req.auth,
      currentStatus: req.scoped?.status,
    });
    return ok(res, data, projectsMessagesCodes.PROJECT_UPDATED, TK);
  }

  async assignDesigner(req, res) {
    const data = await projectUsecase.assignDesigner({ id: req.params.id, body: req.body });
    return ok(res, data, projectsMessagesCodes.PROJECT_DESIGNER_ASSIGNED, TK);
  }

  async changeDesignerStatus(req, res) {
    const data = await projectUsecase.changeDesignerStatus({
      body: req.body,
      authUser: req.auth,
      currentStatus: req.scoped?.status,
    });
    return ok(res, data, projectsMessagesCodes.PROJECT_STATUS_CHANGED, TK);
  }
}

export const projectController = new ProjectController();
export { ProjectController };

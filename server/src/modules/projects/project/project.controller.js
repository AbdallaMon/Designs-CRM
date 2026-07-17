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
  decorateProject,
} from "./project.dto.js";

const TK = messagesNames.projectsMessages;

import { paginate } from "../../../shared/utility/pagination.js";

class ProjectController {
  // ── object-scope checkers ──────────────────────────────────────────────────────
  // GET/PUT /:id → project id is `:id`.
  checkIfUserCanAccessProject(req) {
    return projectUsecase.checkIfUserCanAccessProject({ id: req.params.id, authUser: req.auth });
  }

  // GET /designers/:id → `:id` is a clientLeadId (the handler is getDesignerLeadDetail →
  // getLeadDetailsByProject(clientLeadId), a LEAD-keyed read). Scope on the LEAD, not the
  // Project table — a designer passes if they hold any assigned project under this lead.
  checkIfUserCanAccessDesignerLead(req) {
    return projectUsecase.checkIfUserCanAccessLeadProjects({ clientLeadId: req.params.id, authUser: req.auth });
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

  // ── per-tab readers (lazy designer-lead sub-resource reads) ────────────────────
  // One slice of the designer lead detail each, so the work-stage preview can load a
  // tab on demand and refetch only that tab after a mutation. Object scope is enforced
  // by the route (requireSpecialChecker(checkIfUserCanAccessDesignerLead)); `:id` is a
  // clientLeadId, as on the parent /designers/:id read.
  async getDesignerLeadNotes(req, res) {
    const items = await projectUsecase.getDesignerLeadNotes({ id: req.params.id, query: req.query, authUser: req.auth });
    return ok(res, items, projectsMessagesCodes.DESIGNER_LEAD_FETCHED, TK);
  }

  async getDesignerLeadCalls(req, res) {
    const items = await projectUsecase.getDesignerLeadCalls({ id: req.params.id, query: req.query, authUser: req.auth });
    return ok(res, items, projectsMessagesCodes.DESIGNER_LEAD_FETCHED, TK);
  }

  async getDesignerLeadFiles(req, res) {
    const items = await projectUsecase.getDesignerLeadFiles({ id: req.params.id, query: req.query, authUser: req.auth });
    return ok(res, items, projectsMessagesCodes.DESIGNER_LEAD_FETCHED, TK);
  }

  // ── project list & detail ────────────────────────────────────────────────────
  async listByClientLead(req, res) {
    const items = await projectUsecase.listByClientLead({ query: req.query, authUser: req.auth });
    const decorated = items.map((p) => decorateProject(p, req.auth));
    return ok(res, { items: decorated }, projectsMessagesCodes.PROJECTS_FETCHED, TK);
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
    const withCaps = data ? decorateProject(data, req.auth) : data;
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

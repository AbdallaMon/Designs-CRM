// projects/project usecase — business logic / orchestration. Prisma NEVER appears
// here (only repo calls). Behavior ported 1:1 from the legacy handlers + services
// (routes/shared/projects.js, services/main/shared/{projectServices,taskServices}.js).
// Errors are thrown as AppError(code, statusCode); the envelope serializes them.
//
// THE IDOR KEYSTONE lives here: checkIfUserCanAccessProject / checkIfUserCanMutateProject
// (+ the clientLead-keyed variants). The task/update/delivery usecases resolve their
// parent project/lead and then call THESE — there is exactly ONE project-scope checker
// for the whole domain (no divergent copies).
//
// SIDE EFFECTS (notifications, telegram channels, payment/stage recompute, BullMQ) are
// a later migration phase; we invoke the EXISTING implementations via lazy imports so
// observable behavior is preserved without duplicating thousands of lines — the same
// pattern used by the migrated courses + leads modules.
//
// The raw legacy flow functions this facade delegates to (via `legacyDefaults`) live in
// ./project.flows.js (structure-only split). createGroupProjects / assignProjectToUser
// are re-exported here unchanged so their existing deep importers keep working.
import { AppError } from "../../../shared/errors/AppError.js";
import { projectsMessagesCodes } from "@dms/shared";
import { workStageActionsForLead } from "../../leads/lead/lead.workstage-cockpit.js";
import { projectRepository } from "./project.repo.js";
import { groupProjects } from "./project.dto.js";
import { LOCKED_FROM_STATUSES_FOR_NON_ADMIN } from "./project.constants.js";
import { legacyDefaults } from "./project.flows.js";
export {
  createGroupProjects,
  assignProjectToUser,
} from "./project.flows.js";

class ProjectUsecase {
  isAdminUser(authUser) {
    // Authoritative: the resolved current profile's admin-tier flag (from
    // requireAuth) — object scope follows the ACTIVE profile. Falls back to the
    // legacy role/flag computation for raw users without a resolved profile.
    if (typeof authUser?.isAdminTier === "boolean") return authUser.isAdminTier;
    return (
      authUser?.role === "ADMIN" ||
      authUser?.role === "SUPER_ADMIN" ||
      authUser?.currentProfileKey === "SUPER_SALES"
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  SCOPE CHECKERS — the keystone IDOR fix (shared by task/update/delivery)
  // ════════════════════════════════════════════════════════════════════════════
  // Read scope: full-read roles (ADMIN/SUPER_ADMIN/ACCOUNTANT/SUPER_SALES profile) see all;
  // everyone else only projects they are ASSIGNED to. Throws 403 PROJECT_ACCESS_DENIED
  // when the project is outside scope (or does not exist — we do not leak existence to
  // an unauthorized caller).
  async checkIfUserCanAccessProject({ id, authUser }) {
    const where = projectRepository.buildAuthUserProjectWhere({
      authUser,
      where: { id: Number(id) },
      mode: "view",
    });
    const project = await projectRepository.findScopedProject({ where });
    if (!project) throw new AppError(projectsMessagesCodes.PROJECT_ACCESS_DENIED, 403);
    return project;
  }

  // Write scope: stricter — ACCOUNTANT loses full scope here (it was a read-only
  // carve-out in legacy); owned-via-assignment for non-admin.
  async checkIfUserCanMutateProject({ id, authUser }) {
    const where = projectRepository.buildAuthUserProjectWhere({
      authUser,
      where: { id: Number(id) },
      mode: "mutate",
    });
    const project = await projectRepository.findScopedProject({ where });
    if (!project) throw new AppError(projectsMessagesCodes.PROJECT_MUTATE_DENIED, 403);
    return project;
  }

  // user-profile READ scope: GET /user-profile/:userId returns a user's assigned projects
  // INCLUDING full client PII (clientLead.client). Legacy had NO object check — any authed
  // user with PROJECT.LIST could enumerate another employee's projects + client PII (IDOR).
  // Fix: admin-tier callers (the SAME FULL_READ_ROLES/SUPER_SALES-profile set the module uses via
  // repo.hasFullScope) may query ANY userId; everyone else may only query their OWN id.
  async checkIfUserCanAccessUserProfile({ userId, authUser }) {
    const targetId = Number(userId);
    if (projectRepository.hasFullScope(authUser, "view")) return { userId: targetId };
    if (Number(authUser.id) === targetId) return { userId: targetId };
    throw new AppError(projectsMessagesCodes.PROJECT_ACCESS_DENIED, 403);
  }

  // clientLead-keyed READ scope (for project-list-by-lead, groups, updates, archived).
  // Full-read roles pass; a non-privileged user must have at least one project on this
  // lead assigned to them (mirrors the legacy `assignments.some.userId` narrowing).
  async checkIfUserCanAccessLeadProjects({ clientLeadId, authUser }) {
    if (projectRepository.hasFullScope(authUser, "view")) return { clientLeadId: Number(clientLeadId) };
    const allowed = await projectRepository.clientLeadHasAssignedProject({
      clientLeadId,
      userId: authUser.id,
    });
    if (!allowed) throw new AppError(projectsMessagesCodes.PROJECT_ACCESS_DENIED, 403);
    return { clientLeadId: Number(clientLeadId) };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DESIGNER BOARD LISTS (legacy getLeadByPorjects / getLeadByPorjectsColumn)
  // ════════════════════════════════════════════════════════════════════════════
  // Reproduce the legacy ROUTE narrowing exactly: ADMIN/SUPER_ADMIN → isAdmin=true;
  // everyone else → searchParams.userId = self. userRole is always forwarded.
  async getDesigners({ query, authUser }) {
    const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
    const searchParams = { ...query, userRole: authUser.role };
    if (isAdmin) searchParams.isAdmin = true;
    else searchParams.userId = authUser.id;
    return legacyDefaults.getLeadByPorjects({ searchParams, isAdmin });
  }

  async getDesignerColumns({ query, authUser }) {
    const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
    const searchParams = { ...query, userRole: authUser.role };
    if (isAdmin) searchParams.isAdmin = true;
    else searchParams.userId = authUser.id;
    return legacyDefaults.getLeadByPorjectsColumn({ searchParams, isAdmin });
  }

  // GET /designers/:id — lead-by-project detail. Object scope already enforced by the
  // checker; here we reproduce the legacy admin/accountant-vs-self search narrowing.
  async getDesignerLeadDetail({ id, query, authUser }) {
    const { role } = authUser;
    const searchParams = { ...query };
    if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "ACCOUNTANT") {
      searchParams.userId = authUser.id;
    }
    if (role === "ADMIN" || role === "SUPER_ADMIN") searchParams.isAdmin = true;
    const lead = await legacyDefaults.getLeadDetailsByProject(Number(id), searchParams);
    // Attach the caller's own "what do I do next" work-stage actions (designers/executor).
    // Assignment-scoped, computed from the already-scoped lead.projects — no extra query,
    // no lead-IDOR widening.
    if (lead) lead.workStageActions = workStageActionsForLead(lead, authUser.id);
    return lead;
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  PROJECT LIST & DETAIL
  // ════════════════════════════════════════════════════════════════════════════
  // GET / — projects by clientLead. Legacy narrowed non-admin via searchParams.userId;
  // we additionally enforce object scope on the lead (checkIfUserCanAccessLeadProjects)
  // before delegating, since the controller resolved it.
  async listByClientLead({ query, authUser }) {
    const searchParams = { ...query };
    if (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN") {
      searchParams.userId = authUser.id;
    }
    return legacyDefaults.getProjectsByClientLeadId({ searchParams });
  }

  async listArchivedProjects({ query, authUser, skip, limit }) {
    const searchParams = { ...query };
    if (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN") {
      searchParams.userId = authUser.id;
    }
    return this.#archivedFromRepo({ searchParams, skip, take: limit });
  }

  // legacy getArchivedProjects ported into the repo (it is plain Prisma + grouping).
  async #archivedFromRepo({ searchParams, skip, take }) {
    const where = { projects: { some: {} }, status: "ARCHIVED" };
    const filters = JSON.parse(searchParams.filters);
    if (filters && filters !== "undefined" && filters.id) where.id = Number(filters.id);
    if (searchParams.id) where.id = Number(searchParams.id);
    if (searchParams.userId) {
      where.projects.some.assignments = { some: { userId: Number(searchParams.userId) } };
    }
    const { items, total } = await projectRepository.findArchivedLeads({ where, skip, take });
    items.forEach((lead) => {
      lead.groupedProjects = groupProjects(lead.projects);
    });
    return { items, total };
  }

  // GET /user-profile/:userId — projects assigned to a user. Legacy did NOT object-scope
  // this (it returned by the path userId). We keep the legacy semantics but the route
  // requires PROJECT.LIST; the returned set is already assignment-narrowed by userId.
  async getUserProjects({ userId, query, limit, skip }) {
    const searchParams = { ...query, userId };
    return legacyDefaults.getUserProjects(searchParams, Number(limit), Number(skip));
  }

  // GET /:id — project detail. Object scope already enforced by the checker; reproduce
  // the legacy designer/staff self-narrowing.
  async getProject({ id, query, authUser }) {
    const { role } = authUser;
    const searchParams = { ...query };
    if (role === "THREE_D_DESIGNER" || role === "TWO_D_DESIGNER" || role === "STAFF") {
      searchParams.userId = authUser.id;
    }
    return legacyDefaults.getProjectDetailsById({ id: Number(id), searchParams });
  }

  // GET /:leadId/groups — unique project groups for a lead.
  listProjectGroups({ leadId }) {
    return legacyDefaults.getUniqueProjectGroups({ clientLeadId: Number(leadId) });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  MUTATIONS
  // ════════════════════════════════════════════════════════════════════════════
  // PUT /:id — plain field/status edit. Object scope already enforced (mutate). We
  // derive the SERVER-authoritative oldStatus from the scoped row (the checker stashed
  // it on req.scoped) and override any client-supplied oldStatus — a forged oldStatus
  // could bypass the non-admin Completed/Canceled/Rejected lock (workflow-guard fix).
  async updateProject({ id, body, authUser, currentStatus }) {
    const isAdmin = this.isAdminUser(authUser);
    const serverOldStatus =
      currentStatus ?? (await projectRepository.findProjectStatus({ id: Number(id) }))?.status;
    const { oldStatus: _ignored, ...rest } = body;
    return legacyDefaults.updateProject({
      data: { ...rest, id: Number(id), oldStatus: serverOldStatus, isAdmin },
      isAdmin,
    });
  }

  // POST /:id/actions/assign-designer (was PUT /:id/assign-designer).
  async assignDesigner({ id, body }) {
    return legacyDefaults.assignProjectToUser({
      userId: body.designerId,
      projectId: Number(id),
      assignmentId: body.assignmentId,
      deleteDesigner: body.deleteDesigner,
      addToModification: body.addToModification,
      removeFromModification: body.removeFromModification,
      groupId: body.groupId,
    });
  }

  // POST /designers/:leadId/actions/change-status (was PUT /designers/:leadId/status).
  // Legacy called updateProject({ data: req.body, isAdmin }); the project id travels in
  // the body. Object scope is enforced on that body.id via the controller's checker.
  async changeDesignerStatus({ body, authUser, currentStatus }) {
    const isAdmin = this.isAdminUser(authUser);
    const serverOldStatus =
      currentStatus ?? (body.id ? (await projectRepository.findProjectStatus({ id: Number(body.id) }))?.status : undefined);
    const { oldStatus: _ignored, ...rest } = body;
    return legacyDefaults.updateProject({
      data: { ...rest, oldStatus: serverOldStatus, isAdmin },
      isAdmin,
    });
  }

  // ── parent-resolution helpers for the sibling surfaces' scope checks ──────────────
  async resolveProjectClientLead({ projectId }) {
    const row = await projectRepository.findProjectClientLead({ id: projectId });
    if (!row) throw new AppError(projectsMessagesCodes.PROJECT_NOT_FOUND, 404);
    return row;
  }

  async resolveTaskProject({ taskId }) {
    const row = await projectRepository.findTaskParents({ id: taskId });
    if (!row) throw new AppError(projectsMessagesCodes.TASK_NOT_FOUND, 404);
    return row;
  }

  async resolveUpdateClientLead({ updateId }) {
    const row = await projectRepository.findUpdateClientLead({ id: updateId });
    if (!row) throw new AppError(projectsMessagesCodes.UPDATE_NOT_FOUND, 404);
    return row;
  }

  async resolveSharedUpdateClientLead({ sharedUpdateId }) {
    const row = await projectRepository.findSharedUpdateClientLead({ id: sharedUpdateId });
    if (!row || !row.update) throw new AppError(projectsMessagesCodes.SHARED_UPDATE_NOT_FOUND, 404);
    return { ...row, clientLeadId: row.update.clientLeadId };
  }

  async resolveDeliveryProject({ deliveryId }) {
    const row = await projectRepository.findDeliveryProject({ id: deliveryId });
    if (!row || !row.projectId) throw new AppError(projectsMessagesCodes.DELIVERY_NOT_FOUND, 404);
    return row;
  }
}

export const projectUsecase = new ProjectUsecase();
export { ProjectUsecase };
export { LOCKED_FROM_STATUSES_FOR_NON_ADMIN };

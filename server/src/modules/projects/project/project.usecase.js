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
import { AppError } from "../../../shared/errors/AppError.js";
import { projectsMessagesCodes as C } from "@dms/shared";
import { projectRepository } from "./project.repository.js";

// ── Lazy adapters to the not-yet-migrated services (behavior-preserving) ──────────
const legacyDefaults = {
  getLeadByPorjects: (a) => import("../../../../services/main/shared/index.js").then((m) => m.getLeadByPorjects(a)),
  getLeadByPorjectsColumn: (a) => import("../../../../services/main/shared/index.js").then((m) => m.getLeadByPorjectsColumn(a)),
  getLeadDetailsByProject: (...a) => import("../../../../services/main/shared/index.js").then((m) => m.getLeadDetailsByProject(...a)),
  getProjectsByClientLeadId: (a) => import("../../../../services/main/shared/index.js").then((m) => m.getProjectsByClientLeadId(a)),
  getUserProjects: (...a) => import("../../../../services/main/shared/index.js").then((m) => m.getUserProjects(...a)),
  getProjectDetailsById: (a) => import("../../../../services/main/shared/index.js").then((m) => m.getProjectDetailsById(a)),
  updateProject: (a) => import("../../../../services/main/shared/index.js").then((m) => m.updateProject(a)),
  assignProjectToUser: (a) => import("../../../../services/main/shared/index.js").then((m) => m.assignProjectToUser(a)),
  getUniqueProjectGroups: (a) => import("../../../../services/main/shared/index.js").then((m) => m.getUniqueProjectGroups(a)),
};

// Project board statuses a NON-admin user cannot transition AWAY from (legacy
// updateProject rule). Used by the workflow-guard + the dto capability.
const LOCKED_FROM_STATUSES_FOR_NON_ADMIN = ["Completed", "Canceled", "Rejected"];

export class ProjectUsecase {
  /**
   * @param {import("./project.repository.js").ProjectRepository} repository
   * @param {Partial<typeof legacyDefaults>} [legacy]
   */
  constructor(repository, legacy = {}) {
    this.repo = repository;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  isAdminUser(authUser) {
    return (
      authUser?.role === "ADMIN" ||
      authUser?.role === "SUPER_ADMIN" ||
      Boolean(authUser?.isSuperSales)
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  SCOPE CHECKERS — the keystone IDOR fix (shared by task/update/delivery)
  // ════════════════════════════════════════════════════════════════════════════
  // Read scope: full-read roles (ADMIN/SUPER_ADMIN/ACCOUNTANT/isSuperSales) see all;
  // everyone else only projects they are ASSIGNED to. Throws 403 PROJECT_ACCESS_DENIED
  // when the project is outside scope (or does not exist — we do not leak existence to
  // an unauthorized caller).
  async checkIfUserCanAccessProject({ id, authUser }) {
    const where = this.repo.buildAuthUserProjectWhere({
      authUser,
      where: { id: Number(id) },
      mode: "view",
    });
    const project = await this.repo.findScopedProject({ where });
    if (!project) throw new AppError(C.PROJECT_ACCESS_DENIED, 403);
    return project;
  }

  // Write scope: stricter — ACCOUNTANT loses full scope here (it was a read-only
  // carve-out in legacy); owned-via-assignment for non-admin.
  async checkIfUserCanMutateProject({ id, authUser }) {
    const where = this.repo.buildAuthUserProjectWhere({
      authUser,
      where: { id: Number(id) },
      mode: "mutate",
    });
    const project = await this.repo.findScopedProject({ where });
    if (!project) throw new AppError(C.PROJECT_MUTATE_DENIED, 403);
    return project;
  }

  // user-profile READ scope: GET /user-profile/:userId returns a user's assigned projects
  // INCLUDING full client PII (clientLead.client). Legacy had NO object check — any authed
  // user with PROJECT.LIST could enumerate another employee's projects + client PII (IDOR).
  // Fix: admin-tier callers (the SAME FULL_READ_ROLES/isSuperSales set the module uses via
  // repo.hasFullScope) may query ANY userId; everyone else may only query their OWN id.
  async checkIfUserCanAccessUserProfile({ userId, authUser }) {
    const targetId = Number(userId);
    if (this.repo.hasFullScope(authUser, "view")) return { userId: targetId };
    if (Number(authUser.id) === targetId) return { userId: targetId };
    throw new AppError(C.PROJECT_ACCESS_DENIED, 403);
  }

  // clientLead-keyed READ scope (for project-list-by-lead, groups, updates, archived).
  // Full-read roles pass; a non-privileged user must have at least one project on this
  // lead assigned to them (mirrors the legacy `assignments.some.userId` narrowing).
  async checkIfUserCanAccessLeadProjects({ clientLeadId, authUser }) {
    if (this.repo.hasFullScope(authUser, "view")) return { clientLeadId: Number(clientLeadId) };
    const allowed = await this.repo.clientLeadHasAssignedProject({
      clientLeadId,
      userId: authUser.id,
    });
    if (!allowed) throw new AppError(C.PROJECT_ACCESS_DENIED, 403);
    return { clientLeadId: Number(clientLeadId) };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DESIGNER BOARD LISTS (legacy getLeadByPorjects / getLeadByPorjectsColumn)
  // ════════════════════════════════════════════════════════════════════════════
  // Reproduce the legacy ROUTE narrowing exactly: ADMIN/SUPER_ADMIN → isAdmin=true;
  // everyone else → searchParams.userId = self. userRole is always forwarded.
  async designers({ query, authUser }) {
    const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
    const searchParams = { ...query, userRole: authUser.role };
    if (isAdmin) searchParams.isAdmin = true;
    else searchParams.userId = authUser.id;
    return this.legacy.getLeadByPorjects({ searchParams, isAdmin });
  }

  async designerColumns({ query, authUser }) {
    const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
    const searchParams = { ...query, userRole: authUser.role };
    if (isAdmin) searchParams.isAdmin = true;
    else searchParams.userId = authUser.id;
    return this.legacy.getLeadByPorjectsColumn({ searchParams, isAdmin });
  }

  // GET /designers/:id — lead-by-project detail. Object scope already enforced by the
  // checker; here we reproduce the legacy admin/accountant-vs-self search narrowing.
  async designerLeadDetail({ id, query, authUser }) {
    const { role } = authUser;
    const searchParams = { ...query };
    if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "ACCOUNTANT") {
      searchParams.userId = authUser.id;
    }
    if (role === "ADMIN" || role === "SUPER_ADMIN") searchParams.isAdmin = true;
    return this.legacy.getLeadDetailsByProject(Number(id), searchParams);
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
    return this.legacy.getProjectsByClientLeadId({ searchParams });
  }

  async archived({ query, authUser, skip, limit }) {
    const searchParams = { ...query };
    if (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN") {
      searchParams.userId = authUser.id;
    }
    return this.#archivedFromRepo({ searchParams, skip, take: limit });
  }

  // legacy getArchivedProjects ported into the repo (it is plain Prisma + grouping).
  async #archivedFromRepo({ searchParams, skip, take }) {
    const { groupProjects } = await import("../../../../services/main/shared/projectServices.js");
    const where = { projects: { some: {} }, status: "ARCHIVED" };
    const filters = JSON.parse(searchParams.filters);
    if (filters && filters !== "undefined" && filters.id) where.id = Number(filters.id);
    if (searchParams.id) where.id = Number(searchParams.id);
    if (searchParams.userId) {
      where.projects.some.assignments = { some: { userId: Number(searchParams.userId) } };
    }
    const { items, total } = await this.repo.findArchivedLeads({ where, skip, take });
    items.forEach((lead) => {
      lead.groupedProjects = groupProjects(lead.projects);
    });
    return { items, total };
  }

  // GET /user-profile/:userId — projects assigned to a user. Legacy did NOT object-scope
  // this (it returned by the path userId). We keep the legacy semantics but the route
  // requires PROJECT.LIST; the returned set is already assignment-narrowed by userId.
  async userProjects({ userId, query, limit, skip }) {
    const searchParams = { ...query, userId };
    return this.legacy.getUserProjects(searchParams, Number(limit), Number(skip));
  }

  // GET /:id — project detail. Object scope already enforced by the checker; reproduce
  // the legacy designer/staff self-narrowing.
  async getById({ id, query, authUser }) {
    const { role } = authUser;
    const searchParams = { ...query };
    if (role === "THREE_D_DESIGNER" || role === "TWO_D_DESIGNER" || role === "STAFF") {
      searchParams.userId = authUser.id;
    }
    return this.legacy.getProjectDetailsById({ id: Number(id), searchParams });
  }

  // GET /:leadId/groups — unique project groups for a lead.
  groups({ leadId }) {
    return this.legacy.getUniqueProjectGroups({ clientLeadId: Number(leadId) });
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
      currentStatus ?? (await this.repo.findProjectStatus({ id: Number(id) }))?.status;
    const { oldStatus: _ignored, ...rest } = body;
    return this.legacy.updateProject({
      data: { ...rest, id: Number(id), oldStatus: serverOldStatus, isAdmin },
      isAdmin,
    });
  }

  // POST /:id/actions/assign-designer (was PUT /:id/assign-designer).
  async assignDesigner({ id, body }) {
    return this.legacy.assignProjectToUser({
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
      currentStatus ?? (body.id ? (await this.repo.findProjectStatus({ id: Number(body.id) }))?.status : undefined);
    const { oldStatus: _ignored, ...rest } = body;
    return this.legacy.updateProject({
      data: { ...rest, oldStatus: serverOldStatus, isAdmin },
      isAdmin,
    });
  }

  // ── parent-resolution helpers for the sibling surfaces' scope checks ──────────────
  async resolveProjectClientLead({ projectId }) {
    const row = await this.repo.findProjectClientLead({ id: projectId });
    if (!row) throw new AppError(C.PROJECT_NOT_FOUND, 404);
    return row;
  }

  async resolveTaskProject({ taskId }) {
    const row = await this.repo.findTaskParents({ id: taskId });
    if (!row) throw new AppError(C.TASK_NOT_FOUND, 404);
    return row;
  }

  async resolveUpdateClientLead({ updateId }) {
    const row = await this.repo.findUpdateClientLead({ id: updateId });
    if (!row) throw new AppError(C.UPDATE_NOT_FOUND, 404);
    return row;
  }

  async resolveSharedUpdateClientLead({ sharedUpdateId }) {
    const row = await this.repo.findSharedUpdateClientLead({ id: sharedUpdateId });
    if (!row || !row.update) throw new AppError(C.SHARED_UPDATE_NOT_FOUND, 404);
    return { ...row, clientLeadId: row.update.clientLeadId };
  }

  async resolveDeliveryProject({ deliveryId }) {
    const row = await this.repo.findDeliveryProject({ id: deliveryId });
    if (!row || !row.projectId) throw new AppError(C.DELIVERY_NOT_FOUND, 404);
    return row;
  }
}

export const projectUsecase = new ProjectUsecase(projectRepository);
export { LOCKED_FROM_STATUSES_FOR_NON_ADMIN };

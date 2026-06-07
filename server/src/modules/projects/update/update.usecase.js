// projects/update usecase — business logic / orchestration. Prisma NEVER appears here
// (only repo + the shared project-scope usecase). Behavior ported 1:1 from legacy
// (routes/shared/updates.js, services/main/shared/updateServices.js). The heavy update
// flows (authorize/archive/mark-done re-fetch + updateALead) stay in the legacy service
// and are invoked via lazy imports.
//
// Object scope: an update belongs to a ClientLead; access requires the caller to be able
// to access THAT lead's projects (checkIfUserCanAccessLeadProjects on the shared project
// usecase). Sub-resources resolve their parent lead first, then run the same gate — the
// IDOR fix the legacy `/:updateId/*` routes lacked.
import { projectsMessagesCodes as C } from "@dms/shared";
import { updateRepository } from "./update.repository.js";
import { projectUsecase } from "../shared/project-scope.js";

const legacyDefaults = {
  getUpdates: (...a) => import("../../../../services/main/shared/index.js").then((m) => m.getUpdates(...a)),
  getSharedSettings: (a) => import("../../../../services/main/shared/index.js").then((m) => m.getSharedSettings(a)),
  createAnUpdate: (a) => import("../../../../services/main/shared/index.js").then((m) => m.createAnUpdate(a)),
  authorizeDepartmentToUpdate: (a) => import("../../../../services/main/shared/index.js").then((m) => m.authorizeDepartmentToUpdate(a)),
  unAuthorizeDepartmentToUpdate: (a) => import("../../../../services/main/shared/index.js").then((m) => m.unAuthorizeDepartmentToUpdate(a)),
  toggleArchieveAnUpdate: (a) => import("../../../../services/main/shared/index.js").then((m) => m.toggleArchieveAnUpdate(a)),
  toggleArchieveASharedUpdate: (a) => import("../../../../services/main/shared/index.js").then((m) => m.toggleArchieveASharedUpdate(a)),
  markAnUpdateAsDone: (a) => import("../../../../services/main/shared/index.js").then((m) => m.markAnUpdateAsDone(a)),
};

export class UpdateUsecase {
  constructor(repository, projects = projectUsecase, legacy = {}) {
    this.repo = repository;
    this.projects = projects;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  isAdminUser(authUser) {
    return authUser?.role === "ADMIN" || authUser?.role === "SUPER_ADMIN";
  }

  // ── object-scope: gate on the parent clientLead's project assignment ─────────────
  checkIfUserCanAccessLead = ({ clientLeadId, authUser }) =>
    this.projects.checkIfUserCanAccessLeadProjects({ clientLeadId, authUser });

  async checkIfUserCanAccessUpdateById({ updateId, authUser }) {
    const { clientLeadId } = await this.projects.resolveUpdateClientLead({ updateId });
    await this.projects.checkIfUserCanAccessLeadProjects({ clientLeadId, authUser });
    return { updateId: Number(updateId), clientLeadId };
  }

  async checkIfUserCanAccessSharedUpdate({ sharedUpdateId, authUser }) {
    const { clientLeadId } = await this.projects.resolveSharedUpdateClientLead({ sharedUpdateId });
    await this.projects.checkIfUserCanAccessLeadProjects({ clientLeadId, authUser });
    return { sharedUpdateId: Number(sharedUpdateId), clientLeadId };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  UPDATES
  // ════════════════════════════════════════════════════════════════════════════
  // GET /:clientLeadId — list updates for a lead (legacy getUpdates).
  list({ clientLeadId, query, authUser }) {
    const searchParams = { ...query, clientLeadId: Number(clientLeadId) };
    const isAdmin = this.isAdminUser(authUser);
    return this.legacy.getUpdates(searchParams, isAdmin);
  }

  // GET /shared-settings/:updateId.
  sharedSettings({ updateId }) {
    return this.repo.findSharedSettings({ updateId });
  }

  // POST /:clientLeadId — create an update.
  create({ clientLeadId, body, query, authUser }) {
    const searchParams = { ...query };
    return this.legacy.createAnUpdate({
      data: { ...body, clientLeadId: Number(clientLeadId) },
      searchParams,
      userId: authUser.id,
    });
  }

  // ── workflow actions ───────────────────────────────────────────────────────────
  authorize({ updateId, body }) {
    return this.legacy.authorizeDepartmentToUpdate({ type: body.type, updateId: Number(updateId) });
  }

  authorizeShared({ updateId, body }) {
    return this.legacy.unAuthorizeDepartmentToUpdate({ updateId: Number(updateId), type: body.type });
  }

  archive({ updateId, body }) {
    return this.legacy.toggleArchieveAnUpdate({ updateId: Number(updateId), isArchived: body.isArchived });
  }

  archiveShared({ sharedUpdateId, body }) {
    return this.legacy.toggleArchieveASharedUpdate({ sharedUpdateId: Number(sharedUpdateId), isArchived: body.isArchived });
  }

  markDone({ updateId, body }) {
    return this.legacy.markAnUpdateAsDone({
      updateId: Number(updateId),
      clientLeadId: body.clientLeadId,
      isArchived: body.isArchived,
    });
  }
}

export const updateUsecase = new UpdateUsecase(updateRepository);

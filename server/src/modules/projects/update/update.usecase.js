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
import { updateRepository } from "./update.repo.js";
import { projectUsecase } from "../shared/project-scope.js";

// ── update flows ported 1:1 from the legacy shared/legacy/update-services.js. Prisma I/O
// is delegated to updateRepository; the post-write re-fetch (getClientLeadUpdate) and
// updateALead are cross-cluster helpers that STAY in shared-utility-services and are
// invoked here via lazy imports (the target is not one of the projects-owned files).
async function getUpdates(searchParams, isAdmin) {
  const updatesWhere = {
    clientLeadId: Number(searchParams.clientLeadId),
  };
  const sharedUpdatesWhere = {};
  if (!isAdmin) {
    updatesWhere.OR = [
      {
        department: searchParams.type,
        sharedSettings: {
          some: {
            type: searchParams.type,
          },
        },
      },
      {
        sharedSettings: {
          some: {
            type: searchParams.type,
          },
        },
      },
    ];
  }

  if (searchParams.department && isAdmin) {
    updatesWhere.department = searchParams.department;
  }

  return updateRepository.findUpdates({ where: updatesWhere, sharedUpdatesWhere });
}

async function createAnUpdate({ data, searchParams, userId }) {
  const createData = {
    title: data.title,
    createdById: Number(userId),
    clientLeadId: Number(data.clientLeadId),
  };
  if (searchParams.department) {
    createData.department = searchParams.department;
  }

  if (data.description) {
    createData.description = data.description;
  }
  const newUpdate = await updateRepository.createClientLeadUpdate({ data: createData });
  if (data.sharedDepartments) {
    data.sharedDepartments.forEach(async (d) => {
      await updateRepository.createSharedUpdate({
        data: {
          type: d,
          updateId: newUpdate.id,
          excludeFromSearch: d === searchParams.department,
        },
      });
    });
  }
  await updateRepository.touchClientLead({ id: data.clientLeadId });
  const { getClientLeadUpdate } = await import("../../../shared/legacy/shared-utility-services.js");
  return await getClientLeadUpdate(newUpdate.id);
}

async function authorizeDepartmentToUpdate({ type, updateId }) {
  await updateRepository.createSharedUpdate({
    data: {
      type: type,
      updateId: Number(updateId),
    },
  });
  const { getClientLeadUpdate } = await import("../../../shared/legacy/shared-utility-services.js");
  return await getClientLeadUpdate(updateId);
}

async function unAuthorizeDepartmentToUpdate({ updateId, type }) {
  await updateRepository.deleteSharedUpdates({ updateId, type });
  const { getClientLeadUpdate } = await import("../../../shared/legacy/shared-utility-services.js");
  return await getClientLeadUpdate(updateId);
}

async function toggleArchieveAnUpdate({ updateId, isArchived }) {
  await updateRepository.updateClientLeadUpdate({ id: updateId, data: { isArchived } });

  const { getClientLeadUpdate } = await import("../../../shared/legacy/shared-utility-services.js");
  return await getClientLeadUpdate(updateId);
}

async function toggleArchieveASharedUpdate({ sharedUpdateId, isArchived }) {
  const shared = await updateRepository.updateSharedUpdate({
    id: sharedUpdateId,
    data: { isArchived },
  });
  const { getClientLeadUpdate } = await import("../../../shared/legacy/shared-utility-services.js");
  return await getClientLeadUpdate(shared.updateId);
}

async function markAnUpdateAsDone({ updateId, clientLeadId, isArchived }) {
  await updateRepository.updateClientLeadUpdate({
    id: updateId,
    data: {
      updatedAt: new Date(),
      isArchived,
      isDone: true,
    },
  });
  const { updateALead, getClientLeadUpdate } = await import(
    "../../../shared/legacy/shared-utility-services.js"
  );
  await updateALead(Number(clientLeadId));
  return await getClientLeadUpdate(updateId);
}

const legacyDefaults = {
  getUpdates,
  createAnUpdate,
  authorizeDepartmentToUpdate,
  unAuthorizeDepartmentToUpdate,
  toggleArchieveAnUpdate,
  toggleArchieveASharedUpdate,
  markAnUpdateAsDone,
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

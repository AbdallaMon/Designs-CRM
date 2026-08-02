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
import { updateRepository } from "./update.repo.js";
import { projectUsecase } from "../shared/project-scope.js";

// ── update flows ported 1:1 from the legacy shared/legacy/update-services.js. Prisma I/O
// is delegated to updateRepository — including the post-write re-fetch
// (findClientLeadUpdateById, formerly shared-utility `getClientLeadUpdate`) and the
// lead/update "touch" side effects (touchClientLead, formerly shared-utility `updateALead`),
// now owned by the update repo. The former shared/legacy lazy imports are gone.
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
  return await updateRepository.findClientLeadUpdateById({ updateId: newUpdate.id });
}

async function authorizeDepartmentToUpdate({ type, updateId }) {
  await updateRepository.createSharedUpdate({
    data: {
      type: type,
      updateId: Number(updateId),
    },
  });
  return await updateRepository.findClientLeadUpdateById({ updateId });
}

async function unAuthorizeDepartmentToUpdate({ updateId, type }) {
  await updateRepository.deleteSharedUpdates({ updateId, type });
  return await updateRepository.findClientLeadUpdateById({ updateId });
}

async function toggleArchieveAnUpdate({ updateId, isArchived }) {
  await updateRepository.updateClientLeadUpdate({ id: updateId, data: { isArchived } });

  return await updateRepository.findClientLeadUpdateById({ updateId });
}

async function toggleArchieveASharedUpdate({ sharedUpdateId, isArchived }) {
  const shared = await updateRepository.updateSharedUpdate({
    id: sharedUpdateId,
    data: { isArchived },
  });
  return await updateRepository.findClientLeadUpdateById({ updateId: shared.updateId });
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
  await updateRepository.touchClientLead({ id: clientLeadId });
  return await updateRepository.findClientLeadUpdateById({ updateId });
}

export const updateOperations = {
  getUpdates,
  createAnUpdate,
  authorizeDepartmentToUpdate,
  unAuthorizeDepartmentToUpdate,
  toggleArchieveAnUpdate,
  toggleArchieveASharedUpdate,
  markAnUpdateAsDone,
};

class UpdateUsecase {
  isAdminUser(authUser) {
    return Boolean(authUser?.isAdminTier);
  }

  // ── object-scope: gate on the parent clientLead's project assignment ─────────────
  checkIfUserCanAccessLead = ({ clientLeadId, authUser }) =>
    projectUsecase.checkIfUserCanAccessLeadProjects({ clientLeadId, authUser });

  async checkIfUserCanAccessUpdateById({ updateId, authUser }) {
    const { clientLeadId } = await projectUsecase.resolveUpdateClientLead({ updateId });
    await projectUsecase.checkIfUserCanAccessLeadProjects({ clientLeadId, authUser });
    return { updateId: Number(updateId), clientLeadId };
  }

  async checkIfUserCanAccessSharedUpdate({ sharedUpdateId, authUser }) {
    const { clientLeadId } = await projectUsecase.resolveSharedUpdateClientLead({ sharedUpdateId });
    await projectUsecase.checkIfUserCanAccessLeadProjects({ clientLeadId, authUser });
    return { sharedUpdateId: Number(sharedUpdateId), clientLeadId };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  UPDATES
  // ════════════════════════════════════════════════════════════════════════════
  // GET /:clientLeadId — list updates for a lead (legacy getUpdates).
  listUpdates({ clientLeadId, query, authUser }) {
    const searchParams = { ...query, clientLeadId: Number(clientLeadId) };
    const isAdmin = this.isAdminUser(authUser);
    return updateOperations.getUpdates(searchParams, isAdmin);
  }

  // GET /shared-settings/:updateId.
  getSharedSettings({ updateId }) {
    return updateRepository.findSharedSettings({ updateId });
  }

  // POST /:clientLeadId — create an update.
  createUpdate({ clientLeadId, body, query, authUser }) {
    const searchParams = { ...query };
    return updateOperations.createAnUpdate({
      data: { ...body, clientLeadId: Number(clientLeadId) },
      searchParams,
      userId: authUser.id,
    });
  }

  // ── workflow actions ───────────────────────────────────────────────────────────
  authorize({ updateId, body }) {
    return updateOperations.authorizeDepartmentToUpdate({ type: body.type, updateId: Number(updateId) });
  }

  authorizeShared({ updateId, body }) {
    return updateOperations.unAuthorizeDepartmentToUpdate({ updateId: Number(updateId), type: body.type });
  }

  archive({ updateId, body }) {
    return updateOperations.toggleArchieveAnUpdate({ updateId: Number(updateId), isArchived: body.isArchived });
  }

  archiveShared({ sharedUpdateId, body }) {
    return updateOperations.toggleArchieveASharedUpdate({ sharedUpdateId: Number(sharedUpdateId), isArchived: body.isArchived });
  }

  markDone({ updateId, body }) {
    return updateOperations.markAnUpdateAsDone({
      updateId: Number(updateId),
      clientLeadId: body.clientLeadId,
      isArchived: body.isArchived,
    });
  }
}

export const updateUsecase = new UpdateUsecase();
export { UpdateUsecase };

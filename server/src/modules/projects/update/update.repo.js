// projects/update repository — Prisma I/O ONLY. The update read/write flows ported from
// the legacy updateServices live here as thin Prisma methods; the orchestration (which
// re-fetches via the cross-cluster shared-utility getClientLeadUpdate / updateALead) stays
// in the usecase. Behavior-preserving: every query object is copied verbatim.
import prisma from "../../../infra/prisma/prisma.js";

class UpdateRepository {
  model = prisma.clientLeadUpdate;

  // GET /shared-settings/:updateId — legacy getSharedSettings.
  findSharedSettings({ updateId }) {
    return prisma.sharedUpdate.findMany({ where: { updateId: Number(updateId) } });
  }

  // GET /:clientLeadId list — legacy getUpdates findMany. `where` + `sharedUpdatesWhere`
  // are built in the usecase from searchParams/isAdmin.
  findUpdates({ where, sharedUpdatesWhere }) {
    return prisma.clientLeadUpdate.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        sharedSettings: {
          where: sharedUpdatesWhere,
        },
      },
    });
  }

  createClientLeadUpdate({ data }) {
    return prisma.clientLeadUpdate.create({ data });
  }

  createSharedUpdate({ data }) {
    return prisma.sharedUpdate.create({ data });
  }

  // Bump a clientLead's updatedAt (create-an-update side effect).
  touchClientLead({ id }) {
    return prisma.clientLead.update({
      where: { id: Number(id) },
      data: { updatedAt: new Date() },
    });
  }

  updateClientLeadUpdate({ id, data }) {
    return prisma.clientLeadUpdate.update({ where: { id: Number(id) }, data });
  }

  deleteSharedUpdates({ updateId, type }) {
    return prisma.sharedUpdate.deleteMany({
      where: { updateId: Number(updateId), type },
    });
  }

  updateSharedUpdate({ id, data }) {
    return prisma.sharedUpdate.update({
      where: { id: Number(id) },
      data,
      select: { updateId: true },
    });
  }

  // Re-fetch an update with its shared settings (legacy shared-utility `getClientLeadUpdate`,
  // relocated to its owner module — the post-write re-read every update flow returns).
  findClientLeadUpdateById({ updateId }) {
    return prisma.clientLeadUpdate.findUnique({
      where: { id: Number(updateId) },
      include: { sharedSettings: true },
    });
  }

  // Bump a clientLeadUpdate's updatedAt (legacy shared-utility `updateAClientLeadUpdate`).
  touchClientLeadUpdate({ id }) {
    return prisma.clientLeadUpdate.update({
      where: { id: Number(id) },
      data: { updatedAt: new Date() },
    });
  }
}

export const updateRepository = new UpdateRepository();
export { UpdateRepository };

import prisma from "../../../prisma/prisma.js";

export async function getUpdates(searchParams, isAdmin) {
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

  const updates = await prisma.clientLeadUpdate.findMany({
    where: updatesWhere,
    orderBy: { updatedAt: "desc" },
    include: {
      sharedSettings: {
        where: sharedUpdatesWhere,
      },
    },
  });

  return updates;
}

export async function getSharedSettings(updateId) {
  return prisma.sharedUpdate.findMany({
    where: {
      updateId: Number(updateId),
    },
  });
}

export async function createAnUpdate({ data, searchParams, userId }) {
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
  const newUpdate = await prisma.clientLeadUpdate.create({
    data: createData,
  });
  if (data.sharedDepartments) {
    data.sharedDepartments.forEach(async (d) => {
      await prisma.sharedUpdate.create({
        data: {
          type: d,
          updateId: newUpdate.id,
          excludeFromSearch: d === searchParams.department,
        },
      });
    });
  }
  await prisma.clientLead.update({
    where: {
      id: Number(data.clientLeadId),
    },
    data: {
      updatedAt: new Date(),
    },
  });
  const { getClientLeadUpdate } = await import("./utilityServices.js");
  return await getClientLeadUpdate(newUpdate.id);
}

export async function authorizeDepartmentToUpdate({ type, updateId }) {
  await prisma.sharedUpdate.create({
    data: {
      type: type,
      updateId: Number(updateId),
    },
  });
  const { getClientLeadUpdate } = await import("./utilityServices.js");
  return await getClientLeadUpdate(updateId);
}

export async function unAuthorizeDepartmentToUpdate({ updateId, type }) {
  await prisma.sharedUpdate.deleteMany({
    where: { updateId: Number(updateId), type: type },
  });
  const { getClientLeadUpdate } = await import("./utilityServices.js");
  return await getClientLeadUpdate(updateId);
}

export async function toggleArchieveAnUpdate({ updateId, isArchived }) {
  await prisma.clientLeadUpdate.update({
    where: { id: Number(updateId) },
    data: {
      isArchived,
    },
  });

  const { getClientLeadUpdate } = await import("./utilityServices.js");
  return await getClientLeadUpdate(updateId);
}

export async function toggleArchieveASharedUpdate({
  sharedUpdateId,
  isArchived,
}) {
  const shared = await prisma.sharedUpdate.update({
    where: { id: Number(sharedUpdateId) },
    data: { isArchived },
    select: {
      updateId: true,
    },
  });
  const { getClientLeadUpdate } = await import("./utilityServices.js");
  return await getClientLeadUpdate(shared.updateId);
}

export async function markAnUpdateAsDone({
  updateId,
  clientLeadId,
  isArchived,
}) {
  await prisma.clientLeadUpdate.update({
    where: {
      id: Number(updateId),
    },
    data: {
      updatedAt: new Date(),
      isArchived,
      isDone: true,
    },
  });
  const { updateALead, getClientLeadUpdate } = await import(
    "./utilityServices.js"
  );
  await updateALead(Number(clientLeadId));
  return await getClientLeadUpdate(updateId);
}

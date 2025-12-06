import prisma from "../../../prisma/prisma.js";

export async function getSalesStages({ clientLeadId }) {
  return await prisma.SalesStage.findMany({
    where: {
      clientLeadId: Number(clientLeadId),
    },
  });
}
export async function getUniqueStage({ key = "id", id, stage }) {
  return await prisma.SalesStage.findUnique({
    where: {
      [key]: [key === "id" ? Number(id) : SalesStage],
    },
  });
}

export async function editSalesSage({
  curentStageType,
  clientLeadId,
  nextStage,
  action,
}) {
  clientLeadId = Number(clientLeadId);
  if (nextStage && nextStage.key !== "NOT_INITIATED") {
    const isPresent = await prisma.salesStage.findUnique({
      where: {
        clientLeadId_stage: {
          clientLeadId,
          stage: nextStage.key,
        },
      },
    });

    if (!isPresent) {
      await prisma.SalesStage.create({
        data: {
          stage: nextStage.key,
          clientLeadId,
        },
      });
    }
  }
  if (action === "back" && curentStageType !== "NOT_INITIATED") {
    await prisma.salesStage.delete({
      where: {
        clientLeadId_stage: {
          clientLeadId,
          stage: curentStageType,
        },
      },
    });
  }
  return true;
}

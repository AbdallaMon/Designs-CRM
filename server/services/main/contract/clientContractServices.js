import prisma from "../../../prisma/prisma.js";
import { getDefaultContractDataAndGenerateIfNotFound } from "./generateDefaultContractData.js";
export async function getDefaultContractUtilityData(lng) {
  try {
    let contractUtility = await getDefaultContractDataAndGenerateIfNotFound({
      dontGenerate: true,
    });

    return contractUtility;
  } catch (e) {
    console.error("Error in getDefaultContractUtilityData:", e);
  }
}
export async function getContractSessionByToken({ token }) {
  console.log(token, " token in service");
  const session = await prisma.contract.findUnique({
    where: { arToken: token },
    include: {
      stages: {
        orderBy: { order: "asc" },
      },
      paymentsNew: {
        include: {
          project: true,
          conditionItem: true,
        },
      },
      drawings: true,
      specialItems: true,
      clientLead: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error("Session not found or expired");
  }

  return session;
}

export async function changeContractSessionStatus({
  token,
  id,
  sessionStatus,
  extra,
}) {
  const key = token ? "arToken" : "id";
  const keyId = token || Number(id);

  return await prisma.contract.update({
    where: {
      [key]: keyId,
    },
    data: {
      sessionStatus,
      ...(extra && extra),
    },
  });
}

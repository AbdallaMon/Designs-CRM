import prisma from "../../../infra/prisma/prisma.js";
import { getDefaultContractDataAndGenerateIfNotFound } from "../services/generate-default-contract-data.js";
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
  // arToken/enToken are not declared @unique on the (prod-reconciled) schema, so
  // findUnique on them is rejected by Prisma. Tokens are per-contract UUIDs, so
  // findFirst on either token is equivalent — resolve by whichever token matches.
  const session = await prisma.contract.findFirst({
    where: { OR: [{ arToken: token }, { enToken: token }] },
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
    return null;
  }

  return session;
}

export async function changeContractSessionStatus({
  token,
  id,
  sessionStatus,
  extra,
}) {
  // arToken/enToken are not @unique on the reconciled schema, so update-by-token
  // must resolve the row id first (findFirst on the token), then update by id.
  let contractId = Number(id);
  if (token) {
    const found = await prisma.contract.findFirst({
      where: { OR: [{ arToken: token }, { enToken: token }] },
      select: { id: true },
    });
    if (!found) return null;
    contractId = found.id;
  }

  return await prisma.contract.update({
    where: {
      id: contractId,
    },
    data: {
      sessionStatus,
      ...(extra && extra),
    },
  });
}

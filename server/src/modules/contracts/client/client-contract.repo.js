import { CONTRACT_SESSION_STATUSES } from "@dms/shared";
import prisma from "../../../infra/prisma/prisma.js";
import { getDefaultContractDataAndGenerateIfNotFound } from "../services/generate-default-contract-data.js";

const PUBLIC_SESSION_SELECT = {
  id: true,
  arToken: true,
  sessionStatus: true,
  pdfLinkAr: true,
  pdfLinkEn: true,
  title: true,
  enTitle: true,
  amount: true,
  taxRate: true,
  totalAmount: true,
  stages: {
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      order: true,
      deliveryDays: true,
      stageStatus: true,
    },
  },
  paymentsNew: {
    select: {
      id: true,
      amount: true,
      conditionItem: { select: { labelAr: true, labelEn: true } },
    },
  },
  drawings: { select: { id: true, url: true, fileName: true } },
  specialItems: { select: { id: true, labelAr: true, labelEn: true } },
  clientLead: {
    select: {
      id: true,
      code: true,
      emirate: true,
      country: true,
      client: {
        select: {
          name: true,
          arName: true,
          enName: true,
          phone: true,
          email: true,
        },
      },
    },
  },
};

const tokenWhere = (token) => ({ OR: [{ arToken: token }, { enToken: token }] });

export async function getDefaultContractUtilityData() {
  try {
    return await getDefaultContractDataAndGenerateIfNotFound({ dontGenerate: true });
  } catch (error) {
    console.error("Error in getDefaultContractUtilityData:", error);
    return null;
  }
}

export function getContractSessionByToken({ token }) {
  return prisma.contract.findFirst({
    where: tokenWhere(token),
    select: PUBLIC_SESSION_SELECT,
  });
}

export async function transitionContractSessionStatus({ contractId, fromStatus, toStatus }) {
  const changed = await prisma.contract.updateMany({
    where: { id: Number(contractId), sessionStatus: fromStatus },
    data: { sessionStatus: toStatus },
  });
  if (changed.count !== 1) return null;
  return prisma.contract.findUnique({
    where: { id: Number(contractId) },
    select: PUBLIC_SESSION_SELECT,
  });
}

export async function setContractSigningSignature({ contractId, signatureUrl }) {
  const changed = await prisma.contract.updateMany({
    where: { id: Number(contractId), sessionStatus: CONTRACT_SESSION_STATUSES.SIGNING },
    data: { signatureUrl },
  });
  return changed.count === 1;
}

export async function completeContractFinalization({ contractId }) {
  const changed = await prisma.contract.updateMany({
    where: { id: Number(contractId), sessionStatus: CONTRACT_SESSION_STATUSES.SIGNING },
    data: { sessionStatus: CONTRACT_SESSION_STATUSES.REGISTERED, writtenAt: new Date() },
  });
  return changed.count === 1;
}

export function runWithContractFinalizationLock({ contractId, task }) {
  const lockKey = `contract-pdf-finalize:${Number(contractId)}`;
  return prisma.$transaction(
    async (db) => {
      const rows = await db.$queryRaw`SELECT GET_LOCK(${lockKey}, 30) AS acquired`;
      if (Number(rows?.[0]?.acquired) !== 1) {
        throw new Error("CONTRACT_FINALIZATION_LOCK_UNAVAILABLE");
      }
      try {
        return await task();
      } finally {
        await db.$queryRaw`SELECT RELEASE_LOCK(${lockKey}) AS released`;
      }
    },
    { maxWait: 35_000, timeout: 300_000 },
  );
}

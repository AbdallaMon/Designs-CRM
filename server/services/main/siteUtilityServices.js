import prisma from "../../prisma/prisma.js";

export async function getPdfSiteUtilities() {
  let siteUtility = await prisma.siteUtility.findUnique({
    where: {
      id: 1,
    },
  });
  if (!siteUtility) {
    siteUtility = await prisma.siteUtility.create({
      data: { id: 1 },
    });
    return;
  }
  return siteUtility;
}

export async function updatePdfSiteUtilities({ data }) {
  await prisma.siteUtility.update({
    where: {
      id: 1,
    },
    data,
  });
  return true;
}

export async function getContractPaymentConditions() {
  const contractPaymentConditions =
    await prisma.contractPaymentCondition.findMany();
  return contractPaymentConditions;
}
export async function createContractPaymentConditions({ data }) {
  if (data.condition === "To Do") {
    throw new Error("Condition 'To Do' cannot be used.");
  }
  const contractPaymentConditions =
    await prisma.contractPaymentCondition.create({
      data,
    });
  return contractPaymentConditions;
}

export async function updateContractPaymentConditions({ id, data }) {
  const contractPaymentConditions =
    await prisma.contractPaymentCondition.update({
      where: { id: id },
      data,
    });
  return contractPaymentConditions;
}

export async function deleteContractPaymentConditions({ id }) {
  const checkIfRelatedRecords = await prisma.contractPayment.findFirst({
    where: { conditionId: id },
  });
  if (checkIfRelatedRecords) {
    throw new Error(
      "Cannot delete contract payment conditions as they are linked to existing contract payments."
    );
  }
  await prisma.contractPaymentCondition.delete({
    where: { id: id },
  });
  return true;
}

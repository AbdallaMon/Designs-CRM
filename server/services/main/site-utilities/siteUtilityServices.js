import prisma from "../../../prisma/prisma.js";
import { getDefaultContractDataAndGenerateIfNotFound } from "../contract/generateDefaultContractData.js";

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

// contract utilities

// 1. API: GET "/obligations"
//    - Purpose: Fetch the obligations of both parties in Arabic and English.
//    - Expected Payload: None
//    - POST/PUT: "/obligations"
//      - Purpose: Save or update the obligations of both parties.
//      - Expected Payload:
//        {
//          obligationsPartyOneAr: string,
//          obligationsPartyOneEn: string,
//          obligationsPartyTwoAr: string,
//          obligationsPartyTwoEn: string
//        }
// 2. API: GET "/stage-clauses"
//    - Purpose: Fetch the list of stage clauses.
//    - Expected Payload: None
//    - POST: "/stage-clauses"
//      - Purpose: Add a new stage clause.
//      - Expected Payload:
//        {
//          headingAr: string,
//          headingEn: string,
//          titleAr: string,
//          titleEn: string,
//          descriptionAr: string,
//          descriptionEn: string,
//          order: number
//        }
//    - PUT: "/stage-clauses/{clauseId}"
//      - Purpose: Update an existing stage clause.
//      - Expected Payload:
//        {
//          headingAr: string,
//          headingEn: string,
//          titleAr: string,
//          titleEn: string,
//          descriptionAr: string,
//          descriptionEn: string,
//          order: number
//        }
//    - DELETE: "/stage-clauses/{clauseId}"
//      - Purpose: Delete a specific stage clause.
//      - Expected Payload: None
// 3. API: GET "/special-clauses"
//    - Purpose: Fetch the list of special clauses.
//    - Expected Payload: None
//    - POST: "/special-clauses"
//      - Purpose: Add a new special clause.
//      - Expected Payload:
//        {
//          textAr: string,
//          textEn: string,
//          order: number,
//          isActive: boolean
//        }
//    - PUT: "/special-clauses/{clauseId}"
//      - Purpose: Update an existing special clause.
//      - Expected Payload:
//        {
//          textAr: string,
//          textEn: string,
//          order: number,
//          isActive: boolean
//        }
//    - DELETE: "/special-clauses/{clauseId}"
//      - Purpose: Delete a specific special clause.
//      - Expected Payload: None
// 4. API: GET "/level-clauses"
//    - Purpose: Fetch the list of level clauses categorized by contract levels.
//    - Expected Payload: None
//    - POST: "/level-clauses"
//      - Purpose: Add a new level clause.
//      - Expected Payload:
//        {
//          level: string (e.g., "LEVEL_1"),
//          textAr: string,
//          textEn: string,
//          order: number,
//          isActive: boolean
//        }
//    - PUT: "/level-clauses/{clauseId}"
//      - Purpose: Update an existing level clause.
//      - Expected Payload:
//        {
//          level: string (e.g., "LEVEL_1"),
//          textAr: string,
//          textEn: string,
//          order: number,
//          isActive: boolean
//        }

export async function getContractUtilityData() {
  let contractUtility = await getDefaultContractDataAndGenerateIfNotFound({
    dontGenerate: true,
  });

  return contractUtility;
}

export async function updateContractUtilityData({ data }) {
  let contractUtility = await prisma.contractUtility.findFirst({});
  if (!contractUtility) {
    contractUtility = await prisma.contractUtility.create({
      data,
    });
    return contractUtility;
  }
  contractUtility = await prisma.contractUtility.update({
    where: { id: contractUtility.id },
    data,
  });
  return contractUtility;
}

export async function getContractStageClauses() {
  const stageClauses = await prisma.contractStageClauseTemplate.findMany({
    orderBy: { order: "asc" },
  });
  return stageClauses;
}
export async function createContractStageClause({ data }) {
  let contractUtility = await prisma.contractUtility.findFirst({});
  data.contractUtilityId = contractUtility.id;
  const stageClause = await prisma.contractStageClauseTemplate.create({
    data,
  });
  return stageClause;
}
export async function updateContractStageClause({ id, data }) {
  const stageClause = await prisma.contractStageClauseTemplate.update({
    where: { id: Number(id) },
    data,
  });
  return stageClause;
}
export async function deleteContractStageClause({ id }) {
  await prisma.contractStageClauseTemplate.delete({
    where: { id: Number(id) },
  });
  return true;
}

export async function getContractSpecialClauses() {
  const specialClauses = await prisma.contractSpecialClauseTemplate.findMany({
    orderBy: { order: "asc" },
  });
  return specialClauses;
}
export async function createContractSpecialClause({ data }) {
  let contractUtility = await prisma.contractUtility.findFirst({});
  data.contractUtilityId = contractUtility.id;
  const specialClause = await prisma.contractSpecialClauseTemplate.create({
    data,
  });
  return specialClause;
}
export async function updateContractSpecialClause({ id, data }) {
  const specialClause = await prisma.contractSpecialClauseTemplate.update({
    where: { id: Number(id) },
    data,
  });
  return specialClause;
}
export async function deleteContractSpecialClause({ id }) {
  await prisma.contractSpecialClauseTemplate.delete({
    where: { id: Number(id) },
  });
  return true;
}

export async function getContractLevelClauses() {
  const levelClauses = await prisma.contractLevelClauseTemplate.findMany({
    orderBy: { order: "asc" },
  });
  return levelClauses;
}
export async function createContractLevelClause({ data }) {
  let contractUtility = await prisma.contractUtility.findFirst({});
  data.contractUtilityId = contractUtility.id;
  const levelClause = await prisma.contractLevelClauseTemplate.create({
    data,
  });
  return levelClause;
}
export async function updateContractLevelClause({ id, data }) {
  const levelClause = await prisma.contractLevelClauseTemplate.update({
    where: { id: Number(id) },
    data,
  });
  return levelClause;
}

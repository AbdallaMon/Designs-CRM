import prisma from "../../../prisma/prisma.js";
import {
  HANDWRITTEN_SPECIAL_CLAUSES,
  OBLIGATIONS_TEXT,
  STAGE_CLAUSES_DEFAULT,
  STAGE_PROGRESS,
} from "./wittenBlocksData.js";

export async function getDefaultContractDataAndGenerateIfNotFound({
  dontGenerate = true,
}) {
  let contractUtilityData = await prisma.ContractUtility.findFirst({
    include: {
      stageClauses: {
        orderBy: { order: "asc" },
      },
      specialClauses: {
        orderBy: { order: "asc" },
      },
      levelClauses: {
        orderBy: { order: "asc" },
      },
    },
  });
  console.log("contractUtilityData", contractUtilityData);
  if (dontGenerate) return contractUtilityData;
  if (
    contractUtilityData?.stageClauses?.length < 1 ||
    contractUtilityData?.specialClauses?.length < 1 ||
    contractUtilityData?.levelClauses?.length < 1
  ) {
    await prisma.ContractLevelClauseTemplate.deleteMany({});
    await prisma.ContractStageClauseTemplate.deleteMany({});
    await prisma.ContractSpecialClauseTemplate.deleteMany({});
    await prisma.ContractUtility.deleteMany({});
    contractUtilityData = null;
  }
  if (!contractUtilityData) {
    await generateDefaultContractData();
    return await prisma.ContractUtility.findFirst({
      include: {
        stageClauses: {
          orderBy: { order: "asc" },
        },
        specialClauses: {
          orderBy: { order: "asc" },
        },
        levelClauses: {
          orderBy: { order: "asc" },
        },
      },
    });
  }
  return contractUtilityData;
}
async function generateDefaultContractData() {
  const contractUtility = await prisma.ContractUtility.create({
    data: {
      obligationsPartyOneAr: OBLIGATIONS_TEXT.partyOne.ar,
      obligationsPartyOneEn: OBLIGATIONS_TEXT.partyOne.en,
      obligationsPartyTwoAr: OBLIGATIONS_TEXT.partyTwo.ar,
      obligationsPartyTwoEn: OBLIGATIONS_TEXT.partyTwo.en,
    },
  });
  const stageClauses = await generateDefaultStagesClauses(contractUtility.id);
  const contractLevelClauses = await generateDefaultContractLevelClauseTemplate(
    contractUtility.id
  );
  const specialClauses = await generateDefaultContractSpecialClauses(
    contractUtility.id
  );
  return contractUtility;
}
async function generateDefaultStagesClauses(contractStageId) {
  for (const stage of Object.keys(STAGE_CLAUSES_DEFAULT)) {
    const clauseData = STAGE_CLAUSES_DEFAULT[stage];
    await prisma.ContractStageClauseTemplate.create({
      data: {
        contractUtilityId: contractStageId,
        headingAr: clauseData.ar.heading,
        headingEn: clauseData.en.heading,
        titleAr: clauseData.ar.title,
        titleEn: clauseData.en.title,
        descriptionAr: clauseData.ar.description,
        descriptionEn: clauseData.en.description,
        order: Number(stage),
      },
    });
  }
}

async function generateDefaultContractLevelClauseTemplate(contractUtilityId) {
  for (const stage of Object.keys(STAGE_PROGRESS)) {
    const level = `LEVEL_${stage}`;
    const clauseData = STAGE_PROGRESS[stage];
    await prisma.ContractLevelClauseTemplate.create({
      data: {
        contractUtilityId: contractUtilityId,
        textAr: clauseData.ar,
        textEn: clauseData.en,
        order: Number(stage),
        level: level,
      },
    });
  }
}
async function generateDefaultContractSpecialClauses(contractUtilityId) {
  let order = 0;
  for (const clause of HANDWRITTEN_SPECIAL_CLAUSES.ar) {
    const index = Number(order);
    await prisma.ContractSpecialClauseTemplate.create({
      data: {
        contractUtilityId: contractUtilityId,
        textAr: HANDWRITTEN_SPECIAL_CLAUSES.ar[index],
        textEn: HANDWRITTEN_SPECIAL_CLAUSES.en[index],
        order: index,
      },
    });
    order++;
  }
}

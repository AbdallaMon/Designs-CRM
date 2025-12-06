import prisma from "../../../prisma/prisma.js";

const LEVEL_ORDER = {
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
  LEVEL_4: 4,
  LEVEL_5: 5,
  LEVEL_6: 6,
  LEVEL_7: 7,
};

export async function getContractForLead({ clientLeadId }) {
  const contracts = await prisma.contract.findMany({
    where: { clientLeadId: Number(clientLeadId) },
  });

  const grouped = contracts.reduce((acc, contract) => {
    if (!acc[contract.purpose]) acc[contract.purpose] = [];
    acc[contract.purpose].push(contract);
    return acc;
  }, {});

  return grouped;
}

export async function createNewContract({
  purpose,
  contractLevel,
  clientLeadId,
  title,
  startDate,
  endDate,
}) {
  const data = {
    clientLeadId: Number(clientLeadId),
    purpose,
  };
  if (title) {
    data.title = title;
  }
  if (startDate) {
    data.startDate = new Date(startDate);
  }
  if (endDate) {
    data.endDate = new Date(endDate);
  }
  contractLevel.forEach(async (level, index) => {
    const isPresent = await prisma.contract.findFirst({
      where: {
        contractLevel: level,
        purpose: purpose,
        clientLeadId: Number(clientLeadId),
      },
    });
    if (isPresent) {
      return;
    }
    await prisma.contract.create({
      data: { ...data, contractLevel: level },
    });
  });

  return true;
}

export async function editContract({ id, title, startDate, endDate }) {
  const data = {};
  if (title) {
    data.title = title;
  }
  if (startDate) {
    data.startDate = new Date(startDate);
  }
  if (endDate) {
    data.endDate = new Date(endDate);
  }
  const updatedContract = await prisma.contract.update({
    where: { id: Number(id) },
    data,
  });
  return updatedContract;
}

export async function deleteContract({ contractId }) {
  const deletedContract = await prisma.contract.delete({
    where: { id: Number(contractId) },
  });
  return deletedContract;
}

export async function markAsCurrent({ contractId, isInProgress }) {
  const current = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!current) return;

  const allContracts = await prisma.contract.findMany({
    where: {
      clientLeadId: current.clientLeadId,
      purpose: current.purpose,
    },
  });

  const currentLevelNum = LEVEL_ORDER[current.contractLevel];

  const updates = allContracts.map((contract) => {
    const levelNum = LEVEL_ORDER[contract.contractLevel];
    if (levelNum < currentLevelNum) {
      return prisma.contract.update({
        where: { id: contract.id },
        data: {
          isCompleted: true,
          isInProgress: false,
        },
      });
    }
    if (levelNum === currentLevelNum) {
      return prisma.contract.update({
        where: { id: contract.id },
        data: {
          isInProgress: isInProgress,
          isCompleted: false,
        },
      });
    }
    if (levelNum > currentLevelNum) {
      return prisma.contract.update({
        where: { id: contract.id },
        data: {
          isCompleted: false,
          isInProgress: false,
        },
      });
    }
  });

  await prisma.$transaction(updates);
}

export async function markAsCompleted({ contractId, isCompleted }) {
  const current = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!current) return;

  const allContracts = await prisma.contract.findMany({
    where: {
      clientLeadId: current.clientLeadId,
      purpose: current.purpose,
    },
  });

  const currentLevelNum = LEVEL_ORDER[current.contractLevel];

  const updates = allContracts.map((contract) => {
    const levelNum = LEVEL_ORDER[contract.contractLevel];
    if (levelNum <= currentLevelNum) {
      return prisma.contract.update({
        where: { id: contract.id },
        data: {
          isCompleted: true,
          isInProgress: false,
        },
      });
    } else {
      return prisma.contract.update({
        where: { id: contract.id },
        data: {
          isCompleted: false,
          isInProgress: false,
        },
      });
    }
  });

  await prisma.$transaction(updates);
}

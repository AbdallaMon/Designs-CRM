import prisma from "../../../prisma/prisma.js";
import { v4 as uuidv4 } from "uuid";
import { buildAndUploadContractPdf } from "./generateContractPdf.js";

export async function getLeadContractList({ leadId }) {
  const where = {
    clientLeadId: Number(leadId),
  };
  const contracts = await prisma.contract.findMany({
    where,
    include: {
      stages: {
        orderBy: { order: "asc" },
      },
    },
  });
  for (const contract of contracts) {
    const currentStage = contract.stages.find(
      (s) => s.stageStatus === "IN_PROGRESS"
    );
    contract.level = currentStage ? currentStage.title : null;
  }

  return contracts;
}

async function validatePayments(payments) {
  {
    if (payments.length === 0)
      throw new Error("You have to add at least one payment");
  }
  if (!payments.every((payment) => payment.amount > 0))
    throw new Error("You have to add amount > 0 for each payment");
  if (!payments.every((payment) => payment.condition !== "To Do")) {
    throw new Error(
      "You cant select this condition as it is the project initial condition by default"
    );
  }
}
async function validateStages(stages) {
  {
    if (stages.length === 0)
      throw new Error("You have to add at least one contract level");
  }
  if (
    !stages.every(
      (stage) => stage.deliveryDays > 0 && stage.deptDeliveryDays > 0
    )
  )
    throw new Error(
      "You have to both delivery days and staff delivery days for each level"
    );
}
export async function createContract({ payload }) {
  try {
    const {
      clientLeadId,
      drawings,
      payments,
      projectGroupId,
      specialItems,
      stages,
      title,
      enTitle,
      arName,
      enName,
    } = payload;

    const taxRate = 5;
    await validatePayments(payments);
    await validateStages(stages);
    const amount = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
    console.log(amount, "amount");
    const totalAmount =
      amount != null && taxRate != null
        ? (Number(amount) + (Number(amount) * Number(taxRate)) / 100).toFixed(2)
        : 0;
    const contract = await prisma.contract.create({
      data: {
        clientLeadId: Number(clientLeadId),
        title,
        enTitle,
        purpose: title,
        amount: +amount,
        taxRate,
        contractLevel: stages[0].levelEnum,
        totalAmount: +totalAmount,
        projectGroupId,
        startDate: new Date(),
      },
    });
    const firstPaymentId = await createPayments({
      payments,
      projectGroupId,
      clientLeadId,
      contractId: contract.id,
    });
    await createStages({
      stages,
      projectGroupId,
      paymentId: firstPaymentId,
      clientLeadId,
      contractId: contract.id,
    });

    if (drawings && drawings.length > 0) {
      await createDrawings({ drawings, contractId: contract.id });
    }
    if (specialItems && specialItems.length > 0) {
      await createSpecialItems({ specialItems, contractId: contract.id });
    }
    if (payload.oldContractId && payload.markOldAsCancelled) {
      await markContractAsCancelled({
        contractId: Number(payload.oldContractId),
      });
    }
    if (arName || enName) {
      const client = await prisma.client.findFirst({
        where: {
          clientLeads: {
            some: {
              id: Number(clientLeadId),
            },
          },
        },
      });
      await prisma.client.update({
        where: {
          id: client.id,
        },
        data: {
          arName,
          enName,
        },
      });
    }
    return contract;
  } catch (e) {
    console.log(e.message, "error in contract");
    throw new Error(e.message);
  }
}
async function createPayments({
  contractId,
  payments,
  projectGroupId,
  clientLeadId,
}) {
  let firstPaymentId;
  for (let i = 0; i < payments.length; i++) {
    const payment = payments[i];
    let paymentCondition;
    if (i === 0) {
      paymentCondition = "SIGNATURE";
    } else {
      paymentCondition = payment.condition;
    }
    const createdPayment = await createContractPayment({
      payment,
      paymentCondition,
      projectGroupId,
      clientLeadId,
      contractId,
      conditionId: payment.conditionId,
    });
    if (i === 0) {
      firstPaymentId = createdPayment.id;
    }
  }
  return firstPaymentId;
}
async function createContractPayment({
  payment,
  projectGroupId,
  clientLeadId,
  contractId,
  paymentCondition,
  conditionId,
}) {
  const data = { amount: payment.amount, note: payment.note, contractId };
  if (conditionId) {
    data.conditionId = Number(conditionId);
  }
  data.paymentCondition = paymentCondition;
  if (paymentCondition !== "SIGNATURE") {
    const project = await prisma.project.findFirst({
      where: {
        clientLeadId: Number(clientLeadId),
        groupId: projectGroupId,
        type: payment.type,
      },
      select: {
        id: true,
      },
    });
    data.projectId = project.id;
  }

  const createdPayment = await prisma.contractPayment.create({ data });
  return createdPayment;
}
function getStageOrder(stageLevel) {
  const m = stageLevel.match(/\d+(?!.*\d)/);
  return Number(m[0]);
}
export const stageLevelStartProject = {
  LEVEL_3: "2D_Study",
  LEVEL_4: "3D_Designer",
  LEVEL_5: "2D_Final_Plans",
  LEVEL_6: "2D_Quantity_Calculation",
};
export const stageLevelRelatedProject = {
  LEVEL_2: "2D_Study",
  LEVEL_3: "3D_Designer",
  LEVEL_4: "2D_Final_Plans",
  LEVEL_5: "2D_Quantity_Calculation",
};

async function createStages({
  contractId,
  stages,
  projectGroupId,
  clientLeadId,
  paymentId,
}) {
  for (const stage of stages) {
    const levelEnum = stage.levelEnum;
    const createdStage = await createStage({
      clientLeadId,
      contractId,
      stage,
      projectGroupId,
    });
    if (paymentId && levelEnum === "LEVEL_2") {
      await prisma.contractPayment.update({
        where: { id: Number(paymentId) },
        data: { stageId: createdStage.id },
      });
    }
  }
}
async function createStage({
  contractId,
  stage,
  projectGroupId,
  clientLeadId,
}) {
  const levelEnum = stage.levelEnum;
  delete stage.levelEnum;
  const order = getStageOrder(levelEnum);

  let projectId;

  const projectType = stageLevelStartProject[levelEnum];
  if (projectType) {
    const relatedProject = await prisma.project.findFirst({
      where: {
        clientLeadId: Number(clientLeadId),
        groupId: projectGroupId,
        type: projectType,
      },
    });
    projectId = relatedProject.id;
  }
  const data = {
    order,
    contractId,
    ...stage,
    title: levelEnum,
  };
  if (projectId) {
    data.projectId = projectId;
  }
  if (levelEnum === "LEVEL_1") {
    data.stageStatus = "IN_PROGRESS";
  }

  const createdStage = await prisma.contractStage.create({ data });
  return createdStage;
}
async function createSpecialItems({ specialItems, contractId }) {
  for (const item of specialItems) {
    await createSpecialItem({ contractId, item });
  }
}
async function createSpecialItem({ item, contractId }) {
  contractId = Number(contractId);
  return await prisma.contractSpecialItem.create({
    data: {
      contractId,
      ...item,
    },
  });
}
async function createDrawings({ drawings, contractId }) {
  for (const drawing of drawings) {
    await createDrawing({ contractId, drawing });
  }
}
async function createDrawing({ contractId, drawing }) {
  contractId == Number(contractId);

  return await prisma.contractDrawing.create({
    data: {
      contractId: Number(contractId),
      url: drawing.url,
      fileName: drawing.fileName,
    },
  });
}
// view contract

export async function getContractDetailsById({ contractId }) {
  return await prisma.contract.findUnique({
    where: {
      id: Number(contractId),
    },
    include: {
      stages: true,
      paymentsNew: {
        include: {
          project: true,
          conditionItem: true,
        },
      },
      clientLead: {
        include: {
          client: true,
        },
      },
      drawings: true,
      specialItems: true,
      projects: true,
    },
  });
}

// edit
export async function updateContractBasics({
  projectGroupId,
  title,
  enTitle,
  arName,
  enName,
  contractId,
}) {
  const data = {};
  if (title) {
    data.title = title;
  }
  if (enTitle) {
    data.enTitle = enTitle;
  }
  if (projectGroupId) {
    data.projectGroupId = projectGroupId;
    await reAssignAllContractStages({ contractId, projectGroupId });
    await reAssignAllContractPayments({ contractId, projectGroupId });
  }
  const contract = await prisma.contract.findUnique({
    where: {
      id: Number(contractId),
    },
  });
  if (arName || enName) {
    const client = await prisma.client.findFirst({
      where: {
        clientLeads: {
          some: {
            id: Number(contract.clientLeadId),
          },
        },
      },
    });
    await prisma.client.update({
      where: {
        id: client.id,
      },
      data: {
        arName,
        enName,
      },
    });
  }
  await prisma.contract.update({
    where: {
      id: Number(contractId),
    },
    data,
  });
}
async function reAssignAllContractStages({ contractId, projectGroupId }) {
  const stages = await prisma.contractStage.findMany({
    where: {
      id: Number(contractId),
      projectId: { not: null },
    },
    select: {
      id: true,
      project: {
        select: {
          type: true,
        },
      },
    },
  });
  for (const stage of stages) {
    const newProject = await prisma.project.findFirst({
      where: {
        groupId: projectGroupId,
        type: stage.project.type,
      },
    });
    await prisma.contractStage.update({
      where: {
        id: Number(stage.id),
      },
      data: {
        projectId: newProject.id,
      },
    });
  }
  return true;
}

async function reAssignAllContractPayments({ contractId, projectGroupId }) {
  const stages = await prisma.contractPayment.findMany({
    where: {
      id: Number(contractId),
      projectId: { not: null },
    },
    select: {
      id: true,
      project: {
        select: {
          type: true,
        },
      },
    },
  });
  for (const stage of stages) {
    const newProject = await prisma.project.findFirst({
      where: {
        groupId: projectGroupId,
        type: stage.project.type,
      },
    });
    await prisma.contractPayment.update({
      where: {
        id: Number(stage.id),
      },
      data: {
        projectId: newProject.id,
      },
    });
  }
  return true;
}

// generate session
export async function generatePdfSessionToken({ contractId }) {
  const session = await prisma.contract.findUnique({
    where: { id: contractId },
  });

  if (!session) throw new Error("Session not found");

  const arToken = uuidv4();
  const enToken = uuidv4();

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      arToken,
      enToken,
    },
  });

  return {
    arToken: updated.arToken,
    enToken: updated.enToken,
  };
}

export async function createContractStage({ contractId, stage }) {
  try {
    const contract = await prisma.contract.findUnique({
      where: {
        id: Number(contractId),
      },
      select: {
        clientLeadId: true,
        projectGroupId: true,
      },
    });

    const newStage = await createStage({ contractId, stage, ...contract });
    return newStage;
  } catch (e) {
    throw new Error(e.message);
  }
}

export async function updateContractStage({ stageId, newStage }) {
  try {
    const data = {};
    if (newStage.deliveryDays) {
      data.deliveryDays = newStage.deliveryDays;
    }
    if (newStage.deptDeliveryDays) {
      data.deptDeliveryDays = newStage.deptDeliveryDays;

      const currentStage = await prisma.contractStage.findUnique({
        where: {
          id: Number(stageId),
        },
        include: {
          deliverySchedule: true,
        },
      });
      if (currentStage?.deliverySchedule) {
        const days = Number(newStage?.deptDeliveryDays);

        const base = new Date(currentStage.createdAt);
        const newDeliveryAt = new Date(base);
        newDeliveryAt.setDate(newDeliveryAt.getDate() + days);

        await prisma.deliverySchedule.update({
          where: { id: currentStage.deliverySchedule.id },
          data: { deliveryAt: newDeliveryAt },
        });
      }
    }

    return await prisma.contractStage.update({
      where: {
        id: Number(stageId),
      },
      data,
    });
  } catch (e) {
    throw new Error(e.message);
  }
}

export async function deleteContractStage({ stageId }) {
  try {
    const stage = await prisma.contractStage.findUnique({
      where: {
        id: Number(stageId),
      },
    });
    if (stage.stageStatus === "COMPLETED") {
      throw new Error("Can not delete this level as it is already completed");
    }
    return await prisma.contractStage.delete({
      where: {
        id: Number(stageId),
      },
    });
  } catch (e) {
    throw new Error(e.message);
  }
}

// contract payments
export async function updateContractPaymentStatus({ status, paymentId }) {
  try {
    const payment = await prisma.contractPayment.findUnique({
      where: {
        id: Number(paymentId),
      },
      select: {
        id: true,
        status: true,
        paymentCondition: true,
        contractId: true,
      },
    });
    if (payment.status === "NOT_DUE") {
      throw new Error(
        "Paymnet is not due yet, u can change status when the payment is due"
      );
    }
    await prisma.contractPayment.update({
      where: {
        id: Number(paymentId),
      },
      data: {
        status,
      },
    });
    if (payment.paymentCondition === "SIGNATURE") {
      await updateSecondStageAfterFirstPayment({
        contractId: payment.contractId,
      });
    }
    await updateContractStatusToCompletedIfNoOtherPaymentsOrStages({
      contractId: payment.contractId,
    });
  } catch (e) {
    throw new Error(e.message);
  }
}
async function checkIfNoOtherPaymentAndNoOtherStages({ contractId }) {
  const stagesCount = await prisma.contractStage.count({
    where: {
      contractId: contractId,
      stageStatus: {
        in: ["IN_PROGRESS", "NOT_STARTED"],
      },
    },
  });
  const paymentsCount = await prisma.contractPayment.count({
    where: {
      contractId: contractId,
      status: {
        in: ["DUE", "NOT_DUE"],
      },
    },
  });
  return stagesCount === 0 && paymentsCount === 0;
}
async function updateContractStatusToCompletedIfNoOtherPaymentsOrStages({
  contractId,
}) {
  const noOther = await checkIfNoOtherPaymentAndNoOtherStages({ contractId });
  if (noOther) {
    await prisma.contract.update({
      where: {
        id: Number(contractId),
      },
      data: {
        status: "COMPLETED",
      },
    });
  }
}

export async function createNewContractPayment({ contractId, payment }) {
  // update total payment
  contractId = Number(contractId);
  if (payment.condition === "To Do") {
    throw new Error(
      "You cant select this condition as it is the project initial condition by default"
    );
  }
  try {
    const contract = await prisma.contract.findUnique({
      where: {
        id: Number(contractId),
      },
      select: {
        id: true,
        clientLeadId: true,
        projectGroupId: true,
        amount: true,
        taxRate: true,
      },
    });
    payment = {
      ...payment,

      // type: payment.projectType,
    };
    const newPayment = await createContractPayment({
      contractId,
      payment,
      paymentCondition: payment.condition,
      conditionId: payment.conditionId,
      ...contract,
    });
    await updateContractTotals(contract.id);

    return newPayment;
  } catch (e) {
    throw new Error(e.message);
  }
}

export async function updateContractPayment({ paymentId, newPayment }) {
  // update total payment if amount updated
  let data = {};
  if (newPayment.condition === "To Do") {
    throw new Error(
      "You cant select this condition as it is the project initial condition by default"
    );
  }
  if (newPayment.type && !newPayment.condition) {
    throw new Error("You have to choose a payment condition");
  }
  const payment = await prisma.contractPayment.findUnique({
    where: {
      id: Number(paymentId),
    },
    select: {
      id: true,
      amount: true,
      contractId: true,
      contract: {
        select: {
          clientLeadId: true,
          id: true,
          projectGroupId: true,
          amount: true,
          taxRate: true,
        },
      },
      project: {
        select: {
          groupId: true,
          type: true,
        },
      },
    },
  });
  if (newPayment.amount) {
    data.amount = newPayment.amount;
  }
  if (newPayment.condition) {
    data.paymentCondition = newPayment.condition;
  }
  if (newPayment.conditionId) {
    data.conditionId = Number(newPayment.conditionId);
  }
  if (newPayment.type) {
    let groupId = payment.project?.groupId;
    if (!groupId) {
      groupId = payment.contract.projectGroupId;
    }
    const newProject = await prisma.project.findFirst({
      where: {
        type: newPayment.type,
        groupId: groupId,
        clientLeadId: payment.contract.clientLeadId,
      },
      select: {
        id: true,
      },
    });
    data.projectId = newProject.id;
  }

  await prisma.contractPayment.update({
    where: {
      id: Number(paymentId),
    },
    data,
  });

  if (newPayment.amount) {
    await updateContractTotals(payment.contractId);
  }
  return true;
}

export async function deleteContractPayment({ paymentId }) {
  const payment = await prisma.contractPayment.findUnique({
    where: {
      id: Number(paymentId),
    },
  });
  if (payment.paymentCondition === "SIGNATURE") {
    throw new Error("Cant delete signature payment");
  }
  await prisma.contractPayment.delete({
    where: {
      id: Number(payment.id),
    },
  });
  await updateContractTotals(payment.contractId);
}

export async function updateContractTotals(contractId) {
  const contract = await prisma.contract.findUnique({
    where: { id: Number(contractId) },
    include: { paymentsNew: true },
  });

  if (!contract) throw new Error("Contract not found");

  const amount = contract.paymentsNew.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const taxRate = Number(contract.taxRate || 0);
  const totalAmount = amount + (amount * taxRate) / 100;

  const updated = await prisma.contract.update({
    where: { id: Number(contractId) },
    data: {
      amount,
      totalAmount,
    },
  });

  return updated;
}

// drawings

export async function createContractDrawing({ contractId, drawing }) {
  return await createDrawing({ contractId, drawing });
}

export async function updateContractDrwaing({ drawId, newDrawing }) {
  let data = {};
  if (newDrawing.url) {
    data.url = newDrawing.url;
  }
  if (newDrawing.fileName) {
    data.fileName = newDrawing.fileName;
  }
  return await prisma.contractDrawing.update({
    where: {
      id: Number(drawId),
    },
    data,
  });
}

export async function deleteContractDrawing({ drawId }) {
  return await prisma.contractDrawing.delete({
    where: {
      id: Number(drawId),
    },
  });
}
// special item

export async function createContractSpecialItem({ contractId, item }) {
  return await createSpecialItem({ contractId, item });
}

export async function updateContractSpecialItem({
  specialItemId,
  newSpecialItem,
}) {
  let data = {};
  if (newSpecialItem.labelAr) {
    data.labelAr = newSpecialItem.labelAr;
  }
  if (newSpecialItem.labelEn) {
    data.labelEn = newSpecialItem.labelEn;
  }
  await prisma.contractSpecialItem.update({
    where: {
      id: Number(specialItemId),
    },
    data,
  });
}

export async function deleteContractSpecialItem({ specialItemId }) {
  return await prisma.contractSpecialItem.delete({
    where: {
      id: Number(specialItemId),
    },
  });
}

export const STAGE_PREV_LEVELS_MAP = {
  LEVEL1: null,
  LEVEL2: ["LEVEL_1"],
  LEVEL3: ["LEVEL_2", "LEVEL_1"],
  LEVEL4: ["LEVEL_3", "LEVEL_2", "LEVEL_1"],
  LEVEL5: ["LEVEL_4", "LEVEL_3", "LEVEL_2", "LEVEL_1"],
  LEVEL6: ["LEVEL_5", "LEVEL_4", "LEVEL_3", "LEVEL_2", "LEVEL_1"],
  LEVEL7: ["LEVEL_6", "LEVEL_5", "LEVEL_4", "LEVEL_3", "LEVEL_2", "LEVEL_1"],
};

export async function checkIfProjectHasStagesAndUpdateNextAndPrevious({
  projectId,
  status,
}) {
  if (status.toUpperCase() !== "COMPLETED") {
    return;
  }
  const nextContractStage = await prisma.contractStage.findFirst({
    where: {
      projectId: Number(projectId),
      stageStatus: "NOT_STARTED",
      contract: {
        status: "IN_PROGRESS",
      },
    },
  });
  if (nextContractStage) {
    await prisma.contractStage.updateMany({
      where: {
        projectId: Number(projectId),
        stageStatus: "NOT_STARTED",
        contract: {
          status: "IN_PROGRESS",
        },
      },
      data: {
        stageStatus: "IN_PROGRESS",
      },
    });

    let prevStageLevels = STAGE_PREV_LEVELS_MAP[nextContractStage.title];
    let lastStage = await prisma.contractStage.findFirst({
      where: {
        contractId: Number(nextContractStage.contractId),
        title: { in: prevStageLevels },
        stageStatus: "IN_PROGRESS",
      },
    });
    if (prevStageLevels && prevStageLevels.length > 0) {
      await prisma.contractStage.updateMany({
        where: {
          contractId: Number(nextContractStage.contractId),
          title: { in: prevStageLevels },
          stageStatus: "IN_PROGRESS",
        },
        data: {
          stageStatus: "COMPLETED",
        },
      });
    }
    if (lastStage) {
      await updateContractStatusToCompletedIfNoOtherPaymentsOrStages({
        contractId: lastStage.contractId,
      });
    }
    if (nextContractStage) {
      await createADeliveryScheduleAndRelateItToStage({
        stageId: nextContractStage.id,
        ...nextContractStage,
      });
    }
  }
  return true;
}
export async function updateSecondStageAfterFirstPayment({ contractId }) {
  const oldStageWhere = {
    contractId: Number(contractId),
    stageStatus: "IN_PROGRESS",
    title: "LEVEL_1",
    contract: {
      status: "IN_PROGRESS",
    },
  };

  const where = {
    contractId: Number(contractId),
    stageStatus: "NOT_STARTED",
    title: "LEVEL_2",
    contract: {
      status: "IN_PROGRESS",
    },
  };

  await prisma.contractStage.updateMany({
    where: oldStageWhere,
    data: {
      stageStatus: "COMPLETED",
    },
  });
  const levelTwoStage = await prisma.contractStage.findFirst({
    where,
  });
  await prisma.contractStage.updateMany({
    where,
    data: {
      stageStatus: "IN_PROGRESS",
    },
  });
  if (levelTwoStage) {
    await createADeliveryScheduleAndRelateItToStage({
      stageId: levelTwoStage.id,
      ...levelTwoStage,
    });
  }
  return true;
}

export async function checkIfProjectHasPaymentAndUpdate({ projectId, status }) {
  const where = {
    projectId: Number(projectId),
    status: "NOT_DUE",
    paymentCondition: status,
  };
  return await updateContractPaymentStatusToDue({ where });
}

export async function updateContractPaymentStatusToDue({ where }) {
  return await prisma.contractPayment.updateMany({
    where,
    data: {
      status: "DUE",
    },
  });
}

export async function updateContractPaymentOnContractSign({ contractId }) {
  const where = {
    contractId: Number(contractId),
    status: "NOT_DUE",
    paymentCondition: "SIGNATURE",
  };
  return await updateContractPaymentStatusToDue({ where });
}

export async function createADeliveryScheduleAndRelateItToStage({
  stageId,
  deptDeliveryDays,
  projectId,
}) {
  const days = Number(deptDeliveryDays ?? 0);
  const now = new Date();
  const deliveryAt = new Date(now);
  deliveryAt.setDate(deliveryAt.getDate() + days);
  const stage = await prisma.contractStage.findUnique({
    where: { id: stageId },
    select: {
      title: true,
      contract: {
        select: {
          clientLeadId: true,
          projectGroupId: true,
        },
      },
    },
  });
  const projectType = stageLevelRelatedProject[stage.title];
  const data = {
    deliveryAt,
    stageId,
  };
  if (projectType) {
    const relatedProject = await prisma.project.findFirst({
      where: {
        clientLeadId: stage.contract.clientLeadId,
        groupId: stage.contract.projectGroupId,
        type: projectType,
      },
      select: {
        id: true,
      },
    });
    data.projectId = relatedProject.id;
  }
  return await prisma.deliverySchedule.create({
    data: {
      ...data,
    },
  });
}

export async function markContractAsCancelled({ contractId }) {
  const contract = await prisma.contract.findUnique({
    where: {
      id: Number(contractId),
    },
  });
  await buildAndUploadContractPdf({
    token: contract.arToken,
    signatureUrl: contract.signatureUrl,
    lng: "ar",
    canceled: true,
  });
  return await prisma.contract.update({
    where: {
      id: Number(contractId),
    },
    data: {
      status: "CANCELLED",
    },
  });
}

// contract payments page

const STATUS = {
  RECEIVED: "RECEIVED",
  TRANSFERRED: "TRANSFERRED",
  DUE: "DUE",
  NOT_DUE: "NOT_DUE",
};

function toNumber(d) {
  if (d === null || d === undefined) return 0;
  const n = typeof d === "string" ? Number(d) : Number(d);
  return Number.isFinite(n) ? n : 0;
}

function withTax(amount, taxRate) {
  const rate = typeof taxRate === "number" ? taxRate : 5; // default 5%
  return toNumber(amount) * (1 + rate / 100);
}

export async function getContractPaymentsGroupedService({
  page = 1,
  limit = 10,
  status = "DUE",
}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * take;

  const filterStatus = status && status !== "ALL" ? status : null;

  // Count contracts that match the filter (have at least one payment with that status)
  const whereForCount = filterStatus
    ? { paymentsNew: { some: { status: filterStatus } } }
    : { paymentsNew: { some: {} } };
  whereForCount.status = { not: "CANCELLED" };
  const total = await prisma.contract.count({ where: whereForCount });

  const contracts = await prisma.contract.findMany({
    where: whereForCount,
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: {
      clientLead: {
        select: {
          id: true,
          code: true,
          client: { select: { name: true } },
        },
      },
      stages: {
        where: {
          stageStatus: "IN_PROGRESS",
        },
        select: {
          id: true,
          title: true,
          order: true,
          stageStatus: true,
        },
      },
      paymentsNew: {
        include: {
          conditionItem: { select: { id: true, labelAr: true, labelEn: true } },
          project: { select: { id: true, groupTitle: true } },
          stage: { select: { id: true, title: true, order: true } },
        },
        orderBy: [{ dueDate: "asc" }, { id: "asc" }],
      },
    },
  });

  const items = contracts.map((c) => {
    const taxRate = typeof c.taxRate === "number" ? c.taxRate : 5; // if you have contract.taxRate in schema; otherwise default 5
    const all = c.paymentsNew || [];

    // Totals across ALL statuses
    const sumBy = (fn) => all.reduce((acc, p) => acc + toNumber(fn(p)), 0);

    const received = sumBy((p) =>
      p.status === STATUS.RECEIVED ? p.amount : 0
    );
    const transferred = sumBy((p) =>
      p.status === STATUS.TRANSFERRED ? p.amount : 0
    );
    const due = sumBy((p) => (p.status === STATUS.DUE ? p.amount : 0));
    const notDue = sumBy((p) => (p.status === STATUS.NOT_DUE ? p.amount : 0));
    const grand = received + transferred + due + notDue;
    const grandWithTax = withTax(grand, taxRate);

    const visiblePayments = filterStatus
      ? all.filter((p) => p.status === filterStatus)
      : all;
    console.log(c, "stage");
    return {
      contract: {
        id: c.id,
        contractLevel: c.stages.length > 0 ? c.stages[0].title : "-",
        contractType: c.title,
        taxRate,
        clientLead: {
          id: c.clientLead?.id,
          code: c.clientLead?.code,
          client: { name: c.clientLead?.client?.name || "-" },
        },
      },
      totals: {
        received,
        transferred,
        due,
        notDue,
        grand,
        grandWithTax,
      },
      payments: visiblePayments.map((p) => ({
        id: p.id,
        amount: toNumber(p.amount),
        amountWithTax: withTax(p.amount, taxRate),
        currency: p.currency,
        dueDate: p.dueDate,
        status: p.status,
        reference: p.reference,
        note: p.note,
        project: p.project
          ? { id: p.project.id, title: p.project.groupTitle }
          : null,
        stage: p.stage
          ? { id: p.stage.id, title: p.stage.title, order: p.stage.order }
          : null,
        conditionItem: p.conditionItem
          ? {
              id: p.conditionItem.id,
              labelAr: p.conditionItem.labelAr,
              labelEn: p.conditionItem.labelEn,
            }
          : {
              id: null,
              labelAr: p.paymentCondition,
            },
      })),
    };
  });

  return {
    items,
    page: pageNum,
    limit: take,
    total,
    totalPages: Math.max(1, Math.ceil(total / take)),
  };
}

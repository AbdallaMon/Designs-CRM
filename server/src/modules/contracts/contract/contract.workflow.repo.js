import prisma from "../../../infra/prisma/prisma.js";
import { v4 as uuidv4 } from "uuid";
import { assignProjectToUser } from "../../projects/project/project.usecase.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  CONTRACT_LEVELS,
  CONTRACT_PAYMENT_STATUSES,
  CONTRACT_STATUSES,
  WORK_STAGE_STATUSES,
  PROFILES,
  contractsMessagesCodes,
} from "@dms/shared";
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
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
const projectTypeForStageLevel = {
  "2D_Study": CONTRACT_LEVELS.LEVEL_2,
  "3D_Designer": CONTRACT_LEVELS.LEVEL_3,
  "2D_Final_Plans": CONTRACT_LEVELS.LEVEL_4,
  "2D_Quantity_Calculation": CONTRACT_LEVELS.LEVEL_5,
};
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
      (s) => s.stageStatus === WORK_STAGE_STATUSES.IN_PROGRESS
    );
    contract.level = currentStage ? currentStage.title : null;
  }

  return contracts;
}

async function validatePayments(payments) {
  {
    if (payments.length === 0)
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_PAYMENTS_REQUIRED, statusCode: 400 });
  }
  if (!payments.every((payment) => payment.amount > 0))
    throw new AppError({ code: contractsMessagesCodes.CONTRACT_PAYMENT_AMOUNT_INVALID, statusCode: 400 });
  if (!payments.every((payment) => payment.condition !== "To Do")) {
    throw new AppError({ code: contractsMessagesCodes.CONTRACT_PAYMENT_CONDITION_INVALID, statusCode: 400 });
  }
}

async function validateStages(stages) {
  {
    if (stages.length === 0)
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_STAGES_REQUIRED, statusCode: 400 });
  }
  if (
    !stages.every(
      (stage) => stage.deliveryDays > 0 && stage.deptDeliveryDays > 0
    )
  )
    throw new AppError({ code: contractsMessagesCodes.CONTRACT_STAGE_DAYS_INVALID, statusCode: 400 });
}
export async function createContract({ payload }) {
  const {
    clientLeadId,
    drawings,
    payments,
    projectGroupId,
    specialItems,
    stages,
    title,
    enTitle,
  } = payload;

  const taxRate = 5;
  await validatePayments(payments);
  await validateStages(stages);
  const amount = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );
  const totalAmount =
    amount != null && taxRate != null
      ? (Number(amount) + (Number(amount) * Number(taxRate)) / 100).toFixed(2)
      : 0;

  return prisma.$transaction(async (db) => {
    const contract = await db.contract.create({
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
      db,
      payments,
      projectGroupId,
      clientLeadId,
      contractId: contract.id,
    });
    await createStages({
      db,
      stages,
      projectGroupId,
      paymentId: firstPaymentId,
      clientLeadId,
      contractId: contract.id,
    });

    if (drawings?.length) {
      await createDrawings({ db, drawings, contractId: contract.id });
    }
    if (specialItems?.length) {
      await createSpecialItems({ db, specialItems, contractId: contract.id });
    }
    if (payload.oldContractId != null && payload.markOldAsCancelled) {
      const cancelled = await db.contract.updateMany({
        where: {
          id: Number(payload.oldContractId),
          clientLeadId: Number(clientLeadId),
        },
        data: { status: "CANCELLED" },
      });
      if (cancelled.count !== 1) {
        throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
      }
    }
    if (hasOwn(payload, "arName") || hasOwn(payload, "enName")) {
      const client = await db.client.findFirst({
        where: {
          clientLeads: { some: { id: Number(clientLeadId) } },
        },
        select: { id: true },
      });
      if (!client) {
        throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
      }
      const clientData = {};
      if (hasOwn(payload, "arName")) clientData.arName = payload.arName;
      if (hasOwn(payload, "enName")) clientData.enName = payload.enName;
      await db.client.update({ where: { id: client.id }, data: clientData });
    }
    return contract;
  });
}
async function createPayments({
  db = prisma,
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
      db,
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
  db = prisma,
  payment,
  projectGroupId,
  clientLeadId,
  contractId,
  paymentCondition,
  conditionId,
}) {
  const data = { amount: payment.amount, note: payment.note, contractId };
  if (conditionId != null && conditionId !== "") {
    data.conditionId = Number(conditionId);
  }
  data.paymentCondition = paymentCondition;
  if (paymentCondition !== "SIGNATURE") {
    const project = await db.project.findFirst({
      where: {
        clientLeadId: Number(clientLeadId),
        groupId: projectGroupId,
        type: payment.type,
      },
      select: {
        id: true,
      },
    });
    if (!project) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
    }
    data.projectId = project.id;
  }

  const createdPayment = await db.contractPayment.create({ data });
  return createdPayment;
}
function getStageOrder(stageLevel) {
  const m = stageLevel.match(/\d+(?!.*\d)/);
  return Number(m[0]);
}

async function createStages({
  db = prisma,
  contractId,
  stages,
  projectGroupId,
  clientLeadId,
  paymentId,
}) {
  for (const stage of stages) {
    const levelEnum = stage.levelEnum;
    const createdStage = await createStage({
      db,
      clientLeadId,
      contractId,
      stage,
      projectGroupId,
    });
    if (paymentId && levelEnum === CONTRACT_LEVELS.LEVEL_2) {
      await db.contractPayment.update({
        where: { id: Number(paymentId) },
        data: { stageId: createdStage.id },
      });
    }
  }
}
async function createStage({
  db = prisma,
  contractId,
  stage,
  projectGroupId,
  clientLeadId,
}) {
  const { levelEnum, ...stageData } = stage;
  const order = getStageOrder(levelEnum);

  let projectId;

  const projectType = stageLevelStartProject[levelEnum];
  if (projectType) {
    const relatedProject = await db.project.findFirst({
      where: {
        clientLeadId: Number(clientLeadId),
        groupId: projectGroupId,
        type: projectType,
      },
    });
    if (!relatedProject) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
    }
    projectId = relatedProject.id;
  }
  const data = {
    order,
    contractId,
    ...stageData,
    title: levelEnum,
  };
  if (data.isActive || data.isActive === false) {
    delete data.isActive;
  }
  if (projectId) {
    data.projectId = projectId;
  }
  if (levelEnum === CONTRACT_LEVELS.LEVEL_1) {
    data.stageStatus = WORK_STAGE_STATUSES.IN_PROGRESS;
  }

  const createdStage = await db.contractStage.create({ data });
  return createdStage;
}
async function createSpecialItems({ db = prisma, specialItems, contractId }) {
  for (const item of specialItems) {
    await createSpecialItem({ db, contractId, item });
  }
}
async function createSpecialItem({ db = prisma, item, contractId }) {
  contractId = Number(contractId);
  return await db.contractSpecialItem.create({
    data: {
      contractId,
      ...item,
    },
  });
}
async function createDrawings({ db = prisma, drawings, contractId }) {
  for (const drawing of drawings) {
    await createDrawing({ db, contractId, drawing });
  }
}
async function createDrawing({ db = prisma, contractId, drawing }) {
  contractId == Number(contractId);

  return await db.contractDrawing.create({
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
  return prisma.$transaction(async (db) => {
    const contract = await db.contract.findUnique({
      where: { id: Number(contractId) },
      select: { id: true, clientLeadId: true },
    });
    if (!contract) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (enTitle !== undefined) data.enTitle = enTitle;
    if (projectGroupId !== undefined) {
      data.projectGroupId = projectGroupId;
      await reAssignAllContractStages({
        db,
        contractId,
        projectGroupId,
        clientLeadId: contract.clientLeadId,
      });
      await reAssignAllContractPayments({
        db,
        contractId,
        projectGroupId,
        clientLeadId: contract.clientLeadId,
      });
    }
    if (arName !== undefined || enName !== undefined) {
      const client = await db.client.findFirst({
        where: { clientLeads: { some: { id: Number(contract.clientLeadId) } } },
        select: { id: true },
      });
      if (!client) {
        throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
      }
      const clientData = {};
      if (arName !== undefined) clientData.arName = arName;
      if (enName !== undefined) clientData.enName = enName;
      await db.client.update({ where: { id: client.id }, data: clientData });
    }
    await db.contract.update({ where: { id: Number(contractId) }, data });
    return undefined;
  });
}
async function reAssignAllContractStages({
  db = prisma,
  contractId,
  projectGroupId,
  clientLeadId,
}) {
  if (projectGroupId == null) {
    await db.contractStage.updateMany({
      where: { contractId: Number(contractId), projectId: { not: null } },
      data: { projectId: null },
    });
    return true;
  }
  const stages = await db.contractStage.findMany({
    where: {
      contractId: Number(contractId),
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
    const newProject = await db.project.findFirst({
      where: {
        groupId: projectGroupId,
        clientLeadId: Number(clientLeadId),
        type: stage.project.type,
      },
      select: { id: true },
    });
    if (!newProject) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
    }
    await db.contractStage.update({
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

async function reAssignAllContractPayments({
  db = prisma,
  contractId,
  projectGroupId,
  clientLeadId,
}) {
  if (projectGroupId == null) {
    await db.contractPayment.updateMany({
      where: { contractId: Number(contractId), projectId: { not: null } },
      data: { projectId: null },
    });
    return true;
  }
  const payments = await db.contractPayment.findMany({
    where: {
      contractId: Number(contractId),
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
  for (const payment of payments) {
    const newProject = await db.project.findFirst({
      where: {
        groupId: projectGroupId,
        clientLeadId: Number(clientLeadId),
        type: payment.project.type,
      },
      select: { id: true },
    });
    if (!newProject) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
    }
    await db.contractPayment.update({
      where: {
        id: Number(payment.id),
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

  if (!session) throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });

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
    throw e;
  }
}

export async function updateContractStage({ stageId, newStage }) {
  try {
    const data = {};
    if (hasOwn(newStage, "deliveryDays")) {
      data.deliveryDays = newStage.deliveryDays;
    }
    if (hasOwn(newStage, "deptDeliveryDays")) {
      data.deptDeliveryDays = newStage.deptDeliveryDays;

      const currentStage = await prisma.contractStage.findUnique({
        where: {
          id: Number(stageId),
        },
        select: {
          startDate: true,
          deliverySchedule: {
            select: { id: true, createdAt: true },
          },
        },
      });
      if (currentStage?.deliverySchedule && newStage.deptDeliveryDays != null) {
        const days = Number(newStage?.deptDeliveryDays);

        // ContractStage has no createdAt column. New rows use the real activation time;
        // legacy rows fall back to the schedule creation timestamp.
        const base = new Date(currentStage.startDate ?? currentStage.deliverySchedule.createdAt);
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
    throw e;
  }
}

export async function deleteContractStage({ stageId }) {
  try {
    const stage = await prisma.contractStage.findUnique({
      where: {
        id: Number(stageId),
      },
    });
    if (stage.stageStatus === WORK_STAGE_STATUSES.COMPLETED) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_STAGE_COMPLETED, statusCode: 409 });
    }
    return await prisma.contractStage.delete({
      where: {
        id: Number(stageId),
      },
    });
  } catch (e) {
    throw e;
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
    if (payment.status === CONTRACT_PAYMENT_STATUSES.NOT_DUE) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_PAYMENT_NOT_DUE, statusCode: 409 });
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
    throw e;
  }
}
async function checkIfNoOtherPaymentAndNoOtherStages({ contractId, db = prisma }) {
  const stagesCount = await db.contractStage.count({
    where: {
      contractId: contractId,
      stageStatus: {
        in: [WORK_STAGE_STATUSES.IN_PROGRESS, WORK_STAGE_STATUSES.NOT_STARTED],
      },
    },
  });
  const paymentsCount = await db.contractPayment.count({
    where: {
      contractId: contractId,
      status: {
        in: [CONTRACT_PAYMENT_STATUSES.DUE, CONTRACT_PAYMENT_STATUSES.NOT_DUE],
      },
    },
  });
  return stagesCount === 0 && paymentsCount === 0;
}
async function updateContractStatusToCompletedIfNoOtherPaymentsOrStages({
  contractId,
  db = prisma,
}) {
  const noOther = await checkIfNoOtherPaymentAndNoOtherStages({ contractId, db });
  if (noOther) {
    await db.contract.update({
      where: {
        id: Number(contractId),
      },
      data: {
        status: CONTRACT_STATUSES.COMPLETED,
      },
    });
  }
  return noOther;
}

export async function createNewContractPayment({ contractId, payment }) {
  // update total payment
  contractId = Number(contractId);
  if (payment.condition === "To Do") {
    throw new AppError({ code: contractsMessagesCodes.CONTRACT_PAYMENT_CONDITION_INVALID, statusCode: 400 });
  }
  return prisma.$transaction(async (db) => {
    const contract = await db.contract.findUnique({
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
    if (!contract) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
    }
    const newPayment = await createContractPayment({
      db,
      contractId,
      payment,
      paymentCondition: payment.condition,
      conditionId: payment.conditionId,
      ...contract,
    });
    await updateContractTotalsWithDb(db, contract.id);

    return newPayment;
  });
}

export async function updateContractPayment({ paymentId, newPayment }) {
  // update total payment if amount updated
  if (newPayment.condition === "To Do") {
    throw new AppError({ code: contractsMessagesCodes.CONTRACT_PAYMENT_CONDITION_INVALID, statusCode: 400 });
  }
  if (newPayment.type && !newPayment.condition) {
    throw new AppError({ code: contractsMessagesCodes.CONTRACT_PAYMENT_CONDITION_INVALID, statusCode: 400 });
  }
  return prisma.$transaction(async (db) => {
    const data = {};
    const payment = await db.contractPayment.findUnique({
      where: { id: Number(paymentId) },
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
        project: { select: { groupId: true, type: true } },
      },
    });
    if (!payment) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_PAYMENT_NOT_FOUND, statusCode: 404 });
    }
    if (hasOwn(newPayment, "amount")) data.amount = newPayment.amount;
    if (hasOwn(newPayment, "condition")) data.paymentCondition = newPayment.condition;
    if (hasOwn(newPayment, "conditionId")) {
      data.conditionId = newPayment.conditionId == null || newPayment.conditionId === ""
        ? null
        : Number(newPayment.conditionId);
    }
    if (hasOwn(newPayment, "note")) data.note = newPayment.note;
    if (hasOwn(newPayment, "type")) {
      if (newPayment.type == null || newPayment.type === "") {
        data.projectId = null;
      } else {
        const groupId = payment.project?.groupId ?? payment.contract.projectGroupId;
        const newProject = await db.project.findFirst({
          where: {
            type: newPayment.type,
            groupId,
            clientLeadId: payment.contract.clientLeadId,
          },
          select: { id: true },
        });
        if (!newProject) {
          throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
        }
        data.projectId = newProject.id;
      }
    }

    await db.contractPayment.update({ where: { id: Number(paymentId) }, data });
    if (hasOwn(newPayment, "amount")) {
      await updateContractTotalsWithDb(db, payment.contractId);
    }
    return true;
  });
}

export async function deleteContractPayment({ paymentId }) {
  return prisma.$transaction(async (db) => {
    const payment = await db.contractPayment.findUnique({
      where: { id: Number(paymentId) },
    });
    if (!payment) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_PAYMENT_NOT_FOUND, statusCode: 404 });
    }
    if (payment.paymentCondition === "SIGNATURE") {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_SIGNATURE_PAYMENT_REQUIRED, statusCode: 409 });
    }
    await db.contractPayment.delete({ where: { id: Number(payment.id) } });
    await updateContractTotalsWithDb(db, payment.contractId);
    return undefined;
  });
}

async function updateContractTotalsWithDb(db, contractId) {
  const contract = await db.contract.findUnique({
    where: { id: Number(contractId) },
    include: { paymentsNew: true },
  });

  if (!contract) throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });

  const amount = contract.paymentsNew.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const taxRate = Number(contract.taxRate || 0);
  const totalAmount = amount + (amount * taxRate) / 100;

  const updated = await db.contract.update({
    where: { id: Number(contractId) },
    data: {
      amount,
      totalAmount,
    },
  });

  return updated;
}

export async function updateContractTotals(contractId) {
  return updateContractTotalsWithDb(prisma, contractId);
}

// drawings

export async function createContractDrawing({ contractId, drawing }) {
  return await createDrawing({ contractId, drawing });
}

export async function updateContractDrwaing({ drawId, newDrawing }) {
  let data = {};
  if (hasOwn(newDrawing, "url")) {
    data.url = newDrawing.url;
  }
  if (hasOwn(newDrawing, "fileName")) {
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
  if (hasOwn(newSpecialItem, "labelAr")) {
    data.labelAr = newSpecialItem.labelAr;
  }
  if (hasOwn(newSpecialItem, "labelEn")) {
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

async function activateStage({ db, stage, now }) {
  const activeStage = {
    ...stage,
    stageStatus: WORK_STAGE_STATUSES.IN_PROGRESS,
    startDate: now,
    endDate: null,
  };
  await db.contractStage.update({
    where: { id: Number(stage.id) },
    data: {
      stageStatus: WORK_STAGE_STATUSES.IN_PROGRESS,
      startDate: now,
      endDate: null,
    },
  });
  await upsertDeliveryScheduleForStage({ db, stageId: stage.id, now });
  return activeStage;
}

async function completeStageAndStartNext({ db, currentStage, now }) {
  await db.contractStage.update({
    where: { id: Number(currentStage.id) },
    data: {
      stageStatus: WORK_STAGE_STATUSES.COMPLETED,
      endDate: now,
    },
  });

  const nextStage = await db.contractStage.findFirst({
    where: {
      contractId: Number(currentStage.contractId),
      order: { gt: Number(currentStage.order) },
      stageStatus: WORK_STAGE_STATUSES.NOT_STARTED,
    },
    orderBy: { order: "asc" },
  });
  const activeStage = nextStage ? await activateStage({ db, stage: nextStage, now }) : null;

  if (!activeStage) {
    await updateContractStatusToCompletedIfNoOtherPaymentsOrStages({
      contractId: currentStage.contractId,
      db,
    });
  }

  return {
    contractId: currentStage.contractId,
    completedStage: {
      ...currentStage,
      stageStatus: WORK_STAGE_STATUSES.COMPLETED,
      endDate: now,
    },
    activeStage,
  };
}

export async function checkIfProjectHasStagesAndUpdateNextAndPrevious({
  status,
  clientLeadId,
  groupId,
  groupTitle,
  projectType,
}) {
  if (String(status).toUpperCase() !== WORK_STAGE_STATUSES.COMPLETED) return false;

  const completedStageLevel = projectTypeForStageLevel[projectType];
  if (!completedStageLevel) return false;

  const now = new Date();
  const transitions = await prisma.$transaction(async (db) => {
    const currentStages = await db.contractStage.findMany({
      where: {
        title: completedStageLevel,
        stageStatus: WORK_STAGE_STATUSES.IN_PROGRESS,
        contract: {
          status: CONTRACT_STATUSES.IN_PROGRESS,
          clientLeadId: Number(clientLeadId),
          projectGroupId: groupId == null ? null : Number(groupId),
        },
      },
      orderBy: [{ contractId: "asc" }, { order: "asc" }],
    });

    // One shared project may legitimately back more than one active contract. Advance
    // every matching contract independently, but never consume two duplicate stages from
    // the same contract.
    const seenContracts = new Set();
    const results = [];
    for (const currentStage of currentStages) {
      if (seenContracts.has(currentStage.contractId)) continue;
      seenContracts.add(currentStage.contractId);
      results.push(await completeStageAndStartNext({ db, currentStage, now }));
    }
    return results;
  });

  for (const transition of transitions) {
    const relatedProjectType = stageLevelRelatedProject[transition.activeStage?.title];
    if (!relatedProjectType) continue;
    await assignDesignersForStageRelatedProject({
      groupId,
      projectType: relatedProjectType,
      leadId: clientLeadId,
      groupTitle,
    });
  }
  return transitions.length > 0;
}

export async function updateSecondStageAfterFirstPayment({ contractId }) {
  const now = new Date();
  const transition = await prisma.$transaction(async (db) => {
    const contract = await db.contract.findUnique({
      where: { id: Number(contractId) },
      select: {
        id: true,
        status: true,
        clientLeadId: true,
        projectGroupId: true,
        stages: { orderBy: { order: "asc" } },
      },
    });
    if (!contract || contract.status !== CONTRACT_STATUSES.IN_PROGRESS) return null;

    const levelOne = contract.stages.find((stage) => stage.title === CONTRACT_LEVELS.LEVEL_1);
    if (levelOne && levelOne.stageStatus !== WORK_STAGE_STATUSES.COMPLETED) {
      return {
        ...(await completeStageAndStartNext({ db, currentStage: levelOne, now })),
        clientLeadId: contract.clientLeadId,
        projectGroupId: contract.projectGroupId,
      };
    }

    // Contracts are allowed to omit LEVEL_1. Start the first configured stage once;
    // subsequent signature updates are idempotent because a stage is already active.
    if (!levelOne && contract.stages.every((stage) => stage.stageStatus === WORK_STAGE_STATUSES.NOT_STARTED)) {
      const firstStage = contract.stages[0];
      if (!firstStage) return null;
      const activeStage = await activateStage({ db, stage: firstStage, now });
      return {
        contractId: contract.id,
        completedStage: null,
        activeStage,
        clientLeadId: contract.clientLeadId,
        projectGroupId: contract.projectGroupId,
      };
    }
    return null;
  });

  const relatedProjectType = stageLevelRelatedProject[transition?.activeStage?.title];
  if (relatedProjectType) {
    await assignDesignersForStageRelatedProject({
      groupId: transition.projectGroupId,
      projectType: relatedProjectType,
      leadId: transition.clientLeadId,
    });
  }
  return true;
}

function desiredOverrideStatus({ index, completedThroughIndex, activeIndex }) {
  if (index <= completedThroughIndex) return WORK_STAGE_STATUSES.COMPLETED;
  if (index === activeIndex) return WORK_STAGE_STATUSES.IN_PROGRESS;
  return WORK_STAGE_STATUSES.NOT_STARTED;
}

function stageOverrideData({ stage, stageStatus, now }) {
  if (stageStatus === WORK_STAGE_STATUSES.COMPLETED) {
    return {
      stageStatus,
      startDate: stage.startDate ?? now,
      endDate:
        stage.stageStatus === WORK_STAGE_STATUSES.COMPLETED && stage.endDate
          ? stage.endDate
          : now,
    };
  }
  if (stageStatus === WORK_STAGE_STATUSES.IN_PROGRESS) {
    return {
      stageStatus,
      startDate:
        stage.stageStatus === WORK_STAGE_STATUSES.IN_PROGRESS && stage.startDate
          ? stage.startDate
          : now,
      endDate: null,
    };
  }
  return { stageStatus, startDate: null, endDate: null };
}

export async function overrideContractStageStatus({ contractId, stageId, status }) {
  const now = new Date();
  const result = await prisma.$transaction(async (db) => {
    const contract = await db.contract.findUnique({
      where: { id: Number(contractId) },
      select: {
        id: true,
        status: true,
        clientLeadId: true,
        projectGroupId: true,
        stages: { orderBy: { order: "asc" } },
      },
    });
    if (!contract) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
    }
    if (contract.status === CONTRACT_STATUSES.CANCELLED) {
      throw new AppError({
        code: contractsMessagesCodes.CONTRACT_STAGE_OVERRIDE_CANCELLED,
        statusCode: 409,
      });
    }

    const targetIndex = contract.stages.findIndex((stage) => Number(stage.id) === Number(stageId));
    if (targetIndex < 0) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
    }

    let completedThroughIndex;
    let activeIndex;
    if (status === WORK_STAGE_STATUSES.IN_PROGRESS) {
      completedThroughIndex = targetIndex - 1;
      activeIndex = targetIndex;
    } else if (status === WORK_STAGE_STATUSES.COMPLETED) {
      completedThroughIndex = targetIndex;
      activeIndex = targetIndex + 1 < contract.stages.length ? targetIndex + 1 : -1;
    } else {
      completedThroughIndex = targetIndex - 2;
      activeIndex = targetIndex - 1;
    }

    const reconciledStages = [];
    for (let index = 0; index < contract.stages.length; index += 1) {
      const stage = contract.stages[index];
      const stageStatus = desiredOverrideStatus({ index, completedThroughIndex, activeIndex });
      const data = stageOverrideData({ stage, stageStatus, now });
      await db.contractStage.update({ where: { id: Number(stage.id) }, data });
      reconciledStages.push({ ...stage, ...data });
    }

    const activeStage = activeIndex >= 0 ? reconciledStages[activeIndex] : null;
    await db.contract.update({
      where: { id: contract.id },
      data: { status: CONTRACT_STATUSES.IN_PROGRESS },
    });
    if (activeStage) {
      await upsertDeliveryScheduleForStage({ db, stageId: activeStage.id, now });
    }

    const hasUnfinishedStages = reconciledStages.some(
      (stage) => stage.stageStatus !== WORK_STAGE_STATUSES.COMPLETED,
    );
    const completed = hasUnfinishedStages
      ? false
      : await updateContractStatusToCompletedIfNoOtherPaymentsOrStages({ contractId, db });

    const targetStage = reconciledStages[targetIndex];
    return {
      contractId: contract.id,
      clientLeadId: contract.clientLeadId,
      projectGroupId: contract.projectGroupId,
      previousStatus: contract.stages[targetIndex].stageStatus,
      stage: targetStage,
      activeStage,
      contractStatus: completed ? CONTRACT_STATUSES.COMPLETED : CONTRACT_STATUSES.IN_PROGRESS,
    };
  });

  const relatedProjectType = stageLevelRelatedProject[result.activeStage?.title];
  if (relatedProjectType) {
    await assignDesignersForStageRelatedProject({
      groupId: result.projectGroupId,
      projectType: relatedProjectType,
      leadId: result.clientLeadId,
    });
  }
  return result;
}

export async function checkIfProjectHasPaymentAndUpdate({ projectId, status }) {
  const where = {
    projectId: Number(projectId),
    status: CONTRACT_PAYMENT_STATUSES.NOT_DUE,
    paymentCondition: status,
  };
  return await updateContractPaymentStatusToDue({ where });
}

export async function updateContractPaymentStatusToDue({ where }) {
  return await prisma.contractPayment.updateMany({
    where,
    data: {
      status: CONTRACT_PAYMENT_STATUSES.DUE,
    },
  });
}

export async function updateContractPaymentOnContractSign({ contractId }) {
  const where = {
    contractId: Number(contractId),
    status: CONTRACT_PAYMENT_STATUSES.NOT_DUE,
    paymentCondition: "SIGNATURE",
  };
  return await updateContractPaymentStatusToDue({ where });
}

async function upsertDeliveryScheduleForStage({ db = prisma, stageId, now = new Date() }) {
  const stage = await db.contractStage.findUnique({
    where: { id: Number(stageId) },
    select: {
      id: true,
      title: true,
      deptDeliveryDays: true,
      startDate: true,
      contract: {
        select: {
          clientLeadId: true,
          projectGroupId: true,
        },
      },
    },
  });
  if (!stage) return null;

  const days = Number(stage.deptDeliveryDays ?? 0);
  const deliveryAt = new Date(stage.startDate ?? now);
  deliveryAt.setDate(deliveryAt.getDate() + days);
  const projectType = stageLevelRelatedProject[stage.title];
  const data = {
    deliveryAt,
    projectId: null,
  };
  if (projectType) {
    const relatedProject = await db.project.findFirst({
      where: {
        clientLeadId: stage.contract.clientLeadId,
        groupId: stage.contract.projectGroupId,
        type: projectType,
      },
      select: {
        id: true,
      },
    });
    data.projectId = relatedProject?.id ?? null;
  }

  return db.deliverySchedule.upsert({
    where: { stageId: Number(stageId) },
    update: data,
    create: { ...data, stageId: Number(stageId) },
  });
}

export async function createADeliveryScheduleAndRelateItToStage({ stageId }) {
  return upsertDeliveryScheduleForStage({ stageId: Number(stageId) });
}

export async function getContractForCancellation({ contractId }) {
  return prisma.contract.findUnique({
    where: {
      id: Number(contractId),
    },
  });
}

export async function setContractCancelled({ contractId }) {
  return prisma.contract.update({
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
  RECEIVED: CONTRACT_PAYMENT_STATUSES.RECEIVED,
  TRANSFERRED: CONTRACT_PAYMENT_STATUSES.TRANSFERRED,
  DUE: CONTRACT_PAYMENT_STATUSES.DUE,
  NOT_DUE: CONTRACT_PAYMENT_STATUSES.NOT_DUE,
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
  status = CONTRACT_PAYMENT_STATUSES.DUE,
  user,
}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * take;

  const filterStatus = status && status !== "ALL" ? status : null;

  // Count contracts that match the filter (have at least one payment with that status)
  const whereForCount = filterStatus
    ? { paymentsNew: { some: { status: filterStatus } } }
    : { paymentsNew: { some: {} } };
  if (
    user &&
    !user.isAdminTier &&
    user.currentProfileKey !== PROFILES.SUPER_SALES
  ) {
    whereForCount.clientLead = {
      userId: user.id,
    };
  }
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
          stageStatus: WORK_STAGE_STATUSES.IN_PROGRESS,
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
        amountLost: toNumber(p.amountLost),
        amountReceived: toNumber(p.amountReceived),
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
export async function updateContractPaymentAmounts({
  paymentId,
  amountLost,
  amountReceived,
  status,
}) {
  const payment = await prisma.contractPayment.findUnique({
    where: { id: Number(paymentId) },
    select: { amount: true, paymentCondition: true, contractId: true },
  });
  if (!payment) {
    throw new AppError({ code: contractsMessagesCodes.CONTRACT_PAYMENT_NOT_FOUND, statusCode: 404 });
  }
  const contract = await prisma.contract.findFirst({
    where: { id: payment.contractId },
    select: { taxRate: true },
  });
  const taxRate = contract?.taxRate ?? 5;
  const lost = Number(amountLost ?? 0);
  const received = Number(amountReceived ?? 0);
  // const total = Number(payment.amount ?? 0);
  const total = withTax(payment.amount, taxRate);
  if (Number.isNaN(lost) || Number.isNaN(received)) {
    throw new AppError({ code: contractsMessagesCodes.CONTRACT_PAYMENT_AMOUNTS_INVALID, statusCode: 400 });
  }

  if (lost + received > total) {
    throw new AppError({ code: contractsMessagesCodes.CONTRACT_PAYMENT_AMOUNTS_EXCEED_TOTAL, statusCode: 400 });
  }

  const updated = prisma.contractPayment.update({
    where: { id: Number(paymentId) },
    data: {
      amountLost: lost,
      amountReceived: received,
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
  return updated;
}
// export const stageLevelRelatedProject = {
//   LEVEL_2: "2D_Study",
//   LEVEL_3: "3D_Designer",
//   LEVEL_4: "2D_Final_Plans",
//   LEVEL_5: "2D_Quantity_Calculation",
// };

export async function assignDesignersForProjectsInContractIfAutoAssigned({
  leadId,
}) {
  const inProgressContracts = await prisma.contract.findMany({
    where: {
      clientLeadId: Number(leadId),
      status: WORK_STAGE_STATUSES.IN_PROGRESS,
    },
    include: {
      stages: {
        where: {
          stageStatus: WORK_STAGE_STATUSES.IN_PROGRESS,
        },
      },
    },
  });
  for (const contract of inProgressContracts) {
    for (const stage of contract.stages) {
      try {
        const projectType = stageLevelRelatedProject[stage.title];
        if (!projectType) continue;

        const projectGroupId = contract.projectGroupId;

        const userAutoAssignments = await prisma.autoAssignment.findMany({
          where: {
            type: projectType,
          },
        });

        if (!userAutoAssignments || userAutoAssignments.length === 0) continue;

        const project = await prisma.project.findFirst({
          where: {
            clientLeadId: Number(leadId),
            groupId: projectGroupId,
            type: projectType,
          },
        });
        if (!project) continue;
        for (const assignment of userAutoAssignments) {
          const userId = assignment.userId;
          if (!userId) continue;
          await assignProjectToUser({
            projectId: project.id,
            userId: Number(userId),
            groupId: projectGroupId,
          });
        }
      } catch (err) {
        // هنا بنطنّش أي error حصل في الstage ده ونكمّل على اللي بعده
        console.error("Error in single contract/stage auto-assign", {
          error: err,
          leadId,
          contractId: contract.id,
          stageId: stage.id,
        });
        // مفيش throw => نكمل باقي اللوب
      }
    }
  }
}

export async function assignDesignersForStageRelatedProject({
  projectType,
  leadId,
  groupId,
}) {
  try {
    const userAutoAssignments = await prisma.autoAssignment.findMany({
      where: {
        type: projectType,
      },
    });

    if (!userAutoAssignments || userAutoAssignments.length === 0) return;

    const project = await prisma.project.findFirst({
      where: {
        clientLeadId: Number(leadId),
        groupId: groupId,
        type: projectType,
      },
    });
    if (!project) return;
    for (const assignment of userAutoAssignments) {
      const userId = assignment.userId;
      if (!userId) continue;
      await assignProjectToUser({
        projectId: project.id,
        userId: Number(userId),
        groupId: groupId,
      });
    }
  } catch (err) {
    // هنا بنطنّش أي error حصل في الstage ده ونكمّل على اللي بعده
    console.error("Error in single contract/stage auto-assign", {
      error: err,
      leadId,
      groupId,
    });
  }
}

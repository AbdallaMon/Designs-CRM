import dayjs from "dayjs";
import prisma from "../../../../infra/prisma.js";

const bookingLeadSelect = {
  id: true,
  code: true,
  location: true,
  projectType: true,
  projectStage: true,
  previousWork: true,
  hasArchitecturalPlan: true,
  serviceType: true,
  decisionMaker: true,
  bookingRequestStatus: true,
  bookingSubmittedAt: true,
  client: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      contactAgreement: true,
      contactInitialPriceAgreement: true,
    },
  },
};

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeForLookup(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue || null;
}

async function generateLeadCodeForClient(clientId, tx) {
  const oldestLead = await tx.clientLead.findFirst({
    where: { clientId: Number(clientId) },
    orderBy: { id: "asc" },
    select: { id: true },
  });

  if (!oldestLead) {
    return null;
  }

  const prefix = `${String(oldestLead.id).padStart(7, "0")}.`;

  const lastWithCode = await tx.clientLead.findFirst({
    where: {
      clientId: Number(clientId),
      code: { startsWith: prefix },
    },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  const nextSeq = lastWithCode
    ? (parseInt(lastWithCode.code.split(".").pop(), 10) || 0) + 1
    : 1;

  return `${prefix}${nextSeq}`;
}

async function findExistingClientForSubmit(tx, { currentClientId, email }) {
  const normalizedEmail = normalizeForLookup(email);

  let byEmail = null;

  if (normalizedEmail) {
    byEmail = await tx.client.findFirst({
      where: {
        id: { not: currentClientId },
        email: normalizedEmail,
      },
      select: { id: true },
    });
  }

  if (byEmail) {
    return byEmail;
  }

  return null;
}

export class BookingLeadsRepository {
  async createDraft({ clientDraft }) {
    return prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: clientDraft,
        select: { id: true },
      });

      return tx.clientLead.create({
        data: {
          clientId: client.id,
          selectedCategory: "CONSULTATION",
          bookingRequestStatus: "IN_PROGRESS",
        },
        select: bookingLeadSelect,
      });
    });
  }

  async findById(leadId) {
    return prisma.clientLead.findUnique({
      where: { id: leadId },
      select: bookingLeadSelect,
    });
  }

  async updateStep({ leadId, clientId, leadData, clientData }) {
    return prisma.$transaction(async (tx) => {
      if (clientData && Object.keys(clientData).length > 0) {
        await tx.client.update({
          where: { id: clientId },
          data: clientData,
        });
      }

      if (leadData && Object.keys(leadData).length > 0) {
        await tx.clientLead.update({
          where: { id: leadId },
          data: leadData,
        });
      }

      return tx.clientLead.findUnique({
        where: { id: leadId },
        select: bookingLeadSelect,
      });
    });
  }

  async submit({ leadId, clientId, leadData, clientData }) {
    return prisma.$transaction(async (tx) => {
      const hasSubmittedToday = await this.checkIfClientSubmittedLeadToday(
        clientData.email,
      );
      if (hasSubmittedToday) {
        throw createHttpError(409, "booking.alreadySubmittedToday");
      }

      const existingClient = await findExistingClientForSubmit(tx, {
        currentClientId: clientId,
        email: clientData.email,
      });

      let targetClientId = clientId;

      if (existingClient) {
        targetClientId = existingClient.id;

        await tx.client.update({
          where: { id: targetClientId },
          data: clientData,
        });

        await tx.clientLead.update({
          where: { id: leadId },
          data: {
            ...leadData,
            clientId: targetClientId,
          },
        });

        const draftClientLeadsCount = await tx.clientLead.count({
          where: { clientId },
        });

        if (draftClientLeadsCount === 0) {
          await tx.client.delete({
            where: { id: clientId },
          });
        }
      } else {
        await tx.client.update({
          where: { id: clientId },
          data: clientData,
        });

        await tx.clientLead.update({
          where: { id: leadId },
          data: leadData,
        });
      }

      const currentLead = await tx.clientLead.findUnique({
        where: { id: leadId },
        select: {
          id: true,
          clientId: true,
          code: true,
        },
      });

      if (currentLead && !currentLead.code) {
        const generatedCode = await generateLeadCodeForClient(
          currentLead.clientId,
          tx,
        );

        if (generatedCode) {
          await tx.clientLead.update({
            where: { id: leadId },
            data: { code: generatedCode },
          });
        }
      }

      return tx.clientLead.findUnique({
        where: { id: leadId },
        select: bookingLeadSelect,
      });
    });
  }

  async checkIfClientSubmittedLeadToday(email) {
    const todayStart = dayjs().startOf("day");
    const todayEnd = dayjs().endOf("day");
    const existingLead = await prisma.clientLead.findFirst({
      where: {
        client: { email },
        createdAt: { gte: todayStart.toDate(), lte: todayEnd.toDate() },
      },
    });
    return !!existingLead;
  }
}

import dayjs from "dayjs";
import prisma from "../../../../infra/prisma/prisma.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import { BOOKING_LEAD_REQUEST_STATUSES, LEAD_CATEGORIES, leadsMessagesCodes, messagesNames } from "@dms/shared";

const TK = messagesNames.leadsMessages;

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
  source: true,
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
  async createDraft({ clientDraft, source }) {
    return prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: clientDraft,
        select: { id: true },
      });

      return tx.clientLead.create({
        data: {
          clientId: client.id,
          selectedCategory: LEAD_CATEGORIES.CONSULTATION,
          bookingRequestStatus: BOOKING_LEAD_REQUEST_STATUSES.IN_PROGRESS,
          ...(source ? { source } : {}),
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
  async findByEmail(email) {
    const normalizedEmail = normalizeForLookup(email);
    if (!normalizedEmail) {
      return null;
    }
    return prisma.clientLead.findFirst({
      where: {
        client: { email: normalizedEmail },
      },
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
      const claimed = await tx.clientLead.updateMany({
        where: {
          id: Number(leadId),
          bookingRequestStatus: { not: BOOKING_LEAD_REQUEST_STATUSES.SUBMITTED },
        },
        data: {
          bookingRequestStatus: BOOKING_LEAD_REQUEST_STATUSES.SUBMITTED,
          bookingSubmittedAt: leadData.bookingSubmittedAt,
        },
      });
      if (claimed.count !== 1) return null;

      const hasSubmittedToday = await this.checkIfClientSubmittedLeadToday(
        clientData.email,
        { client: tx, excludeLeadId: leadId },
      );
      if (hasSubmittedToday) {
        throw new AppError({
          code: leadsMessagesCodes.BOOKING_LEAD_ALREADY_SUBMITTED_TODAY,
          statusCode: 409,
          translationKey: TK,
        });
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

  async checkIfClientSubmittedLeadToday(
    email,
    { client = prisma, excludeLeadId } = {},
  ) {
    const todayStart = dayjs().startOf("day");
    const todayEnd = dayjs().endOf("day");
    const existingLead = await client.clientLead.findFirst({
      where: {
        ...(excludeLeadId ? { id: { not: Number(excludeLeadId) } } : {}),
        client: { email },
        createdAt: { gte: todayStart.toDate(), lte: todayEnd.toDate() },
      },
    });
    return !!existingLead;
  }
}

export const bookingLeadsRepository = new BookingLeadsRepository();

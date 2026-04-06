import prisma from "../../../infra/prisma.js";

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

async function findExistingClientForSubmit(
  tx,
  { currentClientId, email, phone },
) {
  const normalizedEmail = normalizeForLookup(email);
  const normalizedPhone = normalizeForLookup(phone);

  let byEmail = null;
  let byPhone = null;

  if (normalizedEmail) {
    byEmail = await tx.client.findFirst({
      where: {
        id: { not: currentClientId },
        email: normalizedEmail,
      },
      select: { id: true },
    });
  }

  if (normalizedPhone) {
    byPhone = await tx.client.findFirst({
      where: {
        id: { not: currentClientId },
        phone: normalizedPhone,
      },
      orderBy: { id: "asc" },
      select: { id: true },
    });
  }

  if (byEmail && byPhone && byEmail.id !== byPhone.id) {
    throw createHttpError(
      409,
      "Cannot submit: email and phone are linked to different existing clients",
    );
  }

  if (byEmail) {
    return byEmail;
  }

  if (byPhone) {
    return byPhone;
  }

  return null;
}

export async function createBookingLeadDraft({ location, clientDraft }) {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: clientDraft,
      select: { id: true },
    });

    return tx.clientLead.create({
      data: {
        clientId: client.id,
        selectedCategory: "CONSULTATION",
        location,
        bookingRequestStatus: "IN_PROGRESS",
      },
      select: bookingLeadSelect,
    });
  });
}

export async function findBookingLeadById(leadId) {
  return prisma.clientLead.findUnique({
    where: { id: leadId },
    select: bookingLeadSelect,
  });
}

export async function updateBookingLeadStep({
  leadId,
  clientId,
  leadData,
  clientData,
}) {
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

export async function submitBookingLead({
  leadId,
  clientId,
  leadData,
  clientData,
}) {
  return prisma.$transaction(async (tx) => {
    const existingClient = await findExistingClientForSubmit(tx, {
      currentClientId: clientId,
      email: clientData.email,
      phone: clientData.phone,
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

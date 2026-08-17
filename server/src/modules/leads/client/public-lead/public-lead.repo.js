// leads/client/public-lead repository — ALL Prisma I/O for the PUBLIC website lead funnel.
// Mirrors the legacy `routes/client/leads.js` queries 1:1 (find/create Client, find today's
// existing lead, create/update ClientLead, attach a File). Code generation + side-effecting
// notifications/email live in the usecase via lazy adapters (frozen legacy services), never
// here.
import dayjs from "dayjs";
import prisma from "../../../../infra/prisma/prisma.js";

export class PublicLeadRepository {
  findClientByEmail(email) {
    return prisma.client.findUnique({ where: { email } });
  }

  createClient({ name, phone, email }) {
    return prisma.client.create({
      data: { name, phone: phone.replace(/\s+/g, ""), email },
    });
  }

  // Legacy: any lead created by this email today blocks a new submission.
  findTodaysLeadByEmail(email) {
    const todayStart = dayjs().startOf("day");
    const todayEnd = dayjs().endOf("day");
    return prisma.clientLead.findFirst({
      where: {
        client: { email },
        createdAt: { gte: todayStart.toDate(), lte: todayEnd.toDate() },
      },
    });
  }

  updateClientPhone(clientId, phone) {
    return prisma.client.update({
      where: { id: clientId },
      data: { phone },
    });
  }

  createLead(data) {
    return prisma.clientLead.create({ data });
  }

  findLeadById(id) {
    return prisma.clientLead.findUnique({ where: { id: Number(id) } });
  }

  findRegistrationStatusById(id) {
    return prisma.clientLead.findUnique({
      where: { id: Number(id) },
      select: { id: true, description: true, type: true },
    });
  }

  updateLead(id, data) {
    return prisma.clientLead.update({ where: { id: Number(id) }, data });
  }

  completeRegistrationDraft({ id, clientId, leadData, clientData }) {
    return prisma.$transaction(async (tx) => {
      const claimed = await tx.clientLead.updateMany({
        where: {
          id: Number(id),
          description: "Didn't complete register yet",
        },
        data: leadData,
      });
      if (claimed.count !== 1) return null;

      if (clientData && Object.keys(clientData).length > 0) {
        await tx.client.update({
          where: { id: Number(clientId) },
          data: clientData,
        });
      }

      return tx.clientLead.findUnique({ where: { id: Number(id) } });
    });
  }

  findClientById(id) {
    return prisma.client.findUnique({ where: { id: Number(id) } });
  }
}

export const publicLeadRepository = new PublicLeadRepository();

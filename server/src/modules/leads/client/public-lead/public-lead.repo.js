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

  updateLead(id, data) {
    return prisma.clientLead.update({ where: { id: Number(id) }, data });
  }

  findClientById(id) {
    return prisma.client.findUnique({ where: { id: Number(id) } });
  }
}

export const publicLeadRepository = new PublicLeadRepository();

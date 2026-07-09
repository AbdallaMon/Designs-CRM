// client-portal/payments repository — ALL Prisma I/O for the client checkout flow. Mirrors
// the legacy `routes/client/payments.js` queries 1:1 (read lead+client for the reminder
// email, read paymentStatus before marking paid, mark FULLY_PAID + persist the session id and
// the normalized billing KV).
import prisma from "../../../infra/prisma/prisma.js";

export class PaymentsRepository {
  // For the /pay reminder email — the lead's owning client contact.
  getLeadWithClient(clientLeadId) {
    return prisma.clientLead.findUnique({
      where: { id: Number(clientLeadId) },
      select: {
        id: true,
        client: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // For /payment-status — current payment status + client contact (success email).
  getLeadPaymentState(clientLeadId) {
    return prisma.clientLead.findUnique({
      where: { id: Number(clientLeadId) },
      select: {
        id: true,
        paymentStatus: true,
        client: { select: { name: true, email: true } },
      },
    });
  }

  markFullyPaid(clientLeadId, sessionId) {
    return prisma.clientLead.update({
      where: { id: Number(clientLeadId) },
      data: { paymentStatus: "FULLY_PAID", paymentSessionId: sessionId },
    });
  }

  saveStripeMetadata(clientLeadId, kv) {
    return prisma.clientLead.update({
      where: { id: Number(clientLeadId) },
      data: { stripieMetadata: kv },
    });
  }
}

export const paymentsRepository = new PaymentsRepository();

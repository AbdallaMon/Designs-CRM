// leads/payment repository — Prisma I/O ONLY (no business rules, no Stripe, no email).
// Ported verbatim from the legacy shared/legacy/payment-services.js Prisma calls
// (makePayments / makeExtraServicePayments / remindUserToPay / remindUserToCompleteRegister).
// The Stripe + email side effects live in payment.usecase.js.
import prisma from "../../../infra/prisma/prisma.js";

class PaymentRepository {
  createManyPayments({ data }) {
    return prisma.payment.createMany({ data });
  }

  createExtraService({ clientLeadId, price, note }) {
    return prisma.extraService.create({
      data: {
        clientLeadId: Number(clientLeadId),
        price: Number(price),
        note: note,
      },
    });
  }

  findLeadForPayment({ clientLeadId }) {
    return prisma.clientLead.findUnique({
      where: { id: Number(clientLeadId) },
      select: {
        id: true,
        paymentSessionId: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  updatePaymentSessionId({ id, paymentSessionId }) {
    return prisma.clientLead.update({
      where: { id: Number(id) },
      data: {
        paymentSessionId,
      },
    });
  }

  findLeadForRegister({ clientLeadId }) {
    return prisma.clientLead.findUnique({
      where: { id: Number(clientLeadId) },
      select: {
        id: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

export const paymentRepository = new PaymentRepository();
export { PaymentRepository };

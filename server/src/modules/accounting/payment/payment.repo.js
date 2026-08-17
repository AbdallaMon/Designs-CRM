import { PAYMENT_STATUSES } from "@dms/shared";
// accounting/payment repository — Prisma I/O ONLY (no business rules, no AppError).
// The financial reads/writes relocated here from the legacy accountant service are pure
// Prisma; the money guards/orchestration (processPayment / markPaymentAsOverdue) live in
// payment.usecase.js and call these methods. `findPaymentState` remains the minimal
// existence read the workflow-action scope checker needs.
import prisma from "../../../infra/prisma/prisma.js";
import { generateInvoiceNumber } from "./payment.helpers.js";

class PaymentRepository {
  model = prisma.payment;

  runInTransaction(work) {
    return prisma.$transaction(work);
  }

  lockPaymentForUpdate({ id, client }) {
    return client.$queryRaw`SELECT id FROM Payment WHERE id = ${id} FOR UPDATE`;
  }

  // Server-authoritative current state for the scope/guard checker. Returns null when
  // the payment does not exist (the usecase turns that into 404 PAYMENT_NOT_FOUND).
  findPaymentState({ paymentId }) {
    return prisma.payment.findUnique({
      where: { id: Number(paymentId) },
      select: { id: true, status: true, paymentLevel: true, amount: true, amountPaid: true },
    });
  }

  // ── reads (relocated verbatim from legacy getPayments) ───────────────────────────
  async getPayments({
    limit = 1,
    skip = 10,
    status,
    paymentId,
    clientId,
    level,
    filters,
  }) {
    let where = {};

    if (!status || status === "ALL") status = undefined;
    if (status === PAYMENT_STATUSES.NOT_PAID) {
      where = { status: { in: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.OVERDUE, PAYMENT_STATUSES.PARTIALLY_PAID] } };
    } else {
      where =
        paymentId && paymentId !== "null"
          ? { id: Number(paymentId) }
          : {
              status: status,
            };
    }
    if (level && level !== "ALL") {
      where.paymentLevel = level;
    }

    if (clientId) {
      where.clientLead = {
        clientId: Number(clientId),
      };
    }
    console.log(where, "where");
    if (
      filters?.clientId &&
      filters.clientId !== "all" &&
      filters.clientId !== null
    ) {
      where.clientLead = {
        clientId: Number(filters.clientId),
      };
    }
    let pagination = {};
    if (status !== PAYMENT_STATUSES.NOT_PAID) {
      pagination = {
        skip,
        take: limit,
      };
    }
    const payments = await prisma.payment.findMany({
      where,
      ...pagination,
      select: {
        id: true,
        amount: true,
        amountPaid: true,
        amountLeft: true,
        status: true,
        paymentLevel: true,
        createdAt: true,
        paymentReason: true,
        invoices: {
          select: {
            amount: true,
            issuedDate: true,
            invoiceNumber: true,
          },
        },
        clientLead: {
          select: {
            id: true,
            description: true,
            selectedCategory: true,
            type: true,
            averagePrice: true,
            emirate: true,
            priceNote: true,
            priceOffers: {
              select: {
                note: true,
                url: true,
              },
            },
            extraServices: {
              select: { price: true, note: true },
            },
            client: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });
    const total = await prisma.payment.count({ where });
    const totalPages = Math.ceil(total / limit);
    console.log(payments, "payments");
    return {
      data: payments,
      total,
      totalPages,
    };
  }

  getListOfPaymentInvoices(paymentId) {
    return prisma.invoice.findMany({
      where: {
        paymentId: Number(paymentId),
      },
      orderBy: {
        issuedDate: "desc",
      },
      select: {
        issuedDate: true,
        amount: true,
        invoiceNumber: true,
        notes: {
          select: {
            attachment: true,
          },
        },
      },
    });
  }

  // ── payment-level change (relocated verbatim from legacy changePaymentLevel) ──────
  changePaymentLevel(paymentId, newPaymentLevel, oldPaymentLevel) {
    return prisma.payment.update({
      where: { id: Number(paymentId) },
      data: {
        paymentLevel: newPaymentLevel,
      },
    });
  }

  // ── reads/writes backing the money workflow usecase methods ──────────────────────
  findPayment({ id, client }) {
    return (client ?? prisma).payment.findUnique({
      where: { id },
    });
  }

  updatePaymentAmounts({ id, amountPaid, status, amountLeft, client }) {
    return (client ?? prisma).payment.update({
      where: { id },
      data: {
        amountPaid,
        status,
        amountLeft,
      },
    });
  }

  createInvoice({ paymentId, amount, issuedDate, client }) {
    return (client ?? prisma).invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        paymentId,
        amount,
        issuedDate,
      },
    });
  }

  createInvoiceNote({ attachment, invoiceId, userId, client }) {
    return (client ?? prisma).note.create({
      data: {
        attachment,
        invoiceId,
        userId,
      },
    });
  }

  updatePaymentOverdue({ id }) {
    return prisma.payment.update({
      where: { id },
      data: {
        status: PAYMENT_STATUSES.OVERDUE,
      },
    });
  }
}

export const paymentRepository = new PaymentRepository();
export { PaymentRepository };

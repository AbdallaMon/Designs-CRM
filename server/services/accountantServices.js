import dayjs from "dayjs";
import prisma from "../prisma/prisma.js";

export async function getPayments({
  status,
  paymentId,
  clientId,
  startOfMonth,
  endOfMonth,
  type,
  range,
}) {
  let where = {};

  const today = dayjs().startOf("day");
  if (!status || status === "ALL") status = undefined;
  await prisma.payment.updateMany({
    where: {
      dueDate: {
        lt: today.toDate(),
      },
      status: {
        in: ["PENDING", "PARTIALLY_PAID"],
      },
      amountLeft: {
        gt: 0,
      },
    },
    data: {
      status: "OVERDUE",
    },
  });
  if (type === "OVERDUE") {
    where.status = "OVERDUE";
  } else {
    where = paymentId
      ? { id: Number(paymentId) }
      : {
          dueDate: {
            gte: new Date(startOfMonth),
            lte: new Date(endOfMonth),
          },
          status: status,
        };
  }
  if (range) {
    const { startDate, endDate } = range;
    const now = dayjs();
    let start = startDate ? dayjs(startDate) : now.subtract(30, "days");
    let end = endDate ? dayjs(endDate).endOf("day") : now;
    where.dueDate = {
      gte: start.toDate(),
      lte: end.toDate(),
    };
  }
  if (clientId) {
    where.clientLead = {
      clientId: Number(clientId),
    };
  }
  const payments = await prisma.payment.findMany({
    where,
    select: {
      id: true,
      amount: true,
      amountPaid: true,
      amountLeft: true,
      status: true,
      dueDate: true,
      createdAt: true,
      paymentReason: true,
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
  return payments;
}

export async function processPayment(paymentId, amount, issuedDate) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  const pendingAmount = payment.amount - (payment.amountPaid || 0);

  if (amount > pendingAmount) {
    throw new Error(
      `Invalid Payment: The pending amount is ${pendingAmount}. The amount provided (${amount}) exceeds the pending balance.`
    );
  }

  if (amount <= 0) {
    throw new Error(
      `Invalid Payment: The payment amount must be greater than zero. You provided ${amount}.`
    );
  }

  const newAmountPaid = Number(payment.amountPaid || 0) + Number(amount);
  const isFullyPaid = newAmountPaid >= payment.amount;
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      amountPaid: newAmountPaid,
      status: isFullyPaid ? "FULLY_PAID" : "PENDING",
      amountLeft: payment.amount - newAmountPaid,
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      paymentId: payment.id,
      amount: amount,
      issuedDate: issuedDate,
    },
  });
  return {
    ...payment,
    amountPaid: newAmountPaid,
    status: isFullyPaid ? "FULLY_PAID" : "PENDING",
    invoiceNumber: invoice.invoiceNumber,
    invoiceId: invoice.id,
  };
}

function generateInvoiceNumber() {
  return "INV-" + Date.now();
}

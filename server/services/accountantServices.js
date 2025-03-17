import dayjs from "dayjs";
import prisma from "../prisma/prisma.js";

export async function getPayments({
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

  where =
    paymentId && paymentId !== "null"
      ? { id: Number(paymentId) }
      : {
          status: status,
        };
  if (level && level !== "ALL") {
    where.paymentLevel = level;
  }

  if (clientId) {
    where.clientLead = {
      clientId: Number(clientId),
    };
  }
  if (
    filters?.clientId &&
    filters.clientId !== "all" &&
    filters.clientId !== null
  ) {
    where.clientLead = {
      clientId: Number(filters.clientId),
    };
  }
  const payments = await prisma.payment.findMany({
    where,
    skip,
    take: limit,
    select: {
      id: true,
      amount: true,
      amountPaid: true,
      amountLeft: true,
      status: true,
      paymentLevel: true,
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
  const total = await prisma.payment.count({ where });
  const totalPages = Math.ceil(total / limit);

  return {
    data: payments,
    total,
    totalPages,
  };
}

// Define the PaymentLevel as a JavaScript object
const PaymentLevel = {
  LEVEL_1: "LEVEL_1",
  LEVEL_2: "LEVEL_2",
  LEVEL_3: "LEVEL_3",
  LEVEL_4: "LEVEL_4",
  LEVEL_5: "LEVEL_5",
  LEVEL_6: "LEVEL_6",
  LEVEL_7_OR_MORE: "LEVEL_7_OR_MORE",
};

function getNextPaymentLevel(currentLevel) {
  switch (currentLevel) {
    case PaymentLevel.LEVEL_1:
      return PaymentLevel.LEVEL_2;
    case PaymentLevel.LEVEL_2:
      return PaymentLevel.LEVEL_3;
    case PaymentLevel.LEVEL_3:
      return PaymentLevel.LEVEL_4;
    case PaymentLevel.LEVEL_4:
      return PaymentLevel.LEVEL_5;
    case PaymentLevel.LEVEL_5:
      return PaymentLevel.LEVEL_6;
    case PaymentLevel.LEVEL_6:
      return PaymentLevel.LEVEL_7_OR_MORE;
    case PaymentLevel.LEVEL_7_OR_MORE:
      return PaymentLevel.LEVEL_7_OR_MORE; // Already at the highest level
    default:
      // If null, undefined, or invalid value is provided
      return PaymentLevel.LEVEL_1; // Default to first level
  }
}

export async function processPayment(paymentId, amount, issuedDate) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }
  if (
    payment.status === "FULLY_PAID" &&
    payment.amountPaid === payment.amount
  ) {
    throw new Error(
      "Invalid Payment: The payment has already been fully paid."
    );
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

  const newPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      amountPaid: newAmountPaid,
      status: isFullyPaid ? "FULLY_PAID" : "PENDING",
      amountLeft: payment.amount - newAmountPaid,
      paymentLevel: getNextPaymentLevel(payment.paymentLevel),
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
    ...newPayment,
    amountPaid: newAmountPaid,
    status: isFullyPaid ? "FULLY_PAID" : "PENDING",
    invoiceNumber: invoice.invoiceNumber,
    invoiceId: invoice.id,
  };
}

function generateInvoiceNumber() {
  return "INV-" + Date.now();
}

export async function markPaymentAsOverdue(paymentId) {
  const payment = await prisma.payment.findUnique({
    where: { id: Number(paymentId) },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status === "FULLY_PAID") {
    throw new Error(
      "Invalid Payment: The payment has already been fully paid."
    );
  }

  const newPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "OVERDUE",
    },
  });

  return newPayment;
}

export async function getNotes({ idKey, id }) {
  const notes = await prisma.note.findMany({
    where: {
      [idKey]: Number(id),
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return notes;
}
export async function addNote({ userId, content, idKey, id }) {
  const data = {
    content,
    userId: Number(userId),
  };
  if (idKey && id) {
    data[idKey] = Number(id);
  }
  const note = await prisma.note.create({
    data,
  });

  return { data: note, message: "Note created successfully" };
}

export async function getOperationalExpenses({ limit = 1, skip = 10 }) {
  const expenses = await prisma.OperationalExpenses.findMany({
    skip,
    take: limit,
    select: {
      id: true,
      amount: true,
      description: true,
      category: true,
      createdAt: true,
      paymentDate: true,
    },
  });
  const total = await prisma.OperationalExpenses.count();
  const totalPages = Math.ceil(total / limit);

  return {
    data: expenses,
    total,
    totalPages,
  };
}

export async function createOperationalExpense({
  category,
  amount,
  description,
  paymentDate,
}) {
  if (!category || !amount || !paymentDate) {
    throw new Error("Fill all the fields please");
  }

  amount = Number(amount);
  const newExpense = await prisma.OperationalExpenses.create({
    data: {
      category,
      amount,
      description,
      paymentDate: new Date(paymentDate),
      paymentStatus: "FULLY_PAID",
    },
  });
  const outcome = await prisma.outcome.create({
    data: {
      amount,
      description,
      type: "OPERATIONAL_EXPENSE",
      createdAt: new Date(paymentDate),
      operationalExpenses: {
        connect: {
          id: newExpense.id,
        },
      },
    },
  });

  return {
    data: newExpense,
    message: "Operational Expense created successfully",
  };
}

export async function getRents({ limit = 1, skip = 10 }) {
  let rents = await prisma.Rent.findMany({
    skip,
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      rentPeriods: {
        select: {
          amount: true,
          startDate: true,
          endDate: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  rents = rents.map((rent) => ({
    ...rent,
    rentPeriods: rent.rentPeriods[0] || null,
  }));
  const total = await prisma.Rent.count();
  const totalPages = Math.ceil(total / limit);

  return {
    data: rents,
    total,
    totalPages,
  };
}

export async function createARent(data) {
  let { name, amount, description, startDate, endDate, paymentDate } = data;
  if (!name || !amount || !startDate || !endDate || !paymentDate) {
    throw new Error("Fill all the fields please");
  }

  amount = Number(amount);

  const newRent = await prisma.Rent.create({
    data: {
      name,
      description,
    },
  });

  const newRentPeriod = await renewRentAndMakeOutCome({
    rentId: newRent.id,
    amount,
    description,
    startDate,
    endDate,
    paymentDate,
  });
  let createdRent = await prisma.Rent.findUnique({
    where: { id: newRent.id },
    select: {
      id: true,
      name: true,
      description: true,
      rentPeriods: {
        select: {
          amount: true,
          startDate: true,
          endDate: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });
  createdRent = {
    ...createdRent,
    rentPeriods: createdRent.rentPeriods[0] || null,
  };

  return {
    data: createdRent,
    message: "Rent created successfully",
  };
}

export async function renewRentAndMakeOutCome({
  rentId,
  amount,
  startDate,
  endDate,
  paymentDate,
  description,
}) {
  if (!rentId || !amount || !startDate || !endDate) {
    throw new Error("Fill all the fields please");
  }

  amount = Number(amount);
  const rent = await prisma.Rent.findUnique({
    where: { id: rentId },
  });

  if (!rent) {
    throw new Error("Rent not found");
  }

  const newRentPeriod = await prisma.RentPeriod.create({
    data: {
      amount,
      rentId: rent.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isPaid: true,
    },
  });

  const outcome = await prisma.outcome.create({
    data: {
      amount,
      description: description || "Renewing rent",
      type: "RENT",
      createdAt: new Date(paymentDate),
      rentPeriods: {
        connect: {
          id: newRentPeriod.id,
        },
      },
    },
  });

  return {
    data: newRentPeriod,
    message: "Rent renewed successfully",
  };
}

export async function getOutcomes({ limit = 1, skip = 10, filters }) {
  const where = {};
  if (filters?.range) {
    const { startDate, endDate } = filters.range;
    const now = dayjs();
    let start = startDate ? dayjs(startDate) : now.subtract(30, "days");
    let end = endDate ? dayjs(endDate).endOf("day") : now;
    where.createdAt = {
      gte: start.toDate(),
      lte: end.toDate(),
    };
  }
  const outcomes = await prisma.outcome.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });
  const aggregations = await prisma.outcome.aggregate({
    _sum: {
      amount: true,
    },
  });
  const now = dayjs();
  const startOfMonth = now.startOf("month").toDate();
  const endOfMonth = now.endOf("month").toDate();

  // Get aggregation for the current month
  const currentMonthAggregation = await prisma.outcome.aggregate({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });
  const total = await prisma.outcome.count();
  const totalPages = Math.ceil(total / limit);
  return {
    data: outcomes,
    total,
    totalPages,
    extraData: {
      totalAmount: aggregations._sum.amount || 0,
      currentMonthAmount: currentMonthAggregation._sum.amount || 0,
    },
  };
}
// model Outcome {
//   id              Int             @id @default(autoincrement())
//   type            String?          @db.VarChar(50) // e.g., "Salary", "Rent", "Operational Expense"
//   amount          Decimal         @db.Decimal(10, 2)
//   description     String?         @db.Text // Optional description
//   createdAt       DateTime        @default(now())
//   updatedAt       DateTime        @updatedAt
//   rentPeriods     RentPeriod[]    // Optional relation back to RentPeriod, making it optional
//   operationalExpenses OperationalExpenses[]  // Optional relation back to OperationalExpenses, making it optional
//   monthlySalaries MonthlySalary[]  // Optional relation back to OperationalExpenses, making it optional
// }

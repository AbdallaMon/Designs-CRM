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
  if (status === "NOT_PAID") {
    where = { status: { in: ["PENDING", "OVERDUE", "PARTIALLY_PAID"] } };
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
  if (status !== "NOT_PAID") {
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

export async function processPayment(
  paymentId,
  amount,
  issuedDate,
  file,
  userId
) {
  if (!amount || !issuedDate) {
    throw new Error("Please fill all data");
  }
  if (issuedDate === "1970-01-01T00:00:00.000Z") {
    throw new Error("Please enter a date");
  }
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
      status:
        payment.status === "OVERDUE" && !isFullyPaid
          ? "OVERDUE"
          : isFullyPaid
          ? "FULLY_PAID"
          : "PENDING",
      amountLeft: payment.amount - newAmountPaid,
      // paymentLevel: getNextPaymentLevel(payment.paymentLevel),
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
  const note = await prisma.note.create({
    data: {
      attachment: file,
      invoiceId: invoice.id,
      userId: Number(userId),
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

export async function changePaymentLevel(
  paymentId,
  newPaymentLevel,
  oldPaymentLevel
) {
  const newPayment = await prisma.payment.update({
    where: { id: Number(paymentId) },
    data: {
      paymentLevel: newPaymentLevel,
    },
  });
  return newPayment;
}

export async function getListOfPaymentInvoices(paymentId) {
  return await prisma.invoice.findMany({
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
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      attachment: true,
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
export async function addNote({ attachment, userId, content, idKey, id }) {
  const data = {
    content,
    userId: Number(userId),
    attachment,
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
      description: `${category} - ${description}`,
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
    name,
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
  name,
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
      description: name || "Renewing rent",
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
  const total = await prisma.outcome.count();
  const totalPages = Math.ceil(total / limit);
  return {
    data: outcomes,
    total,
    totalPages,
  };
}

export async function getUsersWithSalaries(searchParams, limit, skip) {
  const filters = searchParams.filters && JSON.parse(searchParams.filters);
  const staffFilter = searchParams.staffId
    ? { userId: Number(searchParams.staffId) }
    : {};
  let where = {
    role: { not: "ADMIN" },
    ...staffFilter,
  };
  if (filters.status !== undefined) {
    if (filters.status === "active") {
      where.isActive = true;
    } else if (filters.status === "banned") {
      where.isActive = false;
    }
  }
  const users = await prisma.user.findMany({
    where: where,
    skip,
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      lastSeenAt: true,
      role: true,
      baseSalary: {
        select: {
          baseSalary: true,
          taxAmount: true,
          baseWorkHours: true,
        },
      },
    },
  });
  const total = await prisma.user.count({ where: where });

  return { users, total };
}

export async function createBaseSalary({
  userId,
  taxAmount,
  baseSalary,
  baseWorkHours,
}) {
  // Force all number fields to be numbers, even if undefined or null
  userId = Number(userId);
  baseSalary = Number(baseSalary);
  baseWorkHours = Number(baseWorkHours);
  taxAmount = Number(taxAmount || 0); // Default to 0 if not provided

  // Ensure taxAmount is not negative
  if (taxAmount < 0) {
    taxAmount = 0;
  }

  // Create the base salary record after conversion
  const salary = await prisma.BaseEmployeeSalary.create({
    data: {
      userId: userId,
      baseSalary: baseSalary,
      baseWorkHours: baseWorkHours,
      taxAmount: taxAmount,
    },
  });

  return { data: salary, message: "Created succssfully" };
}
export async function editBaseSalary({
  id,
  taxAmount,
  baseSalary,
  baseWorkHours,
}) {
  if (!id || !baseSalary || !baseWorkHours || !taxAmount) {
    throw new Error("Please fill all fiels");
  }
  // Force all number fields to be numbers, even if undefined or null
  baseSalary = Number(baseSalary);
  baseWorkHours = Number(baseWorkHours);
  taxAmount = Number(taxAmount || 0); // Default to 0 if not provided

  // Ensure taxAmount is not negative
  if (taxAmount < 0) {
    taxAmount = 0;
  }
  // Create the base salary record after conversion
  const salary = await prisma.BaseEmployeeSalary.update({
    where: {
      id: Number(id),
    },
    data: {
      baseSalary: baseSalary,
      baseWorkHours: baseWorkHours,
      taxAmount: taxAmount,
    },
  });

  return { data: salary, message: "Updated succssfully" };
}

export async function generateMonthlySalary({
  totalHoursWorked,
  overtimeHours,
  bonuses,
  baseSalaryId,
  deductions,
  netSalary,
  isFulfilled,
  paymentDate,
}) {
  if (!baseSalaryId || !totalHoursWorked || !netSalary || !paymentDate) {
    throw new Error("Fill all the fileds please");
  }
  totalHoursWorked = Number(totalHoursWorked);
  overtimeHours = Number(overtimeHours || 0); // Default to 0 if not provided
  bonuses = Number(bonuses || 0); // Default to 0 if not provided
  deductions = Number(deductions || 0); // Default to 0 if not provided
  netSalary = Number(netSalary); // Ensure netSalary is a number
  baseSalaryId = Number(baseSalaryId);

  // Ensure `isFulfilled` is set to a boolean value (default to false if undefined)
  isFulfilled = isFulfilled === undefined ? false : Boolean(isFulfilled);

  // Handle paymentDate (it can be null)
  paymentDate = paymentDate ? new Date(paymentDate) : null;

  const startOfMonth = dayjs().startOf("month").toDate();
  const endOfMonth = dayjs().endOf("month").toDate();

  const hasMonthly = await prisma.monthlySalary.findFirst({
    where: {
      baseSalary: {
        id: baseSalaryId,
      },
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  // If monthly salary already exists, throw an error
  if (hasMonthly) {
    throw new Error(
      `Monthly salary for ${dayjs().format(
        "MMMM YYYY"
      )} already exists for this user`
    );
  }
  if (paymentDate) {
    paymentDate = new Date(paymentDate);
  }
  // Create a transaction to ensure both salary and outcome are created together
  return await prisma.$transaction(async (prisma) => {
    // Create the new monthly salary record
    const monthlySalary = await prisma.monthlySalary.create({
      data: {
        baseSalaryId: baseSalaryId,
        totalHoursWorked: totalHoursWorked,
        overtimeHours: overtimeHours,
        bonuses: bonuses,
        deductions: deductions,
        netSalary: netSalary,
        isFulfilled: isFulfilled,
        paymentDate: paymentDate,
      },
    });
    const user = await prisma.monthlySalary.findUnique({
      where: { id: monthlySalary.id },
      select: {
        baseSalary: {
          select: {
            employee: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Generate an outcome record linked to the monthly salary
    const outcome = await prisma.outcome.create({
      data: {
        type: "Salary",
        amount: netSalary,
        description: `Monthly salary payment for ${
          user.baseSalary.employee.name
        } ,${dayjs().format("MMMM YYYY")}`,
        monthlySalaries: {
          connect: {
            id: monthlySalary.id,
          },
        },
      },
    });

    const updatedMonthlySalary = await prisma.monthlySalary.update({
      where: {
        id: monthlySalary.id,
      },
      data: {
        outcomeId: outcome.id,
      },
      include: {
        outcome: true,
        baseSalary: {
          include: {
            employee: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return { data: updatedMonthlySalary, message: "Paid succesffully" };
  });
}

export async function getSalaryData(data) {
  const { userId, startDate, endDate } = data;

  const start = startDate
    ? new Date(startDate)
    : dayjs().startOf("month").toDate();
  const end = endDate ? new Date(endDate) : dayjs().endOf("month").toDate();

  // Get base salary and monthly salaries for the user
  const salaryData = await prisma.baseEmployeeSalary.findUnique({
    where: {
      userId: Number(userId),
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      monthlySalaries: {
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          outcome: true,
        },
      },
    },
  });

  return salaryData;
}

export const getIncomeOutcomeSummary = async () => {
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  const endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  );

  const currentMonthIncome = await prisma.invoice.aggregate({
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

  // Fetch Total Income Accumulation (All-Time Invoices)
  const totalIncome = await prisma.invoice.aggregate({
    _sum: {
      amount: true,
    },
  });

  // Fetch Current Month Outcome (Expenses)
  const currentMonthOutcome = await prisma.outcome.aggregate({
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

  // Fetch Total Outcome Accumulation (All-Time Expenses)
  const totalOutcome = await prisma.outcome.aggregate({
    _sum: {
      amount: true,
    },
  });
  const currentMonthYear = dayjs().format("MMMM YYYY");

  // Return all values in JSON response
  return {
    data: {
      currentMonthIncome: currentMonthIncome._sum.amount || 0,
      totalIncome: totalIncome._sum.amount || 0,
      currentMonthOutcome: currentMonthOutcome._sum.amount || 0,
      totalOutcome: totalOutcome._sum.amount || 0,
      currentMonthYear,
    },
  };
};

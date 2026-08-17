// accounting/salary repository — Prisma I/O ONLY. Relocated from the legacy accountant
// service. Reads (getUsersWithSalaries / getSalaryData) are verbatim; the base-salary
// create/update are the raw Prisma writes (numeric coercion + guards live in the usecase);
// generateMonthlySalary is split into a same-month existence read (findMonthlySalaryForMonth)
// + the atomic `$transaction` body (createMonthlySalaryWithOutcome) exactly as legacy ran it.
import dayjs from "dayjs";
import prisma from "../../../infra/prisma/prisma.js";

class SalaryRepository {
  runInTransaction(work) {
    return prisma.$transaction(work);
  }

  lockBaseSalaryForUpdate({ baseSalaryId, client }) {
    return client.$queryRaw`SELECT id FROM BaseEmployeeSalary WHERE id = ${baseSalaryId} FOR UPDATE`;
  }

  async getUsersWithSalaries(searchParams, limit, skip) {
    const filters = searchParams.filters && JSON.parse(searchParams.filters);
    const staffFilter = searchParams.staffId
      ? { userId: Number(searchParams.staffId) }
      : {};
    let where = {
      currentProfile: { isAdminTier: false },
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
        currentProfile: {
          select: { key: true, label: true, family: true },
        },
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

  createBaseSalary({ userId, taxAmount, baseSalary, baseWorkHours }) {
    return prisma.BaseEmployeeSalary.create({
      data: {
        userId: userId,
        baseSalary: baseSalary,
        baseWorkHours: baseWorkHours,
        taxAmount: taxAmount,
      },
    });
  }

  editBaseSalary({ id, taxAmount, baseSalary, baseWorkHours }) {
    return prisma.BaseEmployeeSalary.update({
      where: {
        id: Number(id),
      },
      data: {
        baseSalary: baseSalary,
        baseWorkHours: baseWorkHours,
        taxAmount: taxAmount,
      },
    });
  }

  findMonthlySalaryForMonth({ baseSalaryId, startOfMonth, endOfMonth, client }) {
    return (client ?? prisma).monthlySalary.findFirst({
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
  }

  async createMonthlySalaryWithOutcome({
    baseSalaryId,
    totalHoursWorked,
    overtimeHours,
    bonuses,
    deductions,
    netSalary,
    isFulfilled,
    paymentDate,
    client,
  }) {
    if (!client) {
      return prisma.$transaction((transactionClient) =>
        this.createMonthlySalaryWithOutcome({
          baseSalaryId,
          totalHoursWorked,
          overtimeHours,
          bonuses,
          deductions,
          netSalary,
          isFulfilled,
          paymentDate,
          client: transactionClient,
        }),
      );
    }

    // Create the new monthly salary record
    const monthlySalary = await client.monthlySalary.create({
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
    const user = await client.monthlySalary.findUnique({
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
    const outcome = await client.outcome.create({
      data: {
        type: "Salary",
        amount: netSalary,
        description: `Monthly salary payment for ${
          user.baseSalary.employee.name
        } ,${dayjs().format("MMMM YYYY")}`,
        monthlySalariesByOutcome: {
          connect: {
            id: monthlySalary.id,
          },
        },
      },
    });

    const updatedMonthlySalary = await client.monthlySalary.update({
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

    return { data: updatedMonthlySalary };
  }

  getSalaryData(data) {
    const { userId, startDate, endDate } = data;

    const start = startDate
      ? new Date(startDate)
      : dayjs().startOf("month").toDate();
    const end = endDate ? new Date(endDate) : dayjs().endOf("month").toDate();

    // Get base salary and monthly salaries for the user
    return prisma.baseEmployeeSalary.findUnique({
      where: {
        userId: Number(userId),
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            currentProfile: {
              select: { key: true, label: true, family: true },
            },
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
  }
}

export const salaryRepository = new SalaryRepository();
export { SalaryRepository };

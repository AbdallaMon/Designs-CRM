// accounting/report repository — Prisma I/O ONLY. Relocated from the legacy accountant
// service. `getOutcomes` is a verbatim filtered list read; `getIncomeOutcomeSummary` runs
// the four income/outcome aggregates and returns them raw — the presentational shaping
// (`_sum.amount || 0` + currentMonthYear) lives in report.dto.js.
import dayjs from "dayjs";
import prisma from "../../../infra/prisma/prisma.js";

class ReportRepository {
  async getOutcomes({ limit = 1, skip = 10, filters }) {
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

  async getIncomeOutcomeSummary() {
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

    return { currentMonthIncome, totalIncome, currentMonthOutcome, totalOutcome };
  }
}

export const reportRepository = new ReportRepository();
export { ReportRepository };

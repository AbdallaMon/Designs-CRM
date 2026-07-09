// accounting/report DTO — pure presentational shaping (no Prisma, no side effects).
// Shapes the raw income/outcome aggregates from report.repo.js into the response payload,
// byte-identical to the legacy accountant service's getIncomeOutcomeSummary return.
import dayjs from "dayjs";

export function shapeIncomeOutcomeSummary({
  currentMonthIncome,
  totalIncome,
  currentMonthOutcome,
  totalOutcome,
}) {
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
}

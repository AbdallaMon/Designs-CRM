// accounting/salary Zod schemas. Money fields (baseSalary / taxAmount / netSalary /
// bonuses / deductions) coerced to NUMBERS; the ones that must be > 0 are constrained
// here, and the legacy service-side checks (required fields, taxAmount floored at 0,
// monthly-salary uniqueness) are PRESERVED untouched. Lists stay permissive (legacy read
// a `filters` JSON string + arbitrary searchParams).
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

// >= 0 money (salaries/tax/hours may legitimately be zero in legacy after flooring).
const nonNegativeNumber = z.coerce.number().refine((n) => Number.isFinite(n) && n >= 0, {
  message: "must be a non-negative number",
});
// strictly positive (base salary / work hours / net salary must be meaningful).
const positiveNumber = z.coerce.number().refine((n) => Number.isFinite(n) && n > 0, {
  message: "must be a positive number",
});

export class SalaryValidation {
  // ── params ───────────────────────────────────────────────────────────────────
  static userIdParams = z.object({ userId: idParam });
  static idParams = z.object({ id: idParam });

  // ── query ─────────────────────────────────────────────────────────────────────
  static listQuery = z.object({}).passthrough();

  // POST /salaries/:userId — legacy createBaseSalary({userId,taxAmount,baseSalary,baseWorkHours})
  static createBase = z
    .object({
      baseSalary: positiveNumber,
      baseWorkHours: positiveNumber,
      taxAmount: nonNegativeNumber.optional(),
    })
    .strict();

  // PUT /salaries/:id — legacy editBaseSalary (requires all of baseSalary/baseWorkHours/taxAmount)
  static editBase = z
    .object({
      baseSalary: positiveNumber,
      baseWorkHours: positiveNumber,
      taxAmount: nonNegativeNumber,
    })
    .strict();

  // POST /salaries/monthly/pay — legacy generateMonthlySalary. Required: baseSalaryId,
  // totalHoursWorked, netSalary, paymentDate; optional numeric fields default to 0.
  static payMonthly = z
    .object({
      baseSalaryId: idParam,
      totalHoursWorked: positiveNumber,
      netSalary: positiveNumber,
      overtimeHours: nonNegativeNumber.optional(),
      bonuses: nonNegativeNumber.optional(),
      deductions: nonNegativeNumber.optional(),
      isFulfilled: z.boolean().optional(),
      paymentDate: z.union([z.string().min(1), z.date()]),
    })
    .strict();
}

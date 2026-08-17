// accounting/salary usecase — orchestration only (no Prisma). The salary reads
// (getSalaryData / getUsersWithSalaries) are delegated straight to salary.repo.js; the
// base-salary create/update and the monthly-salary generation keep their guards + numeric
// coercion HERE and delegate the Prisma writes (including generateMonthlySalary's atomic
// `$transaction`) to the repo. Behavior is ported 1:1 from the legacy accountant service.
//
// The /users + /users/:userId/last-seen endpoints are the ACCOUNTANT-scoped helper lists the
// legacy accountant router exposed for salaries; getUsersWithSalaries is repo-backed, and
// getUserLogs is lazily imported from the users/user usecase (where it was relocated from the
// former admin-services god-file).
//
// Known legacy domain throws (editBaseSalary "Please fill all fiels"; generateMonthlySalary
// "Fill all the fileds please" / "Monthly salary ... already exists for this user") are kept
// byte-identical and translated to AppError codes via translateLegacyAccountingError so the
// FE error map works; unrecognized errors re-throw as-is (still 500).
import dayjs from "dayjs";
import { AppError } from "../../../shared/errors/AppError.js";
import { accountingMessagesCodes } from "@dms/shared";
import { salaryRepository } from "./salary.repo.js";
// Relocated from the former admin-services god-file. Static top import (the users/user module
// does NOT import back into accounting, so there is no cycle — see pass-2 alignment).
import { getUserLogs } from "../../users/user/user.usecase.js";

async function createBaseSalary({ userId, taxAmount, baseSalary, baseWorkHours }) {
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
  const salary = await salaryRepository.createBaseSalary({
    userId,
    baseSalary,
    baseWorkHours,
    taxAmount,
  });

  return { data: salary };
}

async function editBaseSalary({ id, taxAmount, baseSalary, baseWorkHours }) {
  if (!id || !baseSalary || !baseWorkHours || !taxAmount) {
    throw new AppError({ code: accountingMessagesCodes.REQUIRED_FIELDS_MISSING, statusCode: 400 });
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
  const salary = await salaryRepository.editBaseSalary({
    id,
    baseSalary,
    baseWorkHours,
    taxAmount,
  });

  return { data: salary };
}

async function generateMonthlySalary({
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
    throw new AppError({ code: accountingMessagesCodes.REQUIRED_FIELDS_MISSING, statusCode: 400 });
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

  return salaryRepository.runInTransaction(async (client) => {
    await salaryRepository.lockBaseSalaryForUpdate({ baseSalaryId, client });
    const hasMonthly = await salaryRepository.findMonthlySalaryForMonth({
      baseSalaryId,
      startOfMonth,
      endOfMonth,
      client,
    });

    // If monthly salary already exists, throw an error
    if (hasMonthly) {
      throw new AppError({ code: accountingMessagesCodes.MONTHLY_SALARY_ALREADY_EXISTS, statusCode: 409 });
    }
    if (paymentDate) {
      paymentDate = new Date(paymentDate);
    }

    return salaryRepository.createMonthlySalaryWithOutcome({
      baseSalaryId,
      totalHoursWorked,
      overtimeHours,
      bonuses,
      deductions,
      netSalary,
      isFulfilled,
      paymentDate,
      client,
    });
  });
}

class SalaryUsecase {
  // ── accountant-scoped user helper lists (for salaries) ──────────────────────────
  listUsers({ query, limit, skip }) {
    return salaryRepository.getUsersWithSalaries(query, limit, skip);
  }

  getUserLastSeen({ userId, month, year }) {
    return getUserLogs(userId, month, year);
  }

  // ── salaries ────────────────────────────────────────────────────────────────────
  getSalaryData({ query }) {
    return salaryRepository.getSalaryData(query);
  }

  // Legacy route did: req.body.userId = userId; createBaseSalary(req.body).
  createBase({ userId, body }) {
    return createBaseSalary({ ...body, userId });
  }

  // Legacy route did: req.body.id = id; editBaseSalary(req.body).
  editBase({ id, body }) {
    return editBaseSalary({ ...body, id });
  }

  payMonthly({ body }) {
    return generateMonthlySalary(body);
  }
}

export const salaryUsecase = new SalaryUsecase();
export { SalaryUsecase };

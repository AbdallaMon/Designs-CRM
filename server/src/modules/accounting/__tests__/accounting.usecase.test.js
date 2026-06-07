import { describe, it, expect, vi } from "vitest";

import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  PERMISSIONS,
  getEffectivePermissions,
  USER_ROLES,
  authMessagesCodes,
  accountingMessagesCodes,
} from "@dms/shared";

import { PaymentUsecase } from "../payment/payment.usecase.js";
import { PaymentValidation } from "../payment/payment.validation.js";
import { ExpenseValidation } from "../expense/expense.validation.js";
import { RentValidation } from "../rent/rent.validation.js";
import { SalaryValidation } from "../salary/salary.validation.js";

const C = accountingMessagesCodes;
const P = PERMISSIONS.ACCOUNTING;

function makeReq(role, isSuperSales = false) {
  const { permissions, permissionsByModule } = getEffectivePermissions({ role, isSuperSales });
  return { auth: { id: 1, role, isSuperSales, permissions, permissionsByModule } };
}

// ════════════════════════════════════════════════════════════════════════════
//  PERMISSION GATE — allow vs deny on accounting codes
// ════════════════════════════════════════════════════════════════════════════
describe("accounting route permission gate (allow vs deny)", () => {
  it("ACCOUNTANT passes the payment-process gate", () => {
    const req = makeReq(USER_ROLES.ACCOUNTANT);
    const next = vi.fn();
    AuthMiddleware.requirePermissions([P.PAYMENT_PROCESS])(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("ACCOUNTANT passes the salary-pay gate", () => {
    const req = makeReq(USER_ROLES.ACCOUNTANT);
    const next = vi.fn();
    AuthMiddleware.requirePermissions([P.SALARY_PAY])(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("STAFF is 403'd on the payment-process gate", () => {
    const req = makeReq(USER_ROLES.STAFF);
    const next = vi.fn();
    AuthMiddleware.requirePermissions([P.PAYMENT_PROCESS])(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe(authMessagesCodes.FORBIDDEN);
  });

  it("a designer is 403'd on the salary-pay gate", () => {
    const req = makeReq(USER_ROLES.THREE_D_DESIGNER);
    const next = vi.fn();
    AuthMiddleware.requirePermissions([P.SALARY_PAY])(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it("ADMIN is 403'd on accounting codes (legacy accountant gate is ACCOUNTANT-only)", () => {
    const req = makeReq(USER_ROLES.ADMIN);
    const next = vi.fn();
    AuthMiddleware.requirePermissions([P.PAYMENT_PROCESS])(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  MONEY VALIDATION — reject negative / NaN amounts (the hardening)
// ════════════════════════════════════════════════════════════════════════════
describe("accounting money validation", () => {
  it("payment pay: rejects a negative amount", () => {
    const r = PaymentValidation.pay.safeParse({ amount: -5, issuedDate: "2026-06-01" });
    expect(r.success).toBe(false);
  });

  it("payment pay: rejects a zero amount", () => {
    const r = PaymentValidation.pay.safeParse({ amount: 0, issuedDate: "2026-06-01" });
    expect(r.success).toBe(false);
  });

  it("payment pay: rejects a non-numeric (NaN) amount", () => {
    const r = PaymentValidation.pay.safeParse({ amount: "abc", issuedDate: "2026-06-01" });
    expect(r.success).toBe(false);
  });

  it("payment pay: accepts a positive amount (coerced from string)", () => {
    const r = PaymentValidation.pay.safeParse({ amount: "150.5", issuedDate: "2026-06-01" });
    expect(r.success).toBe(true);
    expect(r.data.amount).toBe(150.5);
  });

  it("payment change-status: rejects a level outside the enum", () => {
    const r = PaymentValidation.changeStatus.safeParse({ newPaymentLevel: "LEVEL_99" });
    expect(r.success).toBe(false);
  });

  it("payment change-status: accepts a valid enum level", () => {
    const r = PaymentValidation.changeStatus.safeParse({ newPaymentLevel: "LEVEL_3" });
    expect(r.success).toBe(true);
  });

  it("expense create: rejects a negative amount", () => {
    const r = ExpenseValidation.create.safeParse({
      category: "rent",
      amount: -1,
      paymentDate: "2026-06-01",
    });
    expect(r.success).toBe(false);
  });

  it("rent create: rejects a NaN amount", () => {
    const r = RentValidation.create.safeParse({
      name: "office",
      amount: "not-a-number",
      startDate: "2026-06-01",
      endDate: "2026-07-01",
      paymentDate: "2026-06-01",
    });
    expect(r.success).toBe(false);
  });

  it("salary createBase: rejects a negative base salary", () => {
    const r = SalaryValidation.createBase.safeParse({ baseSalary: -100, baseWorkHours: 160 });
    expect(r.success).toBe(false);
  });

  it("salary payMonthly: rejects a negative net salary", () => {
    const r = SalaryValidation.payMonthly.safeParse({
      baseSalaryId: 1,
      totalHoursWorked: 160,
      netSalary: -1,
      paymentDate: "2026-06-30",
    });
    expect(r.success).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  PAYMENT WORKFLOW ACTION — existence guard + delegation
// ════════════════════════════════════════════════════════════════════════════
describe("PaymentUsecase money workflow actions", () => {
  function makePaymentRepo(overrides = {}) {
    return { findPaymentState: vi.fn(), ...overrides };
  }

  it("checkPaymentExists 404s a missing/forged payment id (no money mutation runs)", async () => {
    const repo = makePaymentRepo({ findPaymentState: vi.fn().mockResolvedValue(null) });
    const usecase = new PaymentUsecase(repo, {});
    await expect(usecase.checkPaymentExists({ paymentId: 999 })).rejects.toMatchObject({
      statusCode: 404,
      message: C.PAYMENT_NOT_FOUND,
    });
  });

  it("checkPaymentExists returns the loaded state for an existing payment", async () => {
    const state = { id: 7, status: "PENDING", paymentLevel: "LEVEL_1", amount: 100, amountPaid: 0 };
    const repo = makePaymentRepo({ findPaymentState: vi.fn().mockResolvedValue(state) });
    const usecase = new PaymentUsecase(repo, {});
    await expect(usecase.checkPaymentExists({ paymentId: 7 })).resolves.toEqual(state);
  });

  it("pay delegates to the legacy processPayment with coerced args (paymentId, amount, date, file, userId)", async () => {
    const processPayment = vi.fn().mockResolvedValue({ id: 7, status: "FULLY_PAID" });
    const usecase = new PaymentUsecase(makePaymentRepo(), { processPayment });
    await usecase.pay({
      paymentId: "7",
      body: { amount: "50", issuedDate: "2026-06-01", file: "f.pdf" },
      authUser: { id: 3 },
    });
    expect(processPayment).toHaveBeenCalledTimes(1);
    const [pid, amount, date, file, userId] = processPayment.mock.calls[0];
    expect(pid).toBe(7);
    expect(amount).toBe(50);
    expect(date).toBeInstanceOf(Date);
    expect(file).toBe("f.pdf");
    expect(userId).toBe(3);
  });

  it("changeStatus delegates the enum-validated level to the legacy changePaymentLevel", async () => {
    const changePaymentLevel = vi.fn().mockResolvedValue({ id: 7, paymentLevel: "LEVEL_2" });
    const usecase = new PaymentUsecase(makePaymentRepo(), { changePaymentLevel });
    await usecase.changeStatus({ paymentId: "7", body: { newPaymentLevel: "LEVEL_2" } });
    expect(changePaymentLevel).toHaveBeenCalledWith("7", "LEVEL_2");
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  LIST PAGINATION SHAPE — contract { items, total, page, pageSize }
// ════════════════════════════════════════════════════════════════════════════
describe("PaymentUsecase list (legacy filters parsing preserved)", () => {
  it("parses the `filters` JSON string and forwards status/level (legacy behavior)", async () => {
    const getPayments = vi.fn().mockResolvedValue({ data: [{ id: 1 }], total: 1, totalPages: 1 });
    const usecase = new PaymentUsecase({ findPaymentState: vi.fn() }, { getPayments });
    const result = await usecase.list({
      query: { filters: JSON.stringify({ status: "OVERDUE", level: "LEVEL_2" }) },
      skip: 0,
      limit: 10,
    });
    const arg = getPayments.mock.calls[0][0];
    expect(arg.status).toBe("OVERDUE");
    expect(arg.level).toBe("LEVEL_2");
    expect(arg.skip).toBe(0);
    expect(arg.limit).toBe(10);
    expect(result.data).toEqual([{ id: 1 }]);
  });
});

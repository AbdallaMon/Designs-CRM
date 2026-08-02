import { describe, it, expect, vi, beforeEach } from "vitest";

// After DI removal the usecases call their repo singletons directly, so fakes are injected
// via module mocking (not constructor args). Repo factories use inline vi.fn()s (vi.mock is
// hoisted above imports — no outer refs allowed); defaults/overrides are set per-test.
vi.mock("../payment/payment.repo.js", () => ({
  paymentRepository: {
    findPaymentState: vi.fn(),
    getPayments: vi.fn(),
    changePaymentLevel: vi.fn(),
    getListOfPaymentInvoices: vi.fn(),
    findPayment: vi.fn(),
    updatePaymentAmounts: vi.fn(),
    createInvoice: vi.fn(),
    createInvoiceNote: vi.fn(),
    updatePaymentOverdue: vi.fn(),
  },
}));
vi.mock("../rent/rent.repo.js", () => ({
  rentRepository: {
    findRentState: vi.fn(),
    findManyRents: vi.fn(),
    countRents: vi.fn(),
    createRent: vi.fn(),
    findRentRow: vi.fn(),
    findRentForRenew: vi.fn(),
    createRentPeriod: vi.fn(),
    createRentOutcome: vi.fn(),
  },
}));
vi.mock("../salary/salary.repo.js", () => ({
  salaryRepository: {
    findMonthlySalaryForMonth: vi.fn(),
    createMonthlySalaryWithOutcome: vi.fn(),
    createBaseSalary: vi.fn(),
    editBaseSalary: vi.fn(),
    getSalaryData: vi.fn(),
    getUsersWithSalaries: vi.fn(),
  },
}));

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
import { RentUsecase } from "../rent/rent.usecase.js";
import { SalaryUsecase } from "../salary/salary.usecase.js";
import { paymentRepository } from "../payment/payment.repo.js";
import { rentRepository } from "../rent/rent.repo.js";
import { salaryRepository } from "../salary/salary.repo.js";

const P = PERMISSIONS.ACCOUNTING;

beforeEach(() => {
  vi.clearAllMocks();
});

function makeReq(profile, superSales = false) {
  const activeProfile = superSales ? "SUPER_SALES" : {
    ADMIN: "ADMIN",
    SUPER_ADMIN: "SUPER_ADMIN",
    STAFF: "NORMAL_SALES",
    ACCOUNTANT: "ACCOUNTANT",
    THREE_D_DESIGNER: "DESIGNER_3D",
    TWO_D_DESIGNER: "DESIGNER_2D",
    TWO_D_EXECUTOR: "EXECUTOR_2D",
    SUPER_SALES: "SUPER_SALES",
    CONTACT_INITIATOR: "CONTACT_INITIATOR",
  }[profile];
  const { permissions, permissionsByModule } = getEffectivePermissions({ profile: activeProfile });
  return { auth: { id: 1, currentProfileKey: activeProfile, permissions, permissionsByModule } };
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
    expect(err.message).toBe(authMessagesCodes.PERMISSION_DENIED);
  });

  it("a designer is 403'd on the salary-pay gate", () => {
    const req = makeReq(USER_ROLES.THREE_D_DESIGNER);
    const next = vi.fn();
    AuthMiddleware.requirePermissions([P.SALARY_PAY])(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it("ADMIN can process payments because the admin profile has every permission", () => {
    const req = makeReq(USER_ROLES.ADMIN);
    const next = vi.fn();
    AuthMiddleware.requirePermissions([P.PAYMENT_PROCESS])(req, {}, next);
    expect(next).toHaveBeenCalledWith();
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
  it("checkPaymentExists 404s a missing/forged payment id (no money mutation runs)", async () => {
    paymentRepository.findPaymentState.mockResolvedValue(null);
    const usecase = new PaymentUsecase();
    await expect(usecase.checkPaymentExists({ paymentId: 999 })).rejects.toMatchObject({
      statusCode: 404,
      message: accountingMessagesCodes.PAYMENT_NOT_FOUND,
    });
  });

  it("checkPaymentExists returns the loaded state for an existing payment", async () => {
    const state = { id: 7, status: "PENDING", paymentLevel: "LEVEL_1", amount: 100, amountPaid: 0 };
    paymentRepository.findPaymentState.mockResolvedValue(state);
    const usecase = new PaymentUsecase();
    await expect(usecase.checkPaymentExists({ paymentId: 7 })).resolves.toEqual(state);
  });

  it("pay delegates to the money orchestration with coerced args (paymentId, amount, date, file, userId)", async () => {
    const usecase = new PaymentUsecase();
    const processPayment = vi
      .spyOn(usecase, "_processPayment")
      .mockResolvedValue({ id: 7, status: "FULLY_PAID" });
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

  it("changeStatus delegates the enum-validated level to the repo changePaymentLevel", async () => {
    paymentRepository.changePaymentLevel.mockResolvedValue({ id: 7, paymentLevel: "LEVEL_2" });
    const usecase = new PaymentUsecase();
    await usecase.changeStatus({ paymentId: "7", body: { newPaymentLevel: "LEVEL_2" } });
    expect(paymentRepository.changePaymentLevel).toHaveBeenCalledWith("7", "LEVEL_2");
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  LIST PAGINATION SHAPE — contract { items, total, page, pageSize }
// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
//  LEGACY ERROR TRANSLATION — raw Error("...") → AppError code + 4xx status
//  (FIX 2: error-handler only knows AppError; a plain Error becomes 500 and the FE
//   accountingMessages domain codes never resolve. The usecase wrappers translate.)
// ════════════════════════════════════════════════════════════════════════════
describe("PaymentUsecase list (legacy filters parsing preserved)", () => {
  it("parses the `filters` JSON string and forwards status/level (legacy behavior)", async () => {
    paymentRepository.getPayments.mockResolvedValue({ data: [{ id: 1 }], total: 1, totalPages: 1 });
    const usecase = new PaymentUsecase();
    const result = await usecase.listPayments({
      query: { filters: JSON.stringify({ status: "OVERDUE", level: "LEVEL_2" }) },
      skip: 0,
      limit: 10,
    });
    const arg = paymentRepository.getPayments.mock.calls[0][0];
    expect(arg.status).toBe("OVERDUE");
    expect(arg.level).toBe("LEVEL_2");
    expect(arg.skip).toBe(0);
    expect(arg.limit).toBe(10);
    expect(result.data).toEqual([{ id: 1 }]);
  });
});

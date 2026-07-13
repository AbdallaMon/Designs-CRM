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
import { mapLegacyError } from "../accounting.errors.js";
import { paymentRepository } from "../payment/payment.repo.js";
import { rentRepository } from "../rent/rent.repo.js";
import { salaryRepository } from "../salary/salary.repo.js";

const P = PERMISSIONS.ACCOUNTING;

beforeEach(() => {
  vi.clearAllMocks();
});

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
    expect(err.message).toBe(authMessagesCodes.PERMISSION_DENIED);
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
describe("accounting legacy-error → AppError mapping", () => {
  // The exact legacy strings (incl. the two typos) → expected code + status.
  const CASES = [
    ["Please fill all data", accountingMessagesCodes.REQUIRED_FIELDS_MISSING, 422],
    ["Please enter a date", accountingMessagesCodes.PAYMENT_DATE_REQUIRED, 422],
    ["Payment not found", accountingMessagesCodes.PAYMENT_NOT_FOUND, 404],
    ["Invalid Payment: The payment has already been fully paid.", accountingMessagesCodes.PAYMENT_ALREADY_FULLY_PAID, 409],
    [
      "Invalid Payment: The pending amount is 50. The amount provided (90) exceeds the pending balance.",
      accountingMessagesCodes.PAYMENT_AMOUNT_EXCEEDS_PENDING,
      400,
    ],
    [
      "Invalid Payment: The payment amount must be greater than zero. You provided -5.",
      accountingMessagesCodes.PAYMENT_AMOUNT_INVALID,
      400,
    ],
    ["Fill all the fields please", accountingMessagesCodes.REQUIRED_FIELDS_MISSING, 422],
    ["Rent not found", accountingMessagesCodes.RENT_NOT_FOUND, 404],
    ["Please fill all fiels", accountingMessagesCodes.REQUIRED_FIELDS_MISSING, 422],
    ["Fill all the fileds please", accountingMessagesCodes.REQUIRED_FIELDS_MISSING, 422],
    ["Monthly salary for June 2026 already exists for this user", accountingMessagesCodes.MONTHLY_SALARY_ALREADY_EXISTS, 409],
  ];

  it.each(CASES)("maps %j → %s (%i)", (message, code, status) => {
    const mapped = mapLegacyError(new Error(message));
    expect(mapped).toBeInstanceOf(AppError);
    expect(mapped.message).toBe(code);
    expect(mapped.statusCode).toBe(status);
  });

  it("returns null (re-throw as-is) for an unrecognized error message", () => {
    expect(mapLegacyError(new Error("ECONNREFUSED: db is down"))).toBeNull();
  });

  it("does not re-map an existing AppError", () => {
    expect(mapLegacyError(new AppError(accountingMessagesCodes.PAYMENT_NOT_FOUND, 404))).toBeNull();
  });
});

describe("accounting usecases translate legacy throws end-to-end", () => {
  it("PaymentUsecase.pay: already-fully-paid → AppError 409 PAYMENT_ALREADY_FULLY_PAID", async () => {
    const usecase = new PaymentUsecase();
    vi.spyOn(usecase, "_processPayment").mockRejectedValue(
      new Error("Invalid Payment: The payment has already been fully paid."),
    );
    await expect(
      usecase.pay({ paymentId: "1", body: { amount: "10", issuedDate: "2026-06-01" }, authUser: { id: 1 } }),
    ).rejects.toMatchObject({ statusCode: 409, message: accountingMessagesCodes.PAYMENT_ALREADY_FULLY_PAID });
  });

  it("PaymentUsecase.pay: amount-exceeds-pending → AppError 400 PAYMENT_AMOUNT_EXCEEDS_PENDING", async () => {
    const usecase = new PaymentUsecase();
    vi.spyOn(usecase, "_processPayment").mockRejectedValue(
      new Error("Invalid Payment: The pending amount is 50. The amount provided (90) exceeds the pending balance."),
    );
    await expect(
      usecase.pay({ paymentId: "1", body: { amount: "90", issuedDate: "2026-06-01" }, authUser: { id: 1 } }),
    ).rejects.toMatchObject({ statusCode: 400, message: accountingMessagesCodes.PAYMENT_AMOUNT_EXCEEDS_PENDING });
  });

  it("PaymentUsecase.pay: re-throws an UNKNOWN legacy error as-is (still 500-class)", async () => {
    const boom = new Error("totally unexpected crash");
    const usecase = new PaymentUsecase();
    vi.spyOn(usecase, "_processPayment").mockRejectedValue(boom);
    await expect(
      usecase.pay({ paymentId: "1", body: { amount: "10", issuedDate: "2026-06-01" }, authUser: { id: 1 } }),
    ).rejects.toBe(boom);
  });

  it("PaymentUsecase.markOverdue: payment-not-found → AppError 404 PAYMENT_NOT_FOUND", async () => {
    const usecase = new PaymentUsecase();
    vi.spyOn(usecase, "_markPaymentAsOverdue").mockRejectedValue(new Error("Payment not found"));
    await expect(usecase.markOverdue({ paymentId: 999 })).rejects.toMatchObject({
      statusCode: 404,
      message: accountingMessagesCodes.PAYMENT_NOT_FOUND,
    });
  });

  it("RentUsecase.renew: rent-not-found → AppError 404 RENT_NOT_FOUND", async () => {
    const usecase = new RentUsecase();
    vi.spyOn(usecase, "_renewRentAndMakeOutCome").mockRejectedValue(new Error("Rent not found"));
    await expect(usecase.renew({ rentId: "5", body: { amount: 10 } })).rejects.toMatchObject({
      statusCode: 404,
      message: accountingMessagesCodes.RENT_NOT_FOUND,
    });
  });

  it("RentUsecase.create: missing-fields → AppError 422 REQUIRED_FIELDS_MISSING", async () => {
    const usecase = new RentUsecase();
    vi.spyOn(usecase, "_createARent").mockRejectedValue(new Error("Fill all the fields please"));
    await expect(usecase.createRent({ body: {} })).rejects.toMatchObject({
      statusCode: 422,
      message: accountingMessagesCodes.REQUIRED_FIELDS_MISSING,
    });
  });

  it("SalaryUsecase.payMonthly: already-exists → AppError 409 MONTHLY_SALARY_ALREADY_EXISTS", async () => {
    // Drive the real generateMonthlySalary to the already-exists guard: valid fields +
    // an existing monthly row → it throws the dynamic "Monthly salary for … already exists".
    salaryRepository.findMonthlySalaryForMonth.mockResolvedValue({ id: 1 });
    const usecase = new SalaryUsecase();
    await expect(
      usecase.payMonthly({
        body: { baseSalaryId: 1, totalHoursWorked: 160, netSalary: 100, paymentDate: "2026-06-30" },
      }),
    ).rejects.toMatchObject({ statusCode: 409, message: accountingMessagesCodes.MONTHLY_SALARY_ALREADY_EXISTS });
  });

  it("SalaryUsecase.editBase: missing-fields (legacy typo string) → AppError 422 REQUIRED_FIELDS_MISSING", async () => {
    // Real editBaseSalary throws "Please fill all fiels" when a required field is absent.
    const usecase = new SalaryUsecase();
    await expect(usecase.editBase({ id: 1, body: {} })).rejects.toMatchObject({
      statusCode: 422,
      message: accountingMessagesCodes.REQUIRED_FIELDS_MISSING,
    });
  });

  it("SalaryUsecase.payMonthly: re-throws an UNKNOWN error as-is", async () => {
    // Valid fields, no existing monthly row → the write runs; make the repo write reject with
    // an unrecognized error, which translateLegacyAccountingError must re-throw unchanged.
    const boom = new Error("db pool exhausted");
    salaryRepository.findMonthlySalaryForMonth.mockResolvedValue(null);
    salaryRepository.createMonthlySalaryWithOutcome.mockRejectedValue(boom);
    const usecase = new SalaryUsecase();
    await expect(
      usecase.payMonthly({
        body: { baseSalaryId: 1, totalHoursWorked: 160, netSalary: 100, paymentDate: "2026-06-30" },
      }),
    ).rejects.toBe(boom);
  });
});

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

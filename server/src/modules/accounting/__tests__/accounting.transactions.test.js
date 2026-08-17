import { beforeEach, describe, expect, it, vi } from "vitest";
import { accountingMessagesCodes } from "@dms/shared";

vi.mock("../payment/payment.repo.js", () => ({
  paymentRepository: {
    runInTransaction: vi.fn(),
    lockPaymentForUpdate: vi.fn(),
    findPayment: vi.fn(),
    updatePaymentAmounts: vi.fn(),
    createInvoice: vi.fn(),
    createInvoiceNote: vi.fn(),
  },
}));

vi.mock("../rent/rent.repo.js", () => ({
  rentRepository: {
    runInTransaction: vi.fn(),
    createRent: vi.fn(),
    findRentForRenew: vi.fn(),
    createRentPeriod: vi.fn(),
    createRentOutcome: vi.fn(),
    findRentRow: vi.fn(),
  },
}));

vi.mock("../salary/salary.repo.js", () => ({
  salaryRepository: {
    runInTransaction: vi.fn(),
    lockBaseSalaryForUpdate: vi.fn(),
    findMonthlySalaryForMonth: vi.fn(),
    createMonthlySalaryWithOutcome: vi.fn(),
  },
}));

vi.mock("../../users/user/user.usecase.js", () => ({ getUserLogs: vi.fn() }));

import { PaymentUsecase } from "../payment/payment.usecase.js";
import { RentUsecase } from "../rent/rent.usecase.js";
import { SalaryUsecase } from "../salary/salary.usecase.js";
import { paymentRepository } from "../payment/payment.repo.js";
import { rentRepository } from "../rent/rent.repo.js";
import { salaryRepository } from "../salary/salary.repo.js";

function replaceState(target, snapshot) {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, structuredClone(snapshot));
}

function serializedTransactions(state) {
  let tail = Promise.resolve();
  return async (work) => {
    const previous = tail;
    let release;
    tail = new Promise((resolve) => {
      release = resolve;
    });
    await previous;
    const snapshot = structuredClone(state);
    try {
      return await work({ transaction: true });
    } catch (error) {
      replaceState(state, snapshot);
      throw error;
    } finally {
      release();
    }
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("payment transaction and row serialization", () => {
  function arrangePayment(state, { failNote = false } = {}) {
    paymentRepository.runInTransaction.mockImplementation(serializedTransactions(state));
    paymentRepository.lockPaymentForUpdate.mockResolvedValue([]);
    paymentRepository.findPayment.mockImplementation(async () => ({ ...state.payment }));
    paymentRepository.updatePaymentAmounts.mockImplementation(async ({ client, ...data }) => {
      state.payment = { ...state.payment, ...data };
      return { ...state.payment };
    });
    paymentRepository.createInvoice.mockImplementation(async ({ client, ...data }) => {
      const invoice = { id: state.nextInvoiceId++, invoiceNumber: `INV-${state.nextInvoiceId}`, ...data };
      state.invoices.push(invoice);
      return invoice;
    });
    paymentRepository.createInvoiceNote.mockImplementation(async ({ client, ...data }) => {
      state.notes.push(data);
      if (failNote) throw new Error("note write failed");
      return data;
    });
  }

  it("rolls back the payment update and invoice when invoice-note creation fails", async () => {
    const state = {
      payment: { id: 1, amount: 100, amountPaid: 0, amountLeft: 100, status: "PENDING" },
      invoices: [],
      notes: [],
      nextInvoiceId: 1,
    };
    arrangePayment(state, { failNote: true });

    await expect(
      new PaymentUsecase().pay({
        paymentId: 1,
        body: { amount: 30, issuedDate: "2026-08-01", file: null },
        authUser: { id: 9 },
      }),
    ).rejects.toThrow("note write failed");

    expect(state).toEqual({
      payment: { id: 1, amount: 100, amountPaid: 0, amountLeft: 100, status: "PENDING" },
      invoices: [],
      notes: [],
      nextInvoiceId: 1,
    });
  });

  it("serializes concurrent payments so they cannot overpay", async () => {
    const state = {
      payment: { id: 1, amount: 100, amountPaid: 0, amountLeft: 100, status: "PENDING" },
      invoices: [],
      notes: [],
      nextInvoiceId: 1,
    };
    arrangePayment(state);
    const usecase = new PaymentUsecase();
    const request = () =>
      usecase.pay({
        paymentId: 1,
        body: { amount: 60, issuedDate: "2026-08-01", file: null },
        authUser: { id: 9 },
      });

    const results = await Promise.allSettled([request(), request()]);

    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    const rejection = results.find(({ status }) => status === "rejected");
    expect(rejection.reason).toMatchObject({
      message: accountingMessagesCodes.PAYMENT_AMOUNT_EXCEEDS_PENDING,
      statusCode: 400,
    });
    expect(state.payment.amountPaid).toBe(60);
    expect(state.payment.amountLeft).toBe(40);
    expect(state.invoices).toHaveLength(1);
    expect(state.notes).toHaveLength(1);
    expect(paymentRepository.lockPaymentForUpdate).toHaveBeenCalledTimes(2);
    expect(paymentRepository.lockPaymentForUpdate).toHaveBeenCalledWith({
      id: 1,
      client: { transaction: true },
    });
  });

  it("returns the persisted OVERDUE status for a partial overdue payment", async () => {
    const state = {
      payment: { id: 1, amount: 100, amountPaid: 20, amountLeft: 80, status: "OVERDUE" },
      invoices: [],
      notes: [],
      nextInvoiceId: 1,
    };
    arrangePayment(state);

    const result = await new PaymentUsecase().pay({
      paymentId: 1,
      body: { amount: 30, issuedDate: "2026-08-01", file: null },
      authUser: { id: 9 },
    });

    expect(result.status).toBe("OVERDUE");
    expect(result.status).toBe(state.payment.status);
  });
});

describe("rent transaction boundaries", () => {
  function arrangeRent(state, { failOutcome = false } = {}) {
    rentRepository.runInTransaction.mockImplementation(serializedTransactions(state));
    rentRepository.createRent.mockImplementation(async ({ name, description }) => {
      const rent = { id: state.nextRentId++, name, description };
      state.rents.push(rent);
      return rent;
    });
    rentRepository.findRentForRenew.mockImplementation(async ({ id }) =>
      state.rents.find((rent) => rent.id === id) ?? null,
    );
    rentRepository.createRentPeriod.mockImplementation(async (data) => {
      const period = { id: state.nextPeriodId++, ...data };
      delete period.client;
      state.periods.push(period);
      return period;
    });
    rentRepository.createRentOutcome.mockImplementation(async (data) => {
      state.outcomes.push({ ...data });
      if (failOutcome) throw new Error("rent outcome failed");
      return data;
    });
    rentRepository.findRentRow.mockImplementation(async ({ id }) => {
      const rent = state.rents.find((row) => row.id === id);
      return {
        ...rent,
        rentPeriods: state.periods.filter((period) => period.rentId === id).slice(-1),
      };
    });
  }

  it("rolls back Rent and RentPeriod when the create flow outcome fails", async () => {
    const state = { rents: [], periods: [], outcomes: [], nextRentId: 1, nextPeriodId: 1 };
    arrangeRent(state, { failOutcome: true });

    await expect(
      new RentUsecase().createRent({
        body: {
          name: "Office",
          amount: 1000,
          startDate: "2026-08-01",
          endDate: "2026-08-31",
          paymentDate: "2026-08-01",
        },
      }),
    ).rejects.toThrow("rent outcome failed");

    expect(state.rents).toEqual([]);
    expect(state.periods).toEqual([]);
    expect(state.outcomes).toEqual([]);
  });

  it("rolls back a renewal period when its outcome fails", async () => {
    const state = {
      rents: [{ id: 1, name: "Office" }],
      periods: [],
      outcomes: [],
      nextRentId: 2,
      nextPeriodId: 1,
    };
    arrangeRent(state, { failOutcome: true });

    await expect(
      new RentUsecase().renew({
        rentId: 1,
        body: {
          name: "Office",
          amount: 1000,
          startDate: "2026-09-01",
          endDate: "2026-09-30",
          paymentDate: "2026-09-01",
        },
      }),
    ).rejects.toThrow("rent outcome failed");

    expect(state.periods).toEqual([]);
    expect(state.outcomes).toEqual([]);
  });

  it("keeps concurrent renewals as complete period/outcome pairs", async () => {
    const state = {
      rents: [{ id: 1, name: "Office" }],
      periods: [],
      outcomes: [],
      nextRentId: 2,
      nextPeriodId: 1,
    };
    arrangeRent(state);
    const usecase = new RentUsecase();
    const renew = (month) =>
      usecase.renew({
        rentId: 1,
        body: {
          name: "Office",
          amount: 1000,
          startDate: `2026-${month}-01`,
          endDate: `2026-${month}-28`,
          paymentDate: `2026-${month}-01`,
        },
      });

    await Promise.all([renew("09"), renew("10")]);

    expect(state.periods).toHaveLength(2);
    expect(state.outcomes).toHaveLength(2);
    expect(state.outcomes.map(({ rentPeriodId }) => rentPeriodId).sort()).toEqual([1, 2]);
  });
});

describe("monthly salary serialization", () => {
  function arrangeSalary(state, { failCreate = false } = {}) {
    salaryRepository.runInTransaction.mockImplementation(serializedTransactions(state));
    salaryRepository.lockBaseSalaryForUpdate.mockResolvedValue([]);
    salaryRepository.findMonthlySalaryForMonth.mockImplementation(async ({ baseSalaryId }) =>
      state.monthly.find((salary) => salary.baseSalaryId === baseSalaryId) ?? null,
    );
    salaryRepository.createMonthlySalaryWithOutcome.mockImplementation(async (data) => {
      state.monthly.push({ id: 1, baseSalaryId: data.baseSalaryId });
      state.outcomes.push({ id: 1, monthlySalaryId: 1 });
      if (failCreate) throw new Error("salary outcome failed");
      return { data: { id: 1, ...data } };
    });
  }

  const salaryBody = {
    baseSalaryId: 7,
    totalHoursWorked: 160,
    netSalary: 5000,
    paymentDate: "2026-08-31",
  };

  it("rolls back monthly salary when linked outcome creation fails", async () => {
    const state = { monthly: [], outcomes: [] };
    arrangeSalary(state, { failCreate: true });

    await expect(new SalaryUsecase().payMonthly({ body: salaryBody })).rejects.toThrow(
      "salary outcome failed",
    );
    expect(state).toEqual({ monthly: [], outcomes: [] });
  });

  it("serializes check-and-create so concurrent requests cannot duplicate a month", async () => {
    const state = { monthly: [], outcomes: [] };
    arrangeSalary(state);
    const usecase = new SalaryUsecase();
    const results = await Promise.allSettled([
      usecase.payMonthly({ body: salaryBody }),
      usecase.payMonthly({ body: salaryBody }),
    ]);

    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(results.find(({ status }) => status === "rejected").reason).toMatchObject({
      message: accountingMessagesCodes.MONTHLY_SALARY_ALREADY_EXISTS,
      statusCode: 409,
    });
    expect(state.monthly).toHaveLength(1);
    expect(state.outcomes).toHaveLength(1);
    expect(salaryRepository.lockBaseSalaryForUpdate).toHaveBeenCalledTimes(2);
    expect(salaryRepository.createMonthlySalaryWithOutcome).toHaveBeenCalledWith(
      expect.objectContaining({ client: { transaction: true } }),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminResidualMessagesCodes } from "@dms/shared";

vi.mock("../commissions.repo.js", () => ({
  commissionsRepository: {
    runInTransaction: vi.fn(),
    findEligibleLeads: vi.fn(),
    lockLeadForCommission: vi.fn(),
    findEligibleLeadById: vi.fn(),
    findExistingCommission: vi.fn(),
    createCommission: vi.fn(),
    markLeadCommissionCleared: vi.fn(),
    findCommissionsByUserId: vi.fn(),
    deleteReversibleCommissions: vi.fn(),
    resetUnclearedLeads: vi.fn(),
    lockCommissionForUpdate: vi.fn(),
    findCommissionById: vi.fn(),
    updateCommissionPayment: vi.fn(),
  },
}));

import {
  getCommissionByUserId,
  reverseCommissions,
  updateCommission,
} from "../commissions.usecase.js";
import { commissionsRepository } from "../commissions.repo.js";

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

function arrangeAutoCommission(state, { failLeadUpdate = false } = {}) {
  commissionsRepository.runInTransaction.mockImplementation(serializedTransactions(state));
  commissionsRepository.findEligibleLeads.mockResolvedValue([
    { id: 11, userId: 4, averagePrice: 1000, commissionCleared: false },
  ]);
  commissionsRepository.lockLeadForCommission.mockResolvedValue([]);
  commissionsRepository.findEligibleLeadById.mockImplementation(async () =>
    state.lead.commissionCleared ? null : { ...state.lead },
  );
  commissionsRepository.findExistingCommission.mockImplementation(async () =>
    state.commissions.find(({ leadId, userId }) => leadId === 11 && userId === 4) ?? null,
  );
  commissionsRepository.createCommission.mockImplementation(async ({ data }) => {
    const commission = { id: state.nextCommissionId++, ...data };
    state.commissions.push(commission);
    return commission;
  });
  commissionsRepository.markLeadCommissionCleared.mockImplementation(async () => {
    state.lead.commissionCleared = true;
    if (failLeadUpdate) throw new Error("lead clear failed");
    return { ...state.lead };
  });
  commissionsRepository.findCommissionsByUserId.mockImplementation(async () => [
    ...state.commissions,
  ]);
}

describe("automatic commission creation", () => {
  it("rolls back Commission creation when the lead-cleared update fails", async () => {
    const state = {
      lead: { id: 11, userId: 4, averagePrice: 1000, commissionCleared: false },
      commissions: [],
      nextCommissionId: 1,
    };
    arrangeAutoCommission(state, { failLeadUpdate: true });

    await expect(getCommissionByUserId(4)).rejects.toThrow("lead clear failed");

    expect(state.commissions).toEqual([]);
    expect(state.lead.commissionCleared).toBe(false);
  });

  it("serializes concurrent scans so only one commission is created", async () => {
    const state = {
      lead: { id: 11, userId: 4, averagePrice: 1000, commissionCleared: false },
      commissions: [],
      nextCommissionId: 1,
    };
    arrangeAutoCommission(state);

    await Promise.all([getCommissionByUserId(4), getCommissionByUserId(4)]);

    expect(state.commissions).toHaveLength(1);
    expect(state.commissions[0].amount).toBe(50);
    expect(state.lead.commissionCleared).toBe(true);
    expect(commissionsRepository.lockLeadForCommission).toHaveBeenCalledTimes(2);
  });
});

describe("commission payment serialization", () => {
  function arrangeCommissionPayment(state, { failReadBack = false } = {}) {
    commissionsRepository.runInTransaction.mockImplementation(serializedTransactions(state));
    commissionsRepository.lockCommissionForUpdate.mockResolvedValue([]);
    commissionsRepository.findCommissionById.mockImplementation(async () => {
      if (failReadBack && commissionsRepository.updateCommissionPayment.mock.calls.length > 0) {
        throw new Error("commission read-back failed");
      }
      return { ...state.commission };
    });
    commissionsRepository.updateCommissionPayment.mockImplementation(
      async ({ amountPaid, isCleared }) => {
        state.commission.amountPaid = amountPaid;
        state.commission.isCleared = isCleared;
        return { ...state.commission };
      },
    );
  }

  it("prevents concurrent payments from exceeding the commission balance", async () => {
    const state = { commission: { id: 3, amount: 100, amountPaid: 0, isCleared: false } };
    arrangeCommissionPayment(state);

    const results = await Promise.allSettled([
      updateCommission({ commissionId: 3, amount: 60 }),
      updateCommission({ commissionId: 3, amount: 60 }),
    ]);

    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(results.find(({ status }) => status === "rejected").reason).toMatchObject({
      message: adminResidualMessagesCodes.COMMISSION_PAYMENT_EXCEEDS_REMAINING,
      statusCode: 400,
    });
    expect(state.commission.amountPaid).toBe(60);
    expect(commissionsRepository.lockCommissionForUpdate).toHaveBeenCalledTimes(2);
  });

  it("rolls back the payment update when the in-transaction read-back fails", async () => {
    const state = { commission: { id: 3, amount: 100, amountPaid: 0, isCleared: false } };
    arrangeCommissionPayment(state, { failReadBack: true });

    await expect(updateCommission({ commissionId: 3, amount: 40 })).rejects.toThrow(
      "commission read-back failed",
    );

    expect(state.commission).toEqual({ id: 3, amount: 100, amountPaid: 0, isCleared: false });
  });
});

describe("commission reversal transaction", () => {
  it("rolls back deleted commissions when resetting lead flags fails", async () => {
    const state = { commissions: [{ id: 1 }], leadCleared: true };
    commissionsRepository.runInTransaction.mockImplementation(serializedTransactions(state));
    commissionsRepository.deleteReversibleCommissions.mockImplementation(async () => {
      state.commissions = [];
    });
    commissionsRepository.resetUnclearedLeads.mockImplementation(async () => {
      state.leadCleared = false;
      throw new Error("lead reset failed");
    });

    await expect(reverseCommissions()).rejects.toThrow("lead reset failed");
    expect(state).toEqual({ commissions: [{ id: 1 }], leadCleared: true });
  });
});

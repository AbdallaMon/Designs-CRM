import { describe, it, expect, vi, beforeEach } from "vitest";

// DI removed: the usecase calls the imported `contractUtilityRepository` singleton directly.
vi.mock("../contract-utility.repo.js", () => ({
  contractUtilityRepository: {
    getUtility: vi.fn(),
    createUtility: vi.fn(),
    updateUtility: vi.fn(),
  },
}));

import { contractUtilityUsecase } from "../contract-utility.usecase.js";
import { contractUtilityRepository } from "../contract-utility.repo.js";

const INPUT = {
  obligationsPartyOneAr: "a",
  obligationsPartyOneEn: "b",
  obligationsPartyTwoAr: "c",
  obligationsPartyTwoEn: "d",
};

beforeEach(() => vi.clearAllMocks());

describe("ContractUtilityUsecase.saveObligations", () => {
  it("creates the singleton with an explicit id when none exists", async () => {
    // Regression: ContractUtility.id has no DB default, so a create() without an
    // explicit id makes Prisma throw "Argument `id` is missing". The usecase must
    // supply the fixed singleton id (1) so the first obligations save succeeds.
    const created = { id: 1, ...INPUT };
    contractUtilityRepository.getUtility.mockResolvedValue(null);
    contractUtilityRepository.createUtility.mockResolvedValue(created);

    const result = await contractUtilityUsecase.saveObligations({ input: INPUT });

    expect(contractUtilityRepository.createUtility).toHaveBeenCalledWith({
      data: { ...INPUT, id: 1 },
    });
    expect(contractUtilityRepository.updateUtility).not.toHaveBeenCalled();
    expect(result).toBe(created);
  });

  it("updates the existing singleton (no id injected into the update)", async () => {
    const existing = { id: 1, ...INPUT };
    const updated = { ...existing, obligationsPartyOneAr: "z" };
    contractUtilityRepository.getUtility.mockResolvedValue(existing);
    contractUtilityRepository.updateUtility.mockResolvedValue(updated);

    const result = await contractUtilityUsecase.saveObligations({ input: INPUT });

    expect(contractUtilityRepository.updateUtility).toHaveBeenCalledWith({ id: 1, data: INPUT });
    expect(contractUtilityRepository.createUtility).not.toHaveBeenCalled();
    expect(result).toBe(updated);
  });
});

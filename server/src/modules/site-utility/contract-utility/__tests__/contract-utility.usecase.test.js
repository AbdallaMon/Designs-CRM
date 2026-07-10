import { describe, it, expect, vi } from "vitest";

import { ContractUtilityUsecase } from "../contract-utility.usecase.js";

/** Minimal fake repository — only the methods the tested usecases touch. */
function makeRepo(overrides = {}) {
  return {
    getUtility: vi.fn(),
    createUtility: vi.fn(),
    updateUtility: vi.fn(),
    ...overrides,
  };
}

const INPUT = {
  obligationsPartyOneAr: "a",
  obligationsPartyOneEn: "b",
  obligationsPartyTwoAr: "c",
  obligationsPartyTwoEn: "d",
};

describe("ContractUtilityUsecase.saveObligations", () => {
  it("creates the singleton with an explicit id when none exists", async () => {
    // Regression: ContractUtility.id has no DB default, so a create() without an
    // explicit id makes Prisma throw "Argument `id` is missing". The usecase must
    // supply the fixed singleton id (1) so the first obligations save succeeds.
    const created = { id: 1, ...INPUT };
    const repo = makeRepo({
      getUtility: vi.fn().mockResolvedValue(null),
      createUtility: vi.fn().mockResolvedValue(created),
    });
    const usecase = new ContractUtilityUsecase(repo);

    const result = await usecase.saveObligations({ input: INPUT });

    expect(repo.createUtility).toHaveBeenCalledWith({
      data: { ...INPUT, id: 1 },
    });
    expect(repo.updateUtility).not.toHaveBeenCalled();
    expect(result).toBe(created);
  });

  it("updates the existing singleton (no id injected into the update)", async () => {
    const existing = { id: 1, ...INPUT };
    const updated = { ...existing, obligationsPartyOneAr: "z" };
    const repo = makeRepo({
      getUtility: vi.fn().mockResolvedValue(existing),
      updateUtility: vi.fn().mockResolvedValue(updated),
    });
    const usecase = new ContractUtilityUsecase(repo);

    const result = await usecase.saveObligations({ input: INPUT });

    expect(repo.updateUtility).toHaveBeenCalledWith({ id: 1, data: INPUT });
    expect(repo.createUtility).not.toHaveBeenCalled();
    expect(result).toBe(updated);
  });
});

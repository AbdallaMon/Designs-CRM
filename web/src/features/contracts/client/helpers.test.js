import { describe, expect, it } from "vitest";
import { isContractUtilityReady } from "./helpers.js";

describe("isContractUtilityReady", () => {
  it("rejects a missing fresh-database contract utility", () => {
    expect(isContractUtilityReady(null)).toBe(false);
    expect(isContractUtilityReady(undefined)).toBe(false);
  });

  it("accepts a loaded utility object", () => {
    expect(isContractUtilityReady({ obligationsPartyOneEn: "Clause" })).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { leadsMessages } from "../maps/leadsMessages";

describe("leadsMessages LEAD_CLAIM_REQUIRED", () => {
  it("resolves to a claim-as-deal message", () => {
    expect(leadsMessages.LEAD_CLAIM_REQUIRED).toBeTruthy();
    expect(leadsMessages.LEAD_CLAIM_REQUIRED.toLowerCase()).toContain("claim");
  });
});

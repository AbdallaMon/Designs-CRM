import { describe, it, expect } from "vitest";
import { LeadValidation } from "../lead.validation.js";
import { claimStatus } from "../lead.assign-status.usecase.js";

describe("assign schema — self-claim tolerance", () => {
  it("drops null/0/'' userId to undefined (self-claim)", () => {
    for (const userId of [null, 0, "", "0"]) {
      const out = LeadValidation.assign.parse({ id: 2, userId });
      expect(out.id).toBe(2);
      expect(out.userId).toBeUndefined();
    }
  });

  it("keeps a real positive userId (assign-to-other)", () => {
    const out = LeadValidation.assign.parse({ id: 2, userId: 7 });
    expect(out.userId).toBe(7);
  });

  it("passes through extra lead fields without failing", () => {
    const out = LeadValidation.assign.parse({ id: 2, userId: null, status: "NEW", client: {} });
    expect(out.id).toBe(2);
  });
});

describe("claimStatus rule (#5)", () => {
  it("NEW → IN_PROGRESS", () => expect(claimStatus({ status: "NEW" })).toBe("IN_PROGRESS"));
  it("ON_HOLD → IN_PROGRESS", () => expect(claimStatus({ status: "ON_HOLD" })).toBe("IN_PROGRESS"));
  it("missing record → IN_PROGRESS", () => expect(claimStatus(null)).toBe("IN_PROGRESS"));
  it("NEGOTIATING preserved", () => expect(claimStatus({ status: "NEGOTIATING" })).toBe("NEGOTIATING"));
});

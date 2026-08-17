import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lead.repo.js", () => ({
  leadRepository: {
    findFullLead: vi.fn(),
    getUserAllowedCountries: vi.fn(),
    countLeads: vi.fn(),
    getUserLeadLimits: vi.fn(),
    createLead: vi.fn(),
    assignLeadUpdate: vi.fn(),
  },
}));

vi.mock("../../../../infra/notifications/index.js", () => ({
  assignLeadNotification: vi.fn(),
  assignMultipleLeadsNotification: vi.fn(),
  convertALeadNotification: vi.fn(),
  updateLeadStatusNotification: vi.fn(),
}));

vi.mock("../../../../infra/queues/telegram-channel.queue.js", () => ({
  telegramChannelQueue: { add: vi.fn() },
}));

import { LeadValidation } from "../lead.validation.js";
import {
  assignmentLifecycleFields,
  assignLeadToAUser,
  claimStatus,
} from "../lead.assign-status.usecase.js";
import { leadRepository } from "../lead.repo.js";
import { assignLeadNotification } from "../../../../infra/notifications/index.js";

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

describe("admin assignment lifecycle transition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    leadRepository.getUserAllowedCountries.mockResolvedValue({ notAllowedCountries: [] });
    leadRepository.countLeads.mockResolvedValue(0);
    leadRepository.getUserLeadLimits.mockResolvedValue({
      maxLeadsCounts: 50,
      maxLeadCountPerDay: 5,
    });
    leadRepository.createLead.mockResolvedValue({ id: 99 });
    leadRepository.assignLeadUpdate.mockImplementation(async ({ id, data }) => ({
      id,
      ...data,
      assignedTo: { id: 7, name: "Sales", email: "sales@example.com" },
    }));
  });

  it.each([
    ["a NEW lead", { status: "NEW", initialConsult: true }],
    ["a non-consulted lead", { status: "NEGOTIATING", initialConsult: false }],
  ])("admin assignment starts %s as a consulted IN_PROGRESS deal", async (_label, lead) => {
    leadRepository.findFullLead.mockResolvedValue({
      id: 42,
      clientId: 5,
      country: "UAE",
      userId: null,
      ...lead,
    });

    const result = await assignLeadToAUser(42, 7, true);

    expect(leadRepository.assignLeadUpdate).toHaveBeenCalledWith({
      id: 42,
      data: {
        userId: 7,
        assignedAt: expect.any(Date),
        status: "IN_PROGRESS",
        initialConsult: true,
      },
    });
    expect(result).toMatchObject({ status: "IN_PROGRESS", initialConsult: true });
    expect(assignLeadNotification).toHaveBeenCalledOnce();
  });

  it("preserves a later consulted workflow status during admin reassignment", async () => {
    const lead = { status: "NEGOTIATING", initialConsult: true };

    expect(assignmentLifecycleFields(lead, true)).toEqual({ status: "NEGOTIATING" });
  });

  it("does not mark a non-consulted lead as consulted during a staff self-claim", () => {
    expect(
      assignmentLifecycleFields({ status: "NEW", initialConsult: false }, false),
    ).toEqual({ status: "IN_PROGRESS" });
  });
});

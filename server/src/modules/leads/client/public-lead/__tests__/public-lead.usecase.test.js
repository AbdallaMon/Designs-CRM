import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the audit infra seam so we can assert the semantic event without any DB.
vi.mock("../../../../../infra/audit/record-action.js", () => ({
  recordAction: vi.fn(),
  auditCtxFromReq: vi.fn(() => ({})),
}));

import { recordAction } from "../../../../../infra/audit/record-action.js";
import { PublicLeadUsecase } from "../public-lead.usecase.js";

function makeRepo(overrides = {}) {
  return {
    findClientByEmail: vi.fn().mockResolvedValue({ id: 1, email: "a@b.com" }),
    createClient: vi.fn(),
    findTodaysLeadByEmail: vi.fn().mockResolvedValue(null),
    updateClientPhone: vi.fn().mockResolvedValue({ id: 1 }),
    createLead: vi.fn().mockResolvedValue({
      id: 42,
      status: "NEW",
      selectedCategory: "DESIGN",
      type: "APARTMENT",
      clientId: 1,
    }),
    ...overrides,
  };
}

const legacy = {
  generateCodeForNewLead: vi.fn().mockResolvedValue("LEAD-CODE"),
  uploadFile: vi.fn(),
  newLeadNotification: vi.fn().mockResolvedValue(undefined),
  newClientLeadNotification: vi.fn(),
  newLeadCompletedNotification: vi.fn(),
  sendEmail: vi.fn(),
};

describe("PublicLeadUsecase.createLead — LEAD_CREATED audit event", () => {
  beforeEach(() => vi.clearAllMocks());

  it("records a LEAD_CREATED event once after the lead is persisted", async () => {
    const repo = makeRepo();
    const uc = new PublicLeadUsecase(repo, legacy);

    const lead = await uc.createLead(
      { email: "a@b.com", name: "N", phone: "+9715", category: "DESIGN", item: "APARTMENT" },
      { actorUserId: null, actorRole: null, ip: "1.2.3.4" },
    );

    expect(lead.id).toBe(42);
    expect(recordAction).toHaveBeenCalledTimes(1);
    expect(recordAction).toHaveBeenCalledWith(
      { actorUserId: null, actorRole: null, ip: "1.2.3.4" },
      expect.objectContaining({
        module: "lead",
        action: "LEAD_CREATED",
        entityType: "ClientLead",
        entityId: 42,
        clientLeadId: 42,
      }),
    );
  });
});

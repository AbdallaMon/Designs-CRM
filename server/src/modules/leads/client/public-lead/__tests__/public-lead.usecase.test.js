import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the audit infra seam so we can assert the semantic event without any DB.
vi.mock("../../../../../infra/audit/record-action.js", () => ({
  recordAction: vi.fn(),
  auditCtxFromReq: vi.fn(() => ({})),
}));

// The public-lead repo singleton is now used directly (no DI) — mock it.
vi.mock("../public-lead.repo.js", () => ({
  publicLeadRepository: {
    findClientByEmail: vi.fn(),
    createClient: vi.fn(),
    findTodaysLeadByEmail: vi.fn(),
    updateClientPhone: vi.fn(),
    createLead: vi.fn(),
    findLeadById: vi.fn(),
    updateLead: vi.fn(),
    findClientById: vi.fn(),
  },
  PublicLeadRepository: class {},
}));

// The lead code generator + file attach now come from the lead repo via a STATIC import
// (the former lazy `publicLeadDeps` adapters were removed) — mock that module.
vi.mock("../../../lead/lead.repo.js", () => ({
  leadRepository: {
    generateCodeForNewLead: vi.fn(),
    uploadFile: vi.fn(),
  },
}));

// The funnel notifications + cooperation email are statically imported too — mock them.
vi.mock("../../../../../infra/notifications/index.js", () => ({
  newLeadNotification: vi.fn(),
  newClientLeadNotification: vi.fn(),
  newLeadCompletedNotification: vi.fn(),
}));
vi.mock("../../../../../infra/mail/send-mail.js", () => ({
  sendEmail: vi.fn(),
}));

import { recordAction } from "../../../../../infra/audit/record-action.js";
import { publicLeadUsecase } from "../public-lead.usecase.js";
import { publicLeadRepository } from "../public-lead.repo.js";
import { leadRepository } from "../../../lead/lead.repo.js";

// Restore the repo to a happy-path default (client exists, no lead today, lead persists).
function primeRepo(overrides = {}) {
  publicLeadRepository.findClientByEmail.mockResolvedValue({ id: 1, email: "a@b.com" });
  publicLeadRepository.findTodaysLeadByEmail.mockResolvedValue(null);
  publicLeadRepository.updateClientPhone.mockResolvedValue({ id: 1 });
  publicLeadRepository.createLead.mockResolvedValue({
    id: 42,
    status: "NEW",
    selectedCategory: "DESIGN",
    type: "APARTMENT",
    clientId: 1,
  });
  leadRepository.generateCodeForNewLead.mockResolvedValue("LEAD-CODE");
  Object.assign(publicLeadRepository, overrides);
}

describe("PublicLeadUsecase.createLead — LEAD_CREATED audit event", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    primeRepo();
  });

  it("records a LEAD_CREATED event once after the lead is persisted", async () => {
    const lead = await publicLeadUsecase.createLead(
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

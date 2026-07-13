import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the audit infra seam so we can assert the semantic events without any DB.
vi.mock("../../../../infra/audit/record-action.js", () => ({
  recordAction: vi.fn(),
  auditCtxFromReq: vi.fn(() => ({})),
}));

// The lead repo singleton — mocked so `changeStatus`'s fallback status read is inert.
vi.mock("../lead.repo.js", () => ({
  leadRepository: { findLeadStatus: vi.fn() },
  LeadRepository: class {},
}));

// The repo-backed collaborators (formerly injected via the `legacy` bag) now live in the
// sibling module functions — mock them so we assert the usecase's audit orchestration
// without running the real side effects (notifications / telegram / DB).
vi.mock("../lead.assign-status.usecase.js", () => ({
  updateClientLeadStatus: vi.fn(),
  assignLeadToAUser: vi.fn(),
  bulkAssignLeadTsoAUser: vi.fn(),
  markClientLeadAsConverted: vi.fn(),
  checkIfUserAllowedToTakeALead: vi.fn(),
  getClientLeadsByDateRange: vi.fn(),
  getClientLeadsColumnStatus: vi.fn(),
  claimStatus: vi.fn(),
}));

vi.mock("../lead.sub-resources.usecase.js", () => ({
  createNote: vi.fn(),
  createCallReminder: vi.fn(),
  createMeetingReminder: vi.fn(),
  createMeetingReminderWithToken: vi.fn(),
  createPriceOffer: vi.fn(),
  createFile: vi.fn(),
  updateCallReminderStatus: vi.fn(),
  updateMeetingReminderStatus: vi.fn(),
  getCallReminders: vi.fn(),
}));

import { recordAction } from "../../../../infra/audit/record-action.js";
import { leadUsecase } from "../lead.usecase.js";
import { updateClientLeadStatus } from "../lead.assign-status.usecase.js";
import { createPriceOffer, createCallReminder } from "../lead.sub-resources.usecase.js";

const AUDIT_CTX = { actorUserId: 1, actorRole: "ADMIN", ip: "1.1.1.1" };
const ADMIN = { id: 1, role: "ADMIN" };

describe("LeadUsecase semantic audit events", () => {
  beforeEach(() => vi.clearAllMocks());

  it("changeStatus: records LEAD_STATUS_CHANGED once with before/after status", async () => {
    updateClientLeadStatus.mockResolvedValue(undefined);
    await leadUsecase.changeLeadStatus({
      id: 5,
      body: { status: "FINALIZED", oldStatus: "FORGED" },
      authUser: ADMIN,
      currentStatus: "IN_PROGRESS",
      auditCtx: AUDIT_CTX,
    });

    expect(recordAction).toHaveBeenCalledTimes(1);
    expect(recordAction).toHaveBeenCalledWith(
      AUDIT_CTX,
      expect.objectContaining({
        module: "lead",
        action: "LEAD_STATUS_CHANGED",
        entityType: "ClientLead",
        entityId: 5,
        clientLeadId: 5,
        before: { status: "IN_PROGRESS" },
        after: { status: "FINALIZED" },
      }),
    );
  });

  it("createPriceOffer: records PRICE_OFFER_CREATED once", async () => {
    createPriceOffer.mockResolvedValue({ id: 3, minPrice: 10, maxPrice: 20 });
    await leadUsecase.createPriceOffer({
      id: 8,
      body: { priceOffer: { minPrice: 10, maxPrice: 20 } },
      authUser: ADMIN,
      auditCtx: AUDIT_CTX,
    });

    expect(recordAction).toHaveBeenCalledTimes(1);
    expect(recordAction).toHaveBeenCalledWith(
      AUDIT_CTX,
      expect.objectContaining({
        module: "lead",
        action: "PRICE_OFFER_CREATED",
        entityType: "ClientLead",
        entityId: 8,
        clientLeadId: 8,
      }),
    );
  });

  it("createCall: records LEAD_CALL_LOGGED once", async () => {
    createCallReminder.mockResolvedValue({ newReminder: { id: 9, time: "2026-07-11T00:00:00Z" } });
    await leadUsecase.createCall({
      id: 12,
      body: { time: "2026-07-11T00:00:00Z", reminderReason: "follow up" },
      authUser: ADMIN,
      auditCtx: AUDIT_CTX,
    });

    expect(recordAction).toHaveBeenCalledTimes(1);
    expect(recordAction).toHaveBeenCalledWith(
      AUDIT_CTX,
      expect.objectContaining({
        module: "lead",
        action: "LEAD_CALL_LOGGED",
        entityType: "ClientLead",
        entityId: 12,
        clientLeadId: 12,
      }),
    );
  });
});

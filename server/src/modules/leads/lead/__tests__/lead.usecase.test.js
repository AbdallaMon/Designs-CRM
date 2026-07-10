import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the audit infra seam so we can assert the semantic events without any DB.
vi.mock("../../../../infra/audit/record-action.js", () => ({
  recordAction: vi.fn(),
  auditCtxFromReq: vi.fn(() => ({})),
}));

import { recordAction } from "../../../../infra/audit/record-action.js";
import { LeadUsecase } from "../lead.usecase.js";

const AUDIT_CTX = { actorUserId: 1, actorRole: "ADMIN", ip: "1.1.1.1" };
const ADMIN = { id: 1, role: "ADMIN" };

describe("LeadUsecase semantic audit events", () => {
  beforeEach(() => vi.clearAllMocks());

  it("changeStatus: records LEAD_STATUS_CHANGED once with before/after status", async () => {
    const uc = new LeadUsecase(
      { findLeadStatus: vi.fn() },
      { updateClientLeadStatus: vi.fn().mockResolvedValue(undefined) },
    );
    await uc.changeStatus({
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
    const uc = new LeadUsecase(
      {},
      { createPriceOffer: vi.fn().mockResolvedValue({ id: 3, minPrice: 10, maxPrice: 20 }) },
    );
    await uc.createPriceOffer({
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
    const uc = new LeadUsecase(
      {},
      { createCallReminder: vi.fn().mockResolvedValue({ newReminder: { id: 9, time: "2026-07-11T00:00:00Z" } }) },
    );
    await uc.createCall({
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

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../payments.stripe.js", () => ({
  createCheckoutSession: vi.fn(),
  retrieveCheckoutSession: vi.fn(),
  listCheckoutSessions: vi.fn(),
  getLeadIdFromUrl: vi.fn(),
  normalizeFromSession: vi.fn(),
  constructWebhookEvent: vi.fn(),
  isFulfillableCheckoutSession: vi.fn(
    (session) =>
      session?.mode === "payment" &&
      session?.status === "complete" &&
      ["paid", "no_payment_required"].includes(session.payment_status),
  ),
}));

vi.mock("../payments.repo.js", () => ({
  paymentsRepository: {
    getLeadWithClient: vi.fn(),
    getLeadPaymentState: vi.fn(),
    bindCheckoutSession: vi.fn(),
    fulfillCheckoutSession: vi.fn(),
    saveStripeMetadata: vi.fn(),
    findLeadById: vi.fn(),
  },
}));

vi.mock("../../../../infra/notifications/index.js", () => ({
  sendPaymentReminderEmail: vi.fn(),
  sendPaymentSuccessEmail: vi.fn(),
  leadPaymentSuccessed: vi.fn(),
}));

import { env } from "../../../../config/env.js";
import {
  issuePublicFunnelCapability,
  PUBLIC_FUNNEL_PURPOSES,
} from "../../../../infra/upload/public-funnel-capability.js";
import {
  constructWebhookEvent,
  createCheckoutSession,
  retrieveCheckoutSession,
} from "../payments.stripe.js";
import { paymentsRepository } from "../payments.repo.js";
import { paymentsUsecase } from "../payments.usecase.js";
import {
  leadPaymentSuccessed,
  sendPaymentReminderEmail,
  sendPaymentSuccessEmail,
} from "../../../../infra/notifications/index.js";

env.JWT_UPLOAD_SECRET = "stripe-funnel-capability-test-secret";

function session(overrides = {}) {
  return {
    id: "cs_bound",
    mode: "payment",
    status: "complete",
    payment_status: "paid",
    metadata: { clientLeadId: "5", clientId: "1", lng: "en" },
    customer_details: { name: "Client", email: "client@example.com" },
    ...overrides,
  };
}

function lead(overrides = {}) {
  return {
    id: 5,
    paymentStatus: "PENDING",
    paymentSessionId: "cs_bound",
    client: { id: 1, name: "Client", email: "client@example.com" },
    ...overrides,
  };
}

describe("client Stripe payment security and idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paymentsRepository.getLeadWithClient.mockResolvedValue(lead());
    retrieveCheckoutSession.mockResolvedValue(session());
    paymentsRepository.fulfillCheckoutSession.mockResolvedValue({
      state: "fulfilled",
      lead: lead(),
    });
    constructWebhookEvent.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: session() },
    });
  });

  it("rejects a forged capability bound to another lead", () => {
    const capability = issuePublicFunnelCapability({
      purpose: PUBLIC_FUNNEL_PURPOSES.PUBLIC_REGISTER,
      leadId: 5,
    });

    expect(() => paymentsUsecase.authorizePay(6, capability.token)).toThrow(
      expect.objectContaining({ code: "INVALID_TOKEN", statusCode: 401 }),
    );
  });

  it("rejects a bad webhook signature before retrieving or fulfilling a session", async () => {
    constructWebhookEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });

    await expect(
      paymentsUsecase.handleWebhook({
        rawBody: Buffer.from("{}"),
        signature: "bad",
      }),
    ).rejects.toMatchObject({ code: "PAYMENT_VERIFY_FAILED", statusCode: 400 });
    expect(retrieveCheckoutSession).not.toHaveBeenCalled();
    expect(paymentsRepository.fulfillCheckoutSession).not.toHaveBeenCalled();
  });

  it("does not let an unrelated session affect a caller-supplied lead", async () => {
    retrieveCheckoutSession.mockResolvedValue(
      session({ metadata: { clientLeadId: "999", lng: "en" } }),
    );

    await expect(
      paymentsUsecase.paymentStatus({
        sessionId: "cs_other",
        clientLeadId: 5,
        lng: "en",
      }),
    ).rejects.toMatchObject({ code: "PAYMENT_NOT_ALLOWED", statusCode: 403 });
    expect(paymentsRepository.fulfillCheckoutSession).not.toHaveBeenCalled();
  });

  it("repeated webhook and browser reconciliation notify only the DB transition winner", async () => {
    let won = false;
    paymentsRepository.fulfillCheckoutSession.mockImplementation(async () => {
      if (won) return { state: "already_fulfilled", lead: lead() };
      won = true;
      return { state: "fulfilled", lead: lead() };
    });

    await paymentsUsecase.handleWebhook({ rawBody: Buffer.from("{}"), signature: "sig" });
    await paymentsUsecase.handleWebhook({ rawBody: Buffer.from("{}"), signature: "sig" });
    await paymentsUsecase.paymentStatus({
      sessionId: "cs_bound",
      clientLeadId: 5,
      lng: "en",
    });

    expect(paymentsRepository.fulfillCheckoutSession).toHaveBeenCalledTimes(3);
    expect(leadPaymentSuccessed).toHaveBeenCalledTimes(1);
    expect(sendPaymentSuccessEmail).toHaveBeenCalledTimes(1);
  });

  it("ignores an early unpaid event, then fulfills once when a later paid event arrives", async () => {
    retrieveCheckoutSession
      .mockResolvedValueOnce(session({ payment_status: "unpaid" }))
      .mockResolvedValueOnce(session({ payment_status: "paid" }))
      .mockResolvedValueOnce(session({ payment_status: "unpaid" }));

    const early = await paymentsUsecase.handleWebhook({
      rawBody: Buffer.from("{}"),
      signature: "sig",
    });
    const paid = await paymentsUsecase.handleWebhook({
      rawBody: Buffer.from("{}"),
      signature: "sig",
    });
    const lateOld = await paymentsUsecase.handleWebhook({
      rawBody: Buffer.from("{}"),
      signature: "sig",
    });

    expect(early.fulfilled).toBe(false);
    expect(paid.fulfilled).toBe(true);
    expect(lateOld.fulfilled).toBe(false);
    expect(paymentsRepository.fulfillCheckoutSession).toHaveBeenCalledTimes(1);
    expect(leadPaymentSuccessed).toHaveBeenCalledTimes(1);
  });

  it("fulfills a completed zero-price session with no payment required", async () => {
    retrieveCheckoutSession.mockResolvedValue(
      session({ payment_status: "no_payment_required", payment_intent: null }),
    );

    const result = await paymentsUsecase.handleWebhook({
      rawBody: Buffer.from("{}"),
      signature: "sig",
    });

    expect(result).toMatchObject({ handled: true, fulfilled: true });
    expect(paymentsRepository.fulfillCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ clientLeadId: "5", sessionId: "cs_bound" }),
    );
  });

  it("reuses a bound open checkout without creating a session or resending the reminder", async () => {
    retrieveCheckoutSession.mockResolvedValue(
      session({
        status: "open",
        payment_status: "unpaid",
        url: "https://checkout.stripe.test/existing",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }),
    );

    const result = await paymentsUsecase.pay({
      clientId: 1,
      clientLeadId: 5,
      lng: "en",
    });

    expect(result).toEqual({ url: "https://checkout.stripe.test/existing" });
    expect(createCheckoutSession).not.toHaveBeenCalled();
    expect(sendPaymentReminderEmail).not.toHaveBeenCalled();
  });

  it("does not replace a completed bound checkout while fulfillment is reconciling", async () => {
    retrieveCheckoutSession.mockResolvedValue(
      session({ payment_status: "no_payment_required", url: null }),
    );

    await expect(
      paymentsUsecase.pay({ clientId: 1, clientLeadId: 5, lng: "en" }),
    ).rejects.toMatchObject({ code: "PAYMENT_NOT_ALLOWED", statusCode: 409 });
    expect(createCheckoutSession).not.toHaveBeenCalled();
    expect(sendPaymentReminderEmail).not.toHaveBeenCalled();
  });
});

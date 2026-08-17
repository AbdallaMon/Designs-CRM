import { readFileSync } from "node:fs";
import Stripe from "stripe";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let constructWebhookEvent;
let isFulfillableCheckoutSession;
const priorStripeKey = process.env.STRIPE_SECRET_KEY;
const priorWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const webhookSecret = "whsec_test_client_payments";

beforeAll(async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_client_payments";
  process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
  ({ constructWebhookEvent, isFulfillableCheckoutSession } = await import(
    "../payments.stripe.js"
  ));
});

afterAll(() => {
  if (priorStripeKey === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = priorStripeKey;
  if (priorWebhookSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
  else process.env.STRIPE_WEBHOOK_SECRET = priorWebhookSecret;
});

describe("Stripe webhook gateway", () => {
  it("verifies the exact raw payload and rejects a bad signature", () => {
    const payload = JSON.stringify({
      id: "evt_test",
      object: "event",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test" } },
    });
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    });

    expect(
      constructWebhookEvent(Buffer.from(payload), signature),
    ).toMatchObject({ id: "evt_test", type: "checkout.session.completed" });
    expect(() =>
      constructWebhookEvent(Buffer.from(payload), "t=1,v1=bad"),
    ).toThrow();
  });

  it("fails closed when STRIPE_WEBHOOK_SECRET is missing", () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(() =>
      constructWebhookEvent(Buffer.from("{}"), "t=1,v1=anything"),
    ).toThrow(expect.objectContaining({ code: "STRIPE_WEBHOOK_SECRET_MISSING" }));
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
  });

  it("requires complete plus paid/no-payment-required status", () => {
    expect(
      isFulfillableCheckoutSession({
        mode: "payment",
        status: "complete",
        payment_status: "no_payment_required",
      }),
    ).toBe(true);
    expect(
      isFulfillableCheckoutSession({
        mode: "payment",
        status: "complete",
        payment_status: "unpaid",
      }),
    ).toBe(false);
    expect(
      isFulfillableCheckoutSession({
        mode: "payment",
        status: "open",
        payment_status: "paid",
      }),
    ).toBe(false);
  });

  it("registers the raw webhook parser before the global JSON parser", () => {
    const appSource = readFileSync(new URL("../../../../app.js", import.meta.url), "utf8");
    expect(appSource.indexOf('"/v2/client/stripe/webhook"')).toBeGreaterThan(-1);
    expect(appSource.indexOf('"/v2/client/stripe/webhook"')).toBeLessThan(
      appSource.indexOf("app.use(express.json())"),
    );
  });
});

// client-portal/payments usecase — the PUBLIC client Stripe checkout flow (legacy
// `routes/client/payments.js`, mounted PATHLESS under `/client`, NO auth). Three endpoints:
//   POST /pay              → create a $0 "book now" checkout + send the reminder email
//   GET  /payment-status   → verify a checkout; on `paid`, mark the lead FULLY_PAID
//   GET  /stripe/backfill  → secret-gated maintenance (legacy early-returns null → no-op)
//
// PUBLIC BY DESIGN — a prospective client paying the booking fee has no login session. The
// authoritative payment proof is the STRIPE SESSION itself, not a client-supplied id.
//
// 🔒 The Stripe SDK calls are FROZEN (relocated verbatim into payments.stripe.js); the billing
// normalization (`first`/`asKV`) is reused from the frozen `services/main/client/payments.js`
// via lazy adapters. The email side effects use the frozen `services/notification.js`.
//
// IDOR CLOSE (vs legacy): legacy `/payment-status` marked the lead identified by the
// CLIENT-SUPPLIED `clientLeadId` as FULLY_PAID once ANY `sessionId` came back `paid` — a
// caller could mark an arbitrary lead paid using an unrelated paid session. v2 derives the
// target lead from the VERIFIED session's `metadata.clientLeadId` and rejects a mismatch.
import { AppError } from "../../../shared/errors/AppError.js";
import { env } from "../../../config/env.js";
import { clientPortalMessagesCodes } from "@dms/shared";
import {
  createCheckoutSession,
  retrieveCheckoutSession,
} from "./payments.stripe.js";
import { paymentsRepository } from "./payments.repository.js";

const C = clientPortalMessagesCodes;

const legacyDefaults = {
  first: (...a) =>
    import("../../../../services/main/client/payments.js").then((m) => m.first(...a)),
  asKV: (o) =>
    import("../../../../services/main/client/payments.js").then((m) => m.asKV(o)),
  sendPaymentReminderEmail: (...a) =>
    import("../../../../services/notification.js").then((m) =>
      m.sendPaymentReminderEmail(...a),
    ),
  sendPaymentSuccessEmail: (...a) =>
    import("../../../../services/notification.js").then((m) =>
      m.sendPaymentSuccessEmail(...a),
    ),
  leadPaymentSuccessed: (id) =>
    import("../../../../services/notification.js").then((m) =>
      m.leadPaymentSuccessed(id),
    ),
};

export class PaymentsUsecase {
  constructor(repository, stripe = {}, legacy = {}) {
    this.repository = repository;
    this.stripe = {
      createCheckoutSession,
      retrieveCheckoutSession,
      ...stripe,
    };
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // POST /pay — create the checkout for the lead, email the reminder. Returns `{ url }` so the
  // FE redirect is unchanged.
  async pay({ clientId, clientLeadId, lng }) {
    const lead = await this.repository.getLeadWithClient(clientLeadId);
    if (!lead?.client) {
      throw new AppError(C.PAYMENT_LEAD_NOT_FOUND, 404);
    }

    const session = await this.stripe.createCheckoutSession({
      clientId,
      clientLeadId,
      lng,
    });

    await this.legacy.sendPaymentReminderEmail(
      lead.client.email,
      lead.client.name,
      session.url,
      lng,
    );

    return { url: session.url };
  }

  // GET /payment-status — verify a checkout. On `paid`, the lead is the one named in the
  // VERIFIED session metadata; the client-supplied clientLeadId must match it.
  async paymentStatus({ sessionId, clientLeadId, lng }) {
    const session = await this.stripe.retrieveCheckoutSession(sessionId);

    if (session.payment_status !== "paid") {
      // Legacy returned 402 with a prose message; we return a code (the controller maps the
      // not-completed branch to 402).
      return { paid: false };
    }

    // IDOR close: trust the SESSION, not the caller's clientLeadId.
    const metaLeadId = session.metadata?.clientLeadId;
    if (!metaLeadId || Number(metaLeadId) !== Number(clientLeadId)) {
      throw new AppError(C.PAYMENT_NOT_ALLOWED, 403);
    }

    const lead = await this.repository.getLeadPaymentState(metaLeadId);
    if (!lead) {
      throw new AppError(C.PAYMENT_LEAD_NOT_FOUND, 404);
    }

    if (lead.paymentStatus !== "FULLY_PAID") {
      await this.repository.markFullyPaid(metaLeadId, session.id);
      await this.legacy.leadPaymentSuccessed(metaLeadId);
    }

    const kv = await this.#buildBillingKV(session);
    await this.repository.saveStripeMetadata(metaLeadId, kv);

    await this.legacy.sendPaymentSuccessEmail(
      lead.client.email,
      lead.client.name,
      metaLeadId,
      lng,
    );

    return { paid: true, session, kv };
  }

  // GET /stripe/backfill — legacy guarded on a secret then early-returned null (the backfill
  // body was unreachable). Preserve the secret gate + the no-op exactly.
  backfill({ pass }) {
    // Fail CLOSED: if the dedicated secret is unset, deny rather than open the gate
    // (the old `pass !== SECRET_KEY` opened when both sides were undefined).
    if (!env.BACKFILL_SECRET || pass !== env.BACKFILL_SECRET) {
      throw new AppError(C.PAYMENT_NOT_ALLOWED, 403);
    }
    return { ok: true };
  }

  // Normalize Stripe billing details into the legacy KV shape (verbatim field derivation,
  // reusing the frozen `first`/`asKV`).
  async #buildBillingKV(session) {
    const first = (...a) => this.legacy.first(...a);

    const pi = session.payment_intent || null;
    const charge = pi?.latest_charge || null;
    const pm = pi?.payment_method || null;

    const billing = {
      name: await first(
        charge?.billing_details?.name,
        pm?.billing_details?.name,
        session.customer_details?.name,
      ),
      email: await first(
        charge?.billing_details?.email,
        pm?.billing_details?.email,
        session.customer_details?.email,
      ),
      phone: await first(
        charge?.billing_details?.phone,
        pm?.billing_details?.phone,
        session.customer_details?.phone,
      ),
      address:
        charge?.billing_details?.address ||
        pm?.billing_details?.address ||
        session.customer_details?.address ||
        null,
    };

    const addr = billing.address || {};

    let paymentMethod = "";
    const pmd = charge?.payment_method_details;
    if (pmd?.type === "card") {
      const walletType = pmd.card?.wallet?.type;
      if (walletType) {
        paymentMethod = walletType
          .split("_")
          .map((s) => s[0].toUpperCase() + s.slice(1))
          .join(" ");
      } else {
        const brand = pm?.card?.brand || pmd.card?.brand || "Card";
        paymentMethod = brand[0].toUpperCase() + brand.slice(1);
      }
    } else if (pmd?.type) {
      paymentMethod = pmd.type[0].toUpperCase() + pmd.type.slice(1);
    }

    const normalized = {
      name: await first(billing.name),
      email: await first(billing.email),
      phone: await first(billing.phone),
      billingAddressLine1: await first(addr.line1),
      billingAddressLine2: await first(addr.line2),
      billingCity: await first(addr.city),
      billingState: await first(addr.state),
      billingPostalCode: await first(addr.postal_code),
      billingCountry: await first(addr.country),
      paymentMethod: await first(paymentMethod),
    };

    return this.legacy.asKV(normalized);
  }
}

export const paymentsUsecase = new PaymentsUsecase(paymentsRepository);

// client-portal/payments usecase — the PUBLIC client Stripe checkout flow (legacy
// `routes/client/payments.js`, mounted PATHLESS under `/client`, NO login session).
//   POST /pay              → capability-gated $0 checkout + one reminder attempt
//   POST /stripe/webhook   → signature-verified, idempotent fulfillment
//   GET  /payment-status   → repeat-safe Stripe status/read reconciliation
//   GET  /stripe/backfill  → secret-gated maintenance (legacy early-returns null → no-op)
//
// PUBLIC BY DESIGN — a prospective client paying the booking fee has no login session. The
// authoritative payment proof is the STRIPE SESSION itself, not a client-supplied id.
//
// 🔒 The checkout creation inputs/URLs are FROZEN in payments.stripe.js; the billing
// normalization (`first`/`asKV`) lives in payments.dto.js and is imported directly. The email
// side effects use the frozen `src/infra/notifications/index.js` senders directly.
//
// IDOR CLOSE (vs legacy): legacy `/payment-status` marked the lead identified by the
// CLIENT-SUPPLIED `clientLeadId` as FULLY_PAID once ANY `sessionId` came back `paid` — a
// caller could mark an arbitrary lead paid using an unrelated paid session. v2 derives the
// target lead from the VERIFIED session's `metadata.clientLeadId` and rejects a mismatch.
import { AppError } from "../../../shared/errors/AppError.js";
import { env } from "../../../config/env.js";
import { PAYMENT_STATUSES, clientPortalMessagesCodes } from "@dms/shared";
import {
  createCheckoutSession,
  retrieveCheckoutSession,
  listCheckoutSessions,
  getLeadIdFromUrl,
  normalizeFromSession,
  constructWebhookEvent,
  isFulfillableCheckoutSession,
} from "./payments.stripe.js";
import { first, asKV } from "./payments.dto.js";
import { paymentsRepository } from "./payments.repo.js";
import {
  sendPaymentReminderEmail,
  sendPaymentSuccessEmail,
  leadPaymentSuccessed,
} from "../../../infra/notifications/index.js";
import {
  PUBLIC_FUNNEL_PURPOSES,
  verifyPublicFunnelCapability,
} from "../../../infra/upload/public-funnel-capability.js";

const FULFILLMENT_EVENT_TYPES = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

export class PaymentsUsecase {
  // POST /pay — create the checkout for the lead, email the reminder. Returns `{ url }` so the
  // FE redirect is unchanged.
  async pay({ clientId, clientLeadId, lng }) {
    const lead = await paymentsRepository.getLeadWithClient(clientLeadId);
    if (!lead?.client) {
      throw new AppError({ code: clientPortalMessagesCodes.PAYMENT_LEAD_NOT_FOUND, statusCode: 404 });
    }

    if (clientId != null && Number(clientId) !== Number(lead.client.id)) {
      throw new AppError({ code: clientPortalMessagesCodes.PAYMENT_NOT_ALLOWED, statusCode: 403 });
    }
    if (lead.paymentStatus === PAYMENT_STATUSES.FULLY_PAID) {
      throw new AppError({ code: clientPortalMessagesCodes.PAYMENT_NOT_ALLOWED, statusCode: 409 });
    }

    const existingSession = await this.#getBoundCheckoutSession(
      lead.paymentSessionId,
      lead.id,
    );
    if (existingSession) {
      const expiresAt = Number(existingSession.expires_at) * 1000;
      const isActive =
        existingSession.status === "open" &&
        existingSession.url &&
        (!Number.isFinite(expiresAt) || expiresAt > Date.now());
      if (isActive) return { url: existingSession.url };
      if (
        existingSession.status !== "expired" &&
        !(existingSession.status === "open" && expiresAt <= Date.now())
      ) {
        // Never replace a completed/pending session before webhook/status reconciliation.
        throw new AppError({
          code: clientPortalMessagesCodes.PAYMENT_NOT_ALLOWED,
          statusCode: 409,
        });
      }
    }

    const session = await createCheckoutSession({
      clientId: lead.client.id,
      clientLeadId: lead.id,
      lng,
    });

    const bound = await paymentsRepository.bindCheckoutSession({
      clientLeadId: lead.id,
      expectedSessionId: lead.paymentSessionId,
      sessionId: session.id,
    });
    if (!bound) {
      const current = await paymentsRepository.getLeadWithClient(lead.id);
      const winner = await this.#getBoundCheckoutSession(
        current?.paymentSessionId,
        lead.id,
      );
      if (winner?.status === "open" && winner.url) return { url: winner.url };
      throw new AppError({
        code: clientPortalMessagesCodes.PAYMENT_CHECKOUT_FAILED,
        statusCode: 409,
      });
    }

    await sendPaymentReminderEmail(
      lead.client.email,
      lead.client.name,
      session.url,
      lng,
    );

    return { url: session.url };
  }

  authorizePay(clientLeadId, token) {
    return verifyPublicFunnelCapability(token, {
      purpose: PUBLIC_FUNNEL_PURPOSES.PUBLIC_REGISTER,
      leadId: clientLeadId,
    });
  }

  // GET /payment-status — verify a checkout. On `paid`, the lead is the one named in the
  // VERIFIED session metadata; the client-supplied clientLeadId must match it.
  async paymentStatus({ sessionId, clientLeadId, lng }) {
    const session = await retrieveCheckoutSession(sessionId);
    return this.#reconcileVerifiedSession({
      session,
      requestedLeadId: clientLeadId,
      lng,
    });
  }

  async handleWebhook({ rawBody, signature }) {
    let event;
    try {
      event = constructWebhookEvent(rawBody, signature);
    } catch (error) {
      throw new AppError({
        code: clientPortalMessagesCodes.PAYMENT_VERIFY_FAILED,
        statusCode:
          error?.code === "STRIPE_WEBHOOK_SECRET_MISSING" ? 500 : 400,
      });
    }

    if (!FULFILLMENT_EVENT_TYPES.has(event.type)) {
      return { received: true, handled: false };
    }

    const eventSession = event.data?.object;
    if (!eventSession?.id) {
      throw new AppError({
        code: clientPortalMessagesCodes.PAYMENT_VERIFY_FAILED,
        statusCode: 400,
      });
    }

    const session = await retrieveCheckoutSession(eventSession.id);
    const result = await this.#reconcileVerifiedSession({
      session,
      lng: session.metadata?.lng,
    });
    return {
      received: true,
      handled: true,
      fulfilled: result.paid,
    };
  }

  // GET /stripe/backfill — legacy guarded on a secret then early-returned null (the backfill
  // body was unreachable). Preserve the secret gate + the no-op exactly.
  backfill({ pass }) {
    // Fail CLOSED: if the dedicated secret is unset, deny rather than open the gate
    // (the old `pass !== SECRET_KEY` opened when both sides were undefined).
    if (!env.BACKFILL_SECRET || pass !== env.BACKFILL_SECRET) {
      throw new AppError({ code: clientPortalMessagesCodes.PAYMENT_NOT_ALLOWED, statusCode: 403 });
    }
    return { ok: true };
  }

  // Normalize Stripe billing details into the legacy KV shape (verbatim field derivation,
  // using the pure `first`/`asKV` from payments.dto.js).
  #buildBillingKV(session) {
    const pi = session.payment_intent || null;
    const charge = pi?.latest_charge || null;
    const pm = pi?.payment_method || null;

    const billing = {
      name: first(
        charge?.billing_details?.name,
        pm?.billing_details?.name,
        session.customer_details?.name,
      ),
      email: first(
        charge?.billing_details?.email,
        pm?.billing_details?.email,
        session.customer_details?.email,
      ),
      phone: first(
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
      name: first(billing.name),
      email: first(billing.email),
      phone: first(billing.phone),
      billingAddressLine1: first(addr.line1),
      billingAddressLine2: first(addr.line2),
      billingCity: first(addr.city),
      billingState: first(addr.state),
      billingPostalCode: first(addr.postal_code),
      billingCountry: first(addr.country),
      paymentMethod: first(paymentMethod),
    };

    return asKV(normalized);
  }

  async #getBoundCheckoutSession(sessionId, clientLeadId) {
    if (!sessionId) return null;
    try {
      const session = await retrieveCheckoutSession(sessionId);
      if (Number(session.metadata?.clientLeadId) !== Number(clientLeadId)) {
        throw new AppError({
          code: clientPortalMessagesCodes.PAYMENT_NOT_ALLOWED,
          statusCode: 403,
        });
      }
      return session;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error?.code === "resource_missing") return null;
      // A transient Stripe lookup failure must not create a second checkout blindly.
      throw new AppError({
        code: clientPortalMessagesCodes.PAYMENT_CHECKOUT_FAILED,
        statusCode: 502,
      });
    }
  }

  async #reconcileVerifiedSession({ session, requestedLeadId, lng }) {
    const metaLeadId = session?.metadata?.clientLeadId;
    if (
      !metaLeadId ||
      (requestedLeadId != null &&
        Number(metaLeadId) !== Number(requestedLeadId))
    ) {
      throw new AppError({
        code: clientPortalMessagesCodes.PAYMENT_NOT_ALLOWED,
        statusCode: 403,
      });
    }

    if (!isFulfillableCheckoutSession(session)) {
      return { paid: false };
    }

    const kv = this.#buildBillingKV(session);
    const fulfillment = await paymentsRepository.fulfillCheckoutSession({
      clientLeadId: metaLeadId,
      sessionId: session.id,
      kv,
    });

    if (fulfillment.state === "missing") {
      throw new AppError({
        code: clientPortalMessagesCodes.PAYMENT_LEAD_NOT_FOUND,
        statusCode: 404,
      });
    }
    if (fulfillment.state === "session_mismatch") {
      throw new AppError({
        code: clientPortalMessagesCodes.PAYMENT_NOT_ALLOWED,
        statusCode: 403,
      });
    }

    if (fulfillment.state === "fulfilled") {
      await Promise.allSettled([
        leadPaymentSuccessed(Number(metaLeadId)),
        sendPaymentSuccessEmail(
          fulfillment.lead.client.email,
          fulfillment.lead.client.name,
          Number(metaLeadId),
          lng,
        ),
      ]);
    }

    return { paid: true, session, kv };
  }

  // DORMANT maintenance orchestration — relocated VERBATIM from the legacy
  // `services/main/client/payments.js` `backfillStripeSessions`. There is NO live caller (the
  // `/stripe/backfill` route resolves to the no-op `backfill()` above); this is kept in its
  // proper layer (Stripe reads via payments.stripe.js, the lead read/write via payments.repo.js)
  // rather than deleted. Behavior is unchanged from legacy.
  async backfillStripeSessions({
    sinceEpoch = 0,
    limitPerPage = 1000,
    maxPages = 1000,
  } = {}) {
    let starting_after = undefined;
    let processed = 0;

    for (let page = 0; page < maxPages; page++) {
      const list = await listCheckoutSessions({
        limit: limitPerPage,
        starting_after,
        sinceEpoch,
      });
      if (!list.data.length) break;

      for (const session of list.data) {
        starting_after = session.id;
        if (session.mode !== "payment" || session.payment_status !== "paid")
          continue;

        const leadId =
          first(session.metadata?.clientLeadId) ||
          first(getLeadIdFromUrl(session.success_url));
        if (!leadId) continue;

        const { normalized } = await normalizeFromSession(session);
        const kv = asKV(normalized);

        const lead = await paymentsRepository.findLeadById(leadId);
        if (!lead) continue;

        await paymentsRepository.saveStripeMetadata(leadId, kv);

        processed++;
      }

      if (!list.has_more) break;
    }

    return { processed };
  }
}

export const paymentsUsecase = new PaymentsUsecase();

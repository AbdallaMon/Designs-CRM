// client-portal/payments — Stripe gateway. The Stripe SDK calls are lifted VERBATIM from the
// legacy `routes/client/payments.js` route (which had them inline). 🔒 DO NOT alter the
// checkout-session creation or the retrieve/expand list — the payment behavior is frozen.
// There is NO webhook/signature handling in this flow (the legacy route had none); nothing
// about signature verification is touched.
import Stripe from "stripe";
import { first } from "./payments.dto.js";

// Lazily instantiate the Stripe client on first use (not at import time). Legacy created it at
// module top-level, which crashes if STRIPE_SECRET_KEY is absent (e.g. in unit tests / a boot
// without the secret). Reading the key at call time is behavior-equivalent in the running
// server (the key is set there) and keeps the module importable without it. The SDK calls
// below are otherwise UNCHANGED.
let _stripe = null;
function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

// VERBATIM from legacy `/pay`. The only inputs are the (already validated) ids + lng; the
// product/amount ($0 placeholder) is fixed exactly as legacy.
export function createCheckoutSession({ clientId, clientLeadId, lng }) {
  return getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    metadata: {
      clientId,
      clientLeadId,
      lng,
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name:
              lng === "en"
                ? "[Book now and start your design]"
                : "[احجز الآن وابدأ تصميمك]",
            description:
              lng === "en"
                ? "$39 - Fully deducted upon contract"
                : "٣٩ دولار 💵 – تُخصم بالكامل عند التعاقد",
          },
          unit_amount: 0,
        },
        quantity: 1,
      },
    ],
    // Return the CUSTOMER to the booking website (where /success + /cancel live),
    // NOT the CRM admin app. master used process.env.ORIGIN (the booking site);
    // the migration mis-pointed these at CRM_ORIGIN (:3001), which has no such pages.
    // BOOKING_ORIGIN already includes the `/register` base, so `${BOOKING_ORIGIN}/success`
    // resolves to the site's /register/success (SuccessView) and `/cancel` to /register/cancel.
    success_url: `${process.env.BOOKING_ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}&clientId=${clientId}&clientLeadId=${clientLeadId}&lng=${lng}`,
    cancel_url: `${process.env.BOOKING_ORIGIN}/cancel?session_id={CHECKOUT_SESSION_ID}&clientId=${clientId}&clientLeadId=${clientLeadId}&lng=${lng}`,
  });
}

// VERBATIM expand list from legacy `/payment-status`.
export function retrieveCheckoutSession(sessionId) {
  return getStripe().checkout.sessions.retrieve(sessionId, {
    expand: [
      "customer",
      "payment_intent.payment_method",
      "payment_intent.latest_charge",
      "payment_intent.latest_charge.balance_transaction",
      "payment_intent.latest_charge.payment_method_details",
    ],
  });
}

// ─── Backfill maintenance Stripe reads (relocated VERBATIM from the legacy
// `services/main/client/payments.js` `backfillStripeSessions`). These support the DORMANT
// `PaymentsUsecase.backfillStripeSessions` orchestration — there is no live caller (the
// `/stripe/backfill` route early-returns a no-op). Relocated, not deleted, to preserve the
// frozen Stripe logic in its proper layer.

// Pure URL parse — pulls `clientLeadId` from a session `success_url` query string.
export function getLeadIdFromUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.searchParams.get("clientLeadId") || "";
  } catch {
    return "";
  }
}

// VERBATIM billing normalization from the legacy backfill (its own `retrieve` + expand list,
// which differs from `retrieveCheckoutSession` above — do NOT merge them).
export async function normalizeFromSession(session) {
  if (!session?.id) return { normalized: {}, piId: null };

  const full = await getStripe().checkout.sessions.retrieve(session.id, {
    expand: [
      "payment_intent.payment_method",
      "payment_intent.latest_charge",
      "payment_intent.latest_charge.payment_method_details",
    ],
  });

  const pi = full.payment_intent || null;
  const charge = pi?.latest_charge || null;
  const pm = pi?.payment_method || null;

  const billing = {
    name: first(
      charge?.billing_details?.name,
      pm?.billing_details?.name,
      full.customer_details?.name
    ),
    email: first(
      charge?.billing_details?.email,
      pm?.billing_details?.email,
      full.customer_details?.email
    ),
    phone: first(
      charge?.billing_details?.phone,
      pm?.billing_details?.phone,
      full.customer_details?.phone
    ),
    address:
      charge?.billing_details?.address ||
      pm?.billing_details?.address ||
      full.customer_details?.address ||
      null,
  };

  const addr = billing.address || {};
  const pmd = charge?.payment_method_details;

  let paymentMethod = "";
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

  return { normalized, piId: pi?.id || null };
}

// VERBATIM Stripe list call from the legacy backfill (the page params are built exactly as
// legacy: optional `starting_after` cursor + optional `created.gte` epoch filter).
export function listCheckoutSessions({ limit, starting_after, sinceEpoch }) {
  return getStripe().checkout.sessions.list({
    limit,
    ...(starting_after ? { starting_after } : {}),
    ...(sinceEpoch ? { created: { gte: sinceEpoch } } : {}),
  });
}

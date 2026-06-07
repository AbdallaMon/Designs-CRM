// client-portal/payments — Stripe gateway. The Stripe SDK calls are lifted VERBATIM from the
// legacy `routes/client/payments.js` route (which had them inline). 🔒 DO NOT alter the
// checkout-session creation or the retrieve/expand list — the payment behavior is frozen.
// There is NO webhook/signature handling in this flow (the legacy route had none); nothing
// about signature verification is touched.
import Stripe from "stripe";

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
    success_url: `${process.env.ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}&clientId=${clientId}&clientLeadId=${clientLeadId}&lng=${lng}`,
    cancel_url: `${process.env.ORIGIN}/cancel?session_id={CHECKOUT_SESSION_ID}&clientId=${clientId}&clientLeadId=${clientLeadId}&lng=${lng}`,
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

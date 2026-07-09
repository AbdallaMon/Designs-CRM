// Singleton Stripe client. Moved out of the legacy payment-services so the SDK client is
// shared infra (mirrors the singleton-prisma rule) instead of a module-level `new Stripe(...)`
// inside a service.
//
// Constructed LAZILY on first use (behind a Proxy) rather than at import time. This
// preserves legacy behavior EXACTLY: the legacy `new Stripe(...)` lived in
// payment-services.js, which was only ever reached lazily (via the shared/legacy barrel
// `import().then()`), so the client was never instantiated until a payment function ran.
// Eager construction here would instead run `new Stripe(undefined)` at import time — which
// throws when STRIPE_SECRET_KEY is absent (e.g. tests). Same key, same SDK options, same
// single shared instance; only the construction is deferred to first property access.
import Stripe from "stripe";

let client;

function getClient() {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}

const stripe = new Proxy(
  {},
  {
    get(_target, prop) {
      return getClient()[prop];
    },
  },
);

export default stripe;

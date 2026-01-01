import Stripe from "stripe";
import prisma from "../../../prisma/prisma.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const first = (...vals) =>
  vals.find((v) => v !== undefined && v !== null && `${v}`.trim() !== "") ?? "";

export const asKV = (obj) =>
  Object.entries(obj).map(([key, value]) => ({ key, value: value ?? "" }));

export function getLeadIdFromUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.searchParams.get("clientLeadId") || "";
  } catch {
    return "";
  }
}

export async function normalizeFromSession(session) {
  if (!session?.id) return { normalized: {}, piId: null };

  const full = await stripe.checkout.sessions.retrieve(session.id, {
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

export async function backfillStripeSessions({
  sinceEpoch = 0,
  limitPerPage = 1000,
  maxPages = 1000,
}) {
  let starting_after = undefined;
  let processed = 0;

  for (let page = 0; page < maxPages; page++) {
    const list = await stripe.checkout.sessions.list({
      limit: limitPerPage,
      ...(starting_after ? { starting_after } : {}),
      ...(sinceEpoch ? { created: { gte: sinceEpoch } } : {}),
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

      const lead = await prisma.clientLead.findUnique({
        where: { id: Number(leadId) },
        select: { id: true },
      });
      if (!lead) continue;

      await prisma.clientLead.update({
        where: { id: Number(leadId) },
        data: { stripieMetadata: kv },
      });

      processed++;
    }

    if (!list.has_more) break;
  }

  return { processed };
}

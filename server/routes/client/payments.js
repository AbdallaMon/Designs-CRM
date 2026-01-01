import express from "express";
const router = express.Router();
import Stripe from "stripe";
import prisma from "../../prisma/prisma.js";
import {
  sendPaymentReminderEmail,
  sendPaymentSuccessEmail,
  leadPaymentSuccessed,
} from "../../services/notification.js";
import {
  asKV,
  first,
  backfillStripeSessions,
} from "../../services/main/client/payments.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/pay", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      metadata: {
        clientId: req.body.clientId,
        clientLeadId: req.body.clientLeadId,
        lng: req.body.lng,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name:
                req.body.lng === "en"
                  ? "[Book now and start your design]"
                  : "[احجز الآن وابدأ تصميمك]",
              description:
                req.body.lng === "en"
                  ? "$39 - Fully deducted upon contract"
                  : "٣٩ دولار 💵 – تُخصم بالكامل عند التعاقد",
            },
            unit_amount: 0,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}&clientId=${req.body.clientId}&clientLeadId=${req.body.clientLeadId}&lng=${req.body.lng}`,
      cancel_url: `${process.env.ORIGIN}/cancel?session_id={CHECKOUT_SESSION_ID}&clientId=${req.body.clientId}&clientLeadId=${req.body.clientLeadId}&lng=${req.body.lng}`,
    });

    const clientLead = await prisma.clientLead.findUnique({
      where: { id: Number(req.body.clientLeadId) },
      select: {
        id: true,
        client: { select: { id: true, name: true, email: true } },
      },
    });

    await sendPaymentReminderEmail(
      clientLead.client.email,
      clientLead.client.name,
      session.url,
      req.body.lng
    );

    return res.json({ url: session.url });
  } catch (error) {
    console.error(
      "Error creating checkout:",
      error.response?.data || error.message
    );
    res.status(500).send("Internal Server Error");
  }
});

router.get("/payment-status", async (req, res) => {
  const { sessionId, clientLeadId, lng } = req.query;
  if (!sessionId || !clientLeadId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: [
        "customer",
        "payment_intent.payment_method",
        "payment_intent.latest_charge",
        "payment_intent.latest_charge.balance_transaction",
        "payment_intent.latest_charge.payment_method_details",
      ],
    });

    if (session.payment_status === "paid") {
      const oldLead = await prisma.clientLead.findUnique({
        where: { id: Number(clientLeadId) },
        select: {
          paymentStatus: true,
          client: { select: { name: true, email: true } },
        },
      });

      if (oldLead.paymentStatus !== "FULLY_PAID") {
        await prisma.clientLead.update({
          where: { id: Number(clientLeadId) },
          data: { paymentStatus: "FULLY_PAID", paymentSessionId: session.id },
        });
        await leadPaymentSuccessed(clientLeadId);
      }

      const pi = session.payment_intent || null;
      const charge = pi?.latest_charge || null;
      const pm = pi?.payment_method || null;

      const billing = {
        name: first(
          charge?.billing_details?.name,
          pm?.billing_details?.name,
          session.customer_details?.name
        ),
        email: first(
          charge?.billing_details?.email,
          pm?.billing_details?.email,
          session.customer_details?.email
        ),
        phone: first(
          charge?.billing_details?.phone,
          pm?.billing_details?.phone,
          session.customer_details?.phone
        ),
        address:
          charge?.billing_details?.address ||
          pm?.billing_details?.address ||
          session.customer_details?.address ||
          null,
      };

      const addr = billing.address || {};
      const billingAddress = {
        line1: first(addr.line1),
        line2: first(addr.line2),
        city: first(addr.city),
        state: first(addr.state),
        postal_code: first(addr.postal_code),
        country: first(addr.country),
      };

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
        billingAddressLine1: billingAddress.line1,
        billingAddressLine2: billingAddress.line2,
        billingCity: billingAddress.city,
        billingState: billingAddress.state,
        billingPostalCode: billingAddress.postal_code,
        billingCountry: billingAddress.country,
        paymentMethod: first(paymentMethod),
      };

      const kv = asKV(normalized);

      await prisma.clientLead.update({
        where: { id: Number(clientLeadId) },
        data: { stripieMetadata: kv },
      });

      await sendPaymentSuccessEmail(
        oldLead.client.email,
        oldLead.client.name,
        clientLeadId,
        lng
      );

      return res.status(200).json({
        paymentStatus: "PAID",
        success: true,
        message: "Payment verified",
        session,
        kv,
      });
    } else {
      return res.status(402).json({
        status: "ERROR",
        success: false,
        message: "Payment not completed",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ error: "Failed to verify payment" });
  }
});

router.get("/stripe/backfill", async (req, res) => {
  try {
    if (req.query.pass !== process.env.SECRET_KEY)
      throw new Error("Not allowed");
    return null;
    // preserved but unreachable (exactly as in your code)
    // eslint-disable-next-line no-unreachable
    const sinceEpoch = Number(req.body.sinceEpoch || 0);
    const result = await backfillStripeSessions({ sinceEpoch });
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e?.message || "Unknown error" });
  }
});

export default router;

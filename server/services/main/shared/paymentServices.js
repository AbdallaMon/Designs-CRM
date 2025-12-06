import Stripe from "stripe";
import prisma from "../../../prisma/prisma.js";
import {
  sendPaymentReminderEmailByStaff,
  sendPaymentSuccessEmail,
} from "../../notification.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function makePayments(data, leadId) {
  data.map((payment) => {
    payment.amountLeft = Number(payment.amount);
    payment.amount = Number(payment.amount);
    payment.paymentReason = payment.paymentReason;
    payment.clientLeadId = Number(leadId);
    payment.paymentLevel = "LEVEL_1";
  });
  await prisma.payment.createMany({ data });
  return data;
}

export async function makeExtraServicePayments({
  data,
  leadId,
  paymentReason,
  price,
  note,
}) {
  data.map((payment) => {
    payment.amountLeft = Number(payment.amount);
    payment.amount = Number(payment.amount);
    payment.paymentReason = paymentReason || "Extra service";
    payment.clientLeadId = Number(leadId);
    payment.paymentLevel = "LEVEL_1";
  });
  await prisma.payment.createMany({ data });
  await prisma.extraService.create({
    data: {
      clientLeadId: Number(leadId),
      price: Number(price),
      note: note,
    },
  });
  return data;
}

export async function editPriceOfferStatus(priceOfferId, isAccepted) {
  return await prisma.priceOffers.update({
    where: {
      id: Number(priceOfferId),
    },
    data: {
      isAccepted,
    },
  });
}

export async function remindUserToPay({ clientLeadId }) {
  const clientLead = await prisma.clientLead.findUnique({
    where: { id: Number(clientLeadId) },
    select: {
      id: true,
      paymentSessionId: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  let session;
  let reuseExistingSession = false;

  if (clientLead.paymentSessionId) {
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(
        clientLead.paymentSessionId
      );

      if (
        existingSession &&
        existingSession.status === "open" &&
        existingSession.expires_at * 1000 > Date.now()
      ) {
        session = existingSession;
        reuseExistingSession = true;
      }
    } catch (err) {
      console.warn("Could not retrieve Stripe session:", err.message);
    }
  }

  if (!reuseExistingSession) {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      metadata: {
        clientId: clientLead.client.id,
        clientLeadId: clientLead.id,
        lng: "ar",
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "[احجز الآن وابدأ تصميمك]",
              description: "٢٩ دولار 💵 – تُخصم بالكامل عند التعاقد",
            },
            unit_amount: 2900,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}&clientId=${clientLead.client.id}&clientLeadId=${clientLead.id}&lng=ar`,
      cancel_url: `${process.env.ORIGIN}/cancel?session_id={CHECKOUT_SESSION_ID}&clientId=${clientLead.client.id}&clientLeadId=${clientLead.id}&lng=ar`,
      expires_at: Math.floor(Date.now() / 1000) + 3600 * 24,
    });

    await prisma.clientLead.update({
      where: { id: clientLead.id },
      data: {
        paymentSessionId: session.id,
      },
    });
  }

  await sendPaymentReminderEmailByStaff(
    clientLead.client.email,
    clientLead.client.name,
    session.url,
    "ar"
  );
}

export async function remindUserToCompleteRegister({ clientLeadId }) {
  const clientLead = await prisma.clientLead.findUnique({
    where: { id: Number(clientLeadId) },
    select: {
      id: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  await sendPaymentSuccessEmail(
    clientLead.client.email,
    clientLead.client.name,
    clientLeadId,
    "ar"
  );
}

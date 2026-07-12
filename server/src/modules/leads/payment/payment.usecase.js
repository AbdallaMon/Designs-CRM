// leads/payment usecase — business logic / orchestration for lead payments. Prisma NEVER
// appears here (only paymentRepository). Ported 1:1 from the legacy
// shared/legacy/payment-services.js: the payment-array shaping stays here, Prisma I/O is
// delegated to the repo, the Stripe client is the shared singleton (infra/payments/stripe.js),
// and the reminder/success emails stay in the legacy notification service. All AR strings,
// `lng: "ar"`, currency, and amounts are preserved verbatim.
import stripe from "../../../infra/payments/stripe.js";
import { paymentRepository } from "./payment.repo.js";
import {
  sendPaymentReminderEmailByStaff,
  sendPaymentSuccessEmail,
} from "../../../infra/notifications/index.js";

export async function makePayments(data, leadId) {
  data.map((payment) => {
    payment.amountLeft = Number(payment.amount);
    payment.amount = Number(payment.amount);
    payment.paymentReason = payment.paymentReason;
    payment.clientLeadId = Number(leadId);
    payment.paymentLevel = "LEVEL_1";
  });
  await paymentRepository.createManyPayments({ data });
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
  await paymentRepository.createManyPayments({ data });
  await paymentRepository.createExtraService({
    clientLeadId: Number(leadId),
    price: Number(price),
    note: note,
  });
  return data;
}

export async function remindUserToPay({ clientLeadId }) {
  const clientLead = await paymentRepository.findLeadForPayment({ clientLeadId });

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
      success_url: `${process.env.CRM_ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}&clientId=${clientLead.client.id}&clientLeadId=${clientLead.id}&lng=ar`,
      cancel_url: `${process.env.CRM_ORIGIN}/cancel?session_id={CHECKOUT_SESSION_ID}&clientId=${clientLead.client.id}&clientLeadId=${clientLead.id}&lng=ar`,
      expires_at: Math.floor(Date.now() / 1000) + 3600 * 24,
    });

    await paymentRepository.updatePaymentSessionId({
      id: clientLead.id,
      paymentSessionId: session.id,
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
  const clientLead = await paymentRepository.findLeadForRegister({ clientLeadId });
  await sendPaymentSuccessEmail(
    clientLead.client.email,
    clientLead.client.name,
    clientLeadId,
    "ar"
  );
}

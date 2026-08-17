import { PAYMENT_STATUSES } from "@dms/shared";
// client-portal/payments repository — ALL Prisma I/O for the client checkout flow. Mirrors
// the legacy `routes/client/payments.js` queries 1:1 (read lead+client for the reminder
// email, read paymentStatus before marking paid, mark FULLY_PAID + persist the session id and
// the normalized billing KV).
import prisma from "../../../infra/prisma/prisma.js";

export class PaymentsRepository {
  runInTransaction(work) {
    return prisma.$transaction(work);
  }

  // For the /pay reminder email — the lead's owning client contact.
  getLeadWithClient(clientLeadId, client = prisma) {
    return client.clientLead.findUnique({
      where: { id: Number(clientLeadId) },
      select: {
        id: true,
        paymentStatus: true,
        paymentSessionId: true,
        client: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // For /payment-status — current payment status + client contact (success email).
  getLeadPaymentState(clientLeadId, client = prisma) {
    return client.clientLead.findUnique({
      where: { id: Number(clientLeadId) },
      select: {
        id: true,
        paymentStatus: true,
        paymentSessionId: true,
        client: { select: { name: true, email: true } },
      },
    });
  }

  async bindCheckoutSession({ clientLeadId, expectedSessionId, sessionId }) {
    const result = await prisma.clientLead.updateMany({
      where: {
        id: Number(clientLeadId),
        paymentSessionId: expectedSessionId ?? null,
        OR: [
          { paymentStatus: { not: PAYMENT_STATUSES.FULLY_PAID } },
          { paymentStatus: null },
        ],
      },
      data: { paymentSessionId: sessionId },
    });
    return result.count === 1;
  }

  async fulfillCheckoutSession({ clientLeadId, sessionId, kv }) {
    return this.runInTransaction(async (tx) => {
      const lead = await this.getLeadPaymentState(clientLeadId, tx);
      if (!lead) return { state: "missing", lead: null };
      if (lead.paymentSessionId && lead.paymentSessionId !== sessionId) {
        return { state: "session_mismatch", lead };
      }
      if (lead.paymentStatus === PAYMENT_STATUSES.FULLY_PAID) {
        return { state: "already_fulfilled", lead };
      }

      const result = await tx.clientLead.updateMany({
        where: {
          id: Number(clientLeadId),
          OR: [
            { paymentStatus: { not: PAYMENT_STATUSES.FULLY_PAID } },
            { paymentStatus: null },
          ],
          AND: [
            {
              OR: [
                { paymentSessionId: null },
                { paymentSessionId: sessionId },
              ],
            },
          ],
        },
        data: {
          paymentStatus: PAYMENT_STATUSES.FULLY_PAID,
          paymentSessionId: sessionId,
          // LONGTEXT in the reconciled production schema; the UI parses this legacy KV array.
          stripieMetadata: JSON.stringify(kv),
        },
      });

      if (result.count === 1) return { state: "fulfilled", lead };

      const latest = await this.getLeadPaymentState(clientLeadId, tx);
      if (latest?.paymentSessionId && latest.paymentSessionId !== sessionId) {
        return { state: "session_mismatch", lead: latest };
      }
      return { state: "already_fulfilled", lead: latest ?? lead };
    });
  }

  saveStripeMetadata(clientLeadId, kv) {
    return prisma.clientLead.update({
      where: { id: Number(clientLeadId) },
      data: { stripieMetadata: JSON.stringify(kv) },
    });
  }

  // Existence check for the DORMANT backfill orchestration (relocated verbatim from the legacy
  // `backfillStripeSessions` `findUnique({ select: { id } })` before it writes the metadata).
  findLeadById(clientLeadId) {
    return prisma.clientLead.findUnique({
      where: { id: Number(clientLeadId) },
      select: { id: true },
    });
  }
}

export const paymentsRepository = new PaymentsRepository();

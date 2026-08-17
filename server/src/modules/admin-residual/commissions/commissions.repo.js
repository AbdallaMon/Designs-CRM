import { LEAD_STATUSES } from "@dms/shared";
// admin-residual/commissions repository — Prisma I/O ONLY (no business math, no throws). The
// reads/writes are decomposed VERBATIM from the legacy `admin-services.js` god-file; the
// eligibility scan / 5%-seeding orchestration and the balance arithmetic stay in the usecase.
import prisma from "../../../infra/prisma/prisma.js";

export class CommissionsRepository {
  runInTransaction(work) {
    return prisma.$transaction(work);
  }

  lockLeadForCommission({ leadId, client }) {
    return client.$queryRaw`SELECT id FROM ClientLead WHERE id = ${leadId} FOR UPDATE`;
  }

  lockCommissionForUpdate({ commissionId, client }) {
    return client.$queryRaw`SELECT id FROM Commission WHERE id = ${commissionId} FOR UPDATE`;
  }

  // ── getCommissionByUserId reads/writes ──────────────────────────────────────────
  findEligibleLeads(userIdNumber) {
    return prisma.clientLead.findMany({
      where: {
        userId: userIdNumber,
        status: { in: [LEAD_STATUSES.FINALIZED, "ARCHIVED"] },
        commissionCleared: false,
        averagePrice: {
          not: null,
        },
      },
    });
  }

  findEligibleLeadById({ leadId, userId, client }) {
    return (client ?? prisma).clientLead.findFirst({
      where: {
        id: leadId,
        userId,
        status: { in: [LEAD_STATUSES.FINALIZED, "ARCHIVED"] },
        commissionCleared: false,
        averagePrice: { not: null },
      },
    });
  }

  findExistingCommission({ leadId, userId, client }) {
    return (client ?? prisma).commission.findFirst({
      where: {
        leadId,
        userId,
      },
    });
  }

  createCommission({ data, client }) {
    return (client ?? prisma).commission.create({ data });
  }

  markLeadCommissionCleared({ leadId, client }) {
    return (client ?? prisma).clientLead.update({
      where: { id: leadId },
      data: { commissionCleared: true },
    });
  }

  findCommissionsByUserId(userIdNumber) {
    return prisma.commission.findMany({
      where: {
        userId: userIdNumber,
      },
      select: {
        id: true,
        amount: true,
        amountPaid: true,
        isCleared: true,
        createdAt: true,
        leadId: true,
        userId: true,
        commissionReason: true,
        lead: {
          select: {
            id: true,
            client: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  // ── reverseCommissions writes ────────────────────────────────────────────────────
  deleteReversibleCommissions({ client } = {}) {
    return (client ?? prisma).commission.deleteMany({
      where: {
        lead: {
          status: {
            notIn: [LEAD_STATUSES.FINALIZED, "ARCHIVED"],
          },
        },
      },
    });
  }

  resetUnclearedLeads({ client } = {}) {
    return (client ?? prisma).clientLead.updateMany({
      where: {
        status: { in: [LEAD_STATUSES.FINALIZED, "ARCHIVED"] },
        commissionCleared: { not: false },
        commissions: {
          none: {},
        },
      },
      data: {
        commissionCleared: false,
      },
    });
  }

  // ── updateCommission reads/writes ────────────────────────────────────────────────
  findCommissionById({ id, client }) {
    return (client ?? prisma).commission.findUnique({
      where: { id },
    });
  }

  updateCommissionPayment({ id, amountPaid, isCleared, client }) {
    return (client ?? prisma).commission.update({
      where: { id },
      data: {
        amountPaid,
        isCleared,
      },
    });
  }

  // ── createCommissionByAdmin read/write ───────────────────────────────────────────
  findClientLeadForUser({ id, userId }) {
    return prisma.clientLead.findUnique({
      where: { id, userId },
    });
  }
}

export const commissionsRepository = new CommissionsRepository();

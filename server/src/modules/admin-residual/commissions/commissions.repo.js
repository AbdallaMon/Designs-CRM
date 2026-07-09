// admin-residual/commissions repository — Prisma I/O ONLY (no business math, no throws). The
// reads/writes are decomposed VERBATIM from the legacy `admin-services.js` god-file; the
// eligibility scan / 5%-seeding orchestration and the balance arithmetic stay in the usecase.
import prisma from "../../../infra/prisma/prisma.js";

export class CommissionsRepository {
  // ── getCommissionByUserId reads/writes ──────────────────────────────────────────
  findEligibleLeads(userIdNumber) {
    return prisma.clientLead.findMany({
      where: {
        userId: userIdNumber,
        status: { in: ["FINALIZED", "ARCHIVED"] },
        commissionCleared: false,
        averagePrice: {
          not: null,
        },
      },
    });
  }

  findExistingCommission({ leadId, userId }) {
    return prisma.commission.findFirst({
      where: {
        leadId,
        userId,
      },
    });
  }

  createCommission({ data }) {
    return prisma.commission.create({ data });
  }

  markLeadCommissionCleared(leadId) {
    return prisma.clientLead.update({
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
  deleteReversibleCommissions() {
    return prisma.commission.deleteMany({
      where: {
        lead: {
          status: {
            notIn: ["FINALIZED", "ARCHIVED"],
          },
        },
      },
    });
  }

  resetUnclearedLeads() {
    return prisma.clientLead.updateMany({
      where: {
        status: { in: ["FINALIZED", "ARCHIVED"] },
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
  findCommissionById(commissionIdNumber) {
    return prisma.commission.findUnique({
      where: { id: commissionIdNumber },
    });
  }

  updateCommissionPayment({ id, amountPaid, isCleared }) {
    return prisma.commission.update({
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

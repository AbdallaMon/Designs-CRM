// admin-residual/commissions usecase — orchestration + money math (Prisma delegated to
// commissions.repo.js). The commission logic (eligible-lead scan + 5% auto-commission
// seeding, balance arithmetic, admin manual commission) is ported VERBATIM from the legacy
// `admin-services.js` god-file; only the Prisma calls now go through the repo. The four
// operations are also exported as module functions so the DASHBOARD module can reuse
// `getCommissionByUserId` / `reverseCommissions` (it imported them from the god-file before).
import { commissionsRepository } from "./commissions.repo.js";

export async function getCommissionByUserId(userId) {
  const userIdNumber = parseInt(userId, 10);
  const eligibleLeads = await commissionsRepository.findEligibleLeads(userIdNumber);
  for (const lead of eligibleLeads) {
    const existingCommission = await commissionsRepository.findExistingCommission({
      leadId: lead.id,
      userId: userIdNumber,
    });

    if (!existingCommission && lead.averagePrice) {
      const commissionAmount = parseFloat(lead.averagePrice) * 0.05;

      await commissionsRepository.createCommission({
        data: {
          userId: userIdNumber,
          leadId: lead.id,
          amount: commissionAmount,
          amountPaid: 0,
          isCleared: false,
        },
      });

      await commissionsRepository.markLeadCommissionCleared(lead.id);
    }
  }
  const commissions = await commissionsRepository.findCommissionsByUserId(userIdNumber);
  return commissions;
}

export async function reverseCommissions() {
  await commissionsRepository.deleteReversibleCommissions();
  await commissionsRepository.resetUnclearedLeads();
}

export async function updateCommission({ commissionId, amount }) {
  const commissionIdNumber = parseInt(commissionId, 10);
  const paymentAmount = parseFloat(amount);
  if (isNaN(commissionIdNumber) || isNaN(paymentAmount) || paymentAmount <= 0) {
    throw new Error("Invalid commission ID or payment amount");
  }

  const commission = await commissionsRepository.findCommissionById(commissionIdNumber);
  const remainingAmount =
    parseFloat(commission.amount) - parseFloat(commission.amountPaid);

  if (paymentAmount > remainingAmount) {
    throw new Error("Payment amount exceeds remaining balance");
  }
  const newAmountPaid = parseFloat(commission.amountPaid) + paymentAmount;

  const isCleared = newAmountPaid >= parseFloat(commission.amount);
  await commissionsRepository.updateCommissionPayment({
    id: commissionIdNumber,
    amountPaid: newAmountPaid,
    isCleared: isCleared,
  });
  return await commissionsRepository.findCommissionById(commissionIdNumber);
}

export async function createCommissionByAdmin({
  userId,
  leadId,
  amount,
  commissionReason,
}) {
  const userIdNumber = parseInt(userId, 10);
  const clientLeadIdNumber = parseInt(leadId, 10);
  const commissionAmount = parseFloat(amount);
  if (
    isNaN(userIdNumber) ||
    isNaN(clientLeadIdNumber) ||
    isNaN(commissionAmount) ||
    commissionAmount <= 0 ||
    !commissionReason ||
    commissionReason.trim() === ""
  ) {
    throw new Error("Invalid user ID, lead ID, or commission amount");
  }
  const clientLead = await commissionsRepository.findClientLeadForUser({
    id: clientLeadIdNumber,
    userId: userIdNumber,
  });

  if (!clientLead) {
    throw new Error("Client lead not found or does not belong to the user");
  }
  return await commissionsRepository.createCommission({
    data: {
      userId: userIdNumber,
      leadId: clientLeadIdNumber,
      amount: commissionAmount,
      amountPaid: 0,
      isCleared: false,
      commissionReason: commissionReason,
    },
  });
}

class CommissionsUsecase {
  listCommissions({ userId }) {
    return getCommissionByUserId(userId);
  }

  createCommission({ userId, leadId, amount, commissionReason }) {
    return createCommissionByAdmin({ userId, leadId, amount, commissionReason });
  }

  updateCommission({ commissionId, amount }) {
    return updateCommission({ commissionId, amount });
  }
}

export const commissionsUsecase = new CommissionsUsecase();
export { CommissionsUsecase };

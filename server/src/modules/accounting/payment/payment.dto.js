// accounting/payment DTO — output shaping + per-record `capabilities.*` (FE rendering
// hints; the route guards remain the source of truth). Pure: no Prisma, no side effects.
import { computeCapabilities, hasPermission, PERMISSIONS } from "@dms/shared";

const P = PERMISSIONS.ACCOUNTING;

// A fully-paid payment cannot be paid again or marked overdue (legacy processPayment /
// markPaymentAsOverdue throw on FULLY_PAID). Surface that to the UI.
function isFullyPaid(record) {
  return record?.status === "FULLY_PAID";
}

/** Capabilities for a single payment record (list row or detail). */
export function computePaymentCapabilities(record, authUser) {
  const permissions = authUser?.permissions ?? [];
  return computeCapabilities(
    {
      canPay: () => hasPermission(permissions, P.PAYMENT_PROCESS) && !isFullyPaid(record),
      canMarkOverdue: () =>
        hasPermission(permissions, P.PAYMENT_MARK_OVERDUE) && !isFullyPaid(record),
      canChangeStatus: () => hasPermission(permissions, P.PAYMENT_CHANGE_LEVEL),
      canViewInvoices: () => hasPermission(permissions, P.PAYMENT_LIST),
    },
    {},
  );
}

/** Attach capabilities to a list of payment-shaped records. */
export function withPaymentListCapabilities(items, authUser) {
  if (!Array.isArray(items)) return items;
  return items.map((record) => ({ ...record, capabilities: computePaymentCapabilities(record, authUser) }));
}

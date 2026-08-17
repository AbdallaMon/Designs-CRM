import { CONTRACT_LEVELS } from "@dms/shared";
// accounting/payment helpers — pure, no Prisma, no side effects. Relocated verbatim from
// the legacy accountant service. `getNextPaymentLevel` is currently DEAD (its only caller,
// inside processPayment's payment.update, is commented out) but is preserved as-is.
// `generateInvoiceNumber` is used by the payment repo when creating an invoice.

// Define the PaymentLevel as a JavaScript object
export const PaymentLevel = {
  LEVEL_1: CONTRACT_LEVELS.LEVEL_1,
  LEVEL_2: CONTRACT_LEVELS.LEVEL_2,
  LEVEL_3: CONTRACT_LEVELS.LEVEL_3,
  LEVEL_4: CONTRACT_LEVELS.LEVEL_4,
  LEVEL_5: CONTRACT_LEVELS.LEVEL_5,
  LEVEL_6: CONTRACT_LEVELS.LEVEL_6,
  LEVEL_7_OR_MORE: "LEVEL_7_OR_MORE",
};

export function getNextPaymentLevel(currentLevel) {
  switch (currentLevel) {
    case PaymentLevel.LEVEL_1:
      return PaymentLevel.LEVEL_2;
    case PaymentLevel.LEVEL_2:
      return PaymentLevel.LEVEL_3;
    case PaymentLevel.LEVEL_3:
      return PaymentLevel.LEVEL_4;
    case PaymentLevel.LEVEL_4:
      return PaymentLevel.LEVEL_5;
    case PaymentLevel.LEVEL_5:
      return PaymentLevel.LEVEL_6;
    case PaymentLevel.LEVEL_6:
      return PaymentLevel.LEVEL_7_OR_MORE;
    case PaymentLevel.LEVEL_7_OR_MORE:
      return PaymentLevel.LEVEL_7_OR_MORE; // Already at the highest level
    default:
      // If null, undefined, or invalid value is provided
      return PaymentLevel.LEVEL_1; // Default to first level
  }
}

export function generateInvoiceNumber() {
  return "INV-" + Date.now();
}

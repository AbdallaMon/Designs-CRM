import PaymentCalendar from "@/features/accountant/payments/PaymentsCalendar";
import { PAYMENT_STATUSES } from "@dms/shared";

export default function page() {
  return <PaymentCalendar status={PAYMENT_STATUSES.FULLY_PAID} />;
}

"use client";
import { PaymentLevels } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import AccountantKanbanBoard from "@/features/Kanban/accountant/AccountantKanbanBoard";
import { FaCheckCircle, FaCube, FaExclamationCircle } from "react-icons/fa";
import { PAYMENT_STATUSES } from "@dms/shared";

export default function AccountantLanding() {
  const { setLoading } = useToastContext();
  const moveCard = async (payment, newPaymentLevel, setPayments) => {
    const request = await handleRequestSubmit(
      {
        newPaymentLevel,
      },
      setLoading,
      `accounting/payments/${payment.id}/actions/change-status`,
      false,
      "Updating",
      false,
      "POST"
    );
    if (request.status === 200) {
      setPayments((prev) =>
        prev.map((p) =>
          payment.id === p.id ? { ...p, paymentLevel: newPaymentLevel } : p
        )
      );
    }
  };
  const links = [
    {
      href: "/dashboard/payments/overdue",
      title: "See Overdue Payments",
      icon: <FaExclamationCircle />,
    },
    {
      href: "/dashboard/payments/paid",
      title: "See Paid Payments",
      icon: <FaCheckCircle />,
    },
  ];

  return (
    <AccountantKanbanBoard
      statusArray={Object.keys(PaymentLevels)}
      links={links}
      moveCard={moveCard}
      status={PAYMENT_STATUSES.NOT_PAID}
    />
  );
}

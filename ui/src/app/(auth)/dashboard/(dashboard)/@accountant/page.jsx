"use client";
import { PaymentLevels } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import AccountantKanbanBoard from "@/app/UiComponents/DataViewer/Kanban/AccountantKanbanBoard";
import { FaCheckCircle, FaCube, FaExclamationCircle } from "react-icons/fa";

export default function AccountantPage() {
  const { setLoading } = useToastContext();
  const moveCard = async (payment, newPaymentLevel, setPayments) => {
    const request = await handleRequestSubmit(
      {
        newPaymentLevel: newPaymentLevel,
        oldPaymentLevel: payment.paymentLevel,
      },
      setLoading,
      `accountant/payments/status/${payment.id}`,
      false,
      "Updating",
      false,
      "PUT"
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
    {
      href: "/dashboard/payments/3d-status",
      title: "View 3D Status",
      icon: <FaCube />,
    },
  ];

  return (
    <AccountantKanbanBoard
      statusArray={Object.keys(PaymentLevels)}
      links={links}
      moveCard={moveCard}
      status="NOT_PAID"
    />
  );
}

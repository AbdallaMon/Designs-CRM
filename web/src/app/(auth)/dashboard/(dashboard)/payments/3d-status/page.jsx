"use client";
import { ThreeDWorkStages } from "@/app/helpers/constants";
import { useAlertContext } from "@/app/providers/MuiAlert";
import AccountantKanbanBoard from "@/features/Kanban/accountant/AccountantKanbanBoard";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { PAYMENT_STATUSES, USER_FEEDBACK_MESSAGES } from "@dms/shared";

export default function AccountantPage() {
  const { setAlertError } = useAlertContext();
  const moveCard = async (payment, newPaymentLevel, setPayments) => {
    setAlertError(USER_FEEDBACK_MESSAGES.PAYMENT_STAGE_CHANGE_DENIED);
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
      statusArray={Object.keys(ThreeDWorkStages)}
      links={links}
      moveCard={moveCard}
      status={PAYMENT_STATUSES.NOT_PAID}
      type="three-d"
    />
  );
}

"use client";
import { ThreeDWorkStages } from "@/app/helpers/constants";
import { useAlertContext } from "@/app/providers/MuiAlert";
import AccountantKanbanBoard from "@/app/UiComponents/DataViewer/Kanban/accountant/AccountantKanbanBoard";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

export default function AccountantPage() {
  const { setAlertError } = useAlertContext();
  const moveCard = async (payment, newPaymentLevel, setPayments) => {
    setAlertError(
      "You are not allowed to change three d stages only payment levels"
    );
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
      status="NOT_PAID"
      type="three-d"
    />
  );
}

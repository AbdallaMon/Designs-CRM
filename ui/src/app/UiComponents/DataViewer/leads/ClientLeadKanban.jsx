"use client";
import React, { useEffect, useState } from "react";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FaBusinessTime } from "react-icons/fa";
import { FinalizeModal } from "./FinalizeModal";
import KanbanBoard from "../Kanban/KanbanBoard";
import { KanbanLeadsStatus } from "@/app/helpers/constants";
import { useAuth } from "@/app/providers/AuthProvider";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { checkIfAdmin } from "@/app/helpers/functions/utility";

dayjs.extend(relativeTime);

const DealsKanbanBoard = ({ staffId }) => {
  const { user } = useAuth();
  const admin = checkIfAdmin(user);
  const [finalizeModel, setFinalizeModel] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const {
    data: leads,
    loading,
    setData: setleads,
    setFilters,
  } = useDataFetcher("shared/client-leads/deals", false);
  useEffect(() => {
    if (admin) {
      setFilters((old) => ({ ...old, staffId }));
    }
  }, [staffId]);

  const { setLoading } = useToastContext();
  const movelead = async (l, newStatus) => {
    if (user.role === "SUPER_ADMIN") {
      return;
    }
    if (newStatus === "FINALIZED") {
      setCurrentId(l.id);
      setFinalizeModel(true);
      return;
    }
    const request = await handleRequestSubmit(
      {
        status: newStatus,
        oldStatus: l.status,
        isAdmin: user.role === "ADMIN",
      },
      setLoading,
      `shared/client-leads/${l.id}/status`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (request.status === 200) {
      setleads((prev) =>
        prev.map((lead) =>
          lead.id === l.id ? { ...lead, status: newStatus } : lead
        )
      );
    }
  };
  const links = [
    {
      href: "/dashboard/all-deals",
      title: "See all deals",
      icon: <FaBusinessTime />,
    },
  ];
  if (!leads) return;
  return (
    <>
      {currentId && (
        <FinalizeModal
          lead={leads?.find((l) => l.id === currentId)}
          open={finalizeModel}
          setOpen={setFinalizeModel}
          id={currentId}
          setId={setCurrentId}
          setleads={setleads}
        />
      )}
      <KanbanBoard
        leads={leads}
        loading={loading}
        links={links}
        movelead={movelead}
        setleads={setleads}
        statusArray={Object.keys(KanbanLeadsStatus)}
        setFilters={setFilters}
        type="STAFF"
      />
    </>
  );
};
export default DealsKanbanBoard;

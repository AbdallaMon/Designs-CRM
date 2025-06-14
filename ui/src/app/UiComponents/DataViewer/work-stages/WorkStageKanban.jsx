"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import KanbanBoard from "../Kanban/KanbanBoard";
import { PROJECT_STATUSES, PROJECT_TYPES_ENUM } from "@/app/helpers/constants";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import { useEffect } from "react";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

function WorkStagesKanban({ staffId, type }) {
  const { user } = useAuth();
  const admin = user.role === "ADMIN";
  const {
    data: leads,
    loading,
    setData: setleads,
    setFilters,
  } = useDataFetcher(
    `shared/client-leads/projects/designers?type=${type}&`,
    false
  );
  useEffect(() => {
    if (admin) {
      setFilters((old) => ({ ...old, staffId }));
    }
  }, [staffId]);
  const { setLoading } = useToastContext();
  const movelead = async (lead, newStatus) => {
    if (user.role === "SUPER_ADMIN") {
      return;
    }
    const request = await handleRequestSubmit(
      {
        status: newStatus,
        oldStatus: lead.projects[0].status,
        isAdmin: user.role === "ADMIN",
        id: lead.projects[0].id,
      },
      setLoading,
      `shared/client-leads/designers/${lead.id}/status`,
      false,
      "Updating",
      false,
      "PUT"
    );

    if (request.status === 200) {
      setFilters((old) => ({ ...old, render: !old.render }));
    }
  };
  return (
    <>
      <KanbanBoard
        leads={leads}
        loading={loading}
        movelead={movelead}
        setleads={setleads}
        statusArray={PROJECT_STATUSES[type]}
        setFilters={setFilters}
        type={type}
      />
    </>
  );
}
export default WorkStagesKanban;

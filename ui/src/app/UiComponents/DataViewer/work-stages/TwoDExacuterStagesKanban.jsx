"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import KanbanBoard from "../Kanban/KanbanBoard";
import { TwoDExacuterStages, TwoDWorkStages } from "@/app/helpers/constants";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import { useEffect } from "react";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

function TwoDExacuterKanban({ staffId }) {
  const { user } = useAuth();
  const admin = user.role === "ADMIN";
  const {
    data: leads,
    loading,
    setData: setleads,
    setFilters,
  } = useDataFetcher("shared/work-stages?type=exacuter&", false);

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
    const request = await handleRequestSubmit(
      {
        status: newStatus,
        oldStatus: l.twoDExacuterStage,
        isAdmin: user.role === "ADMIN",
        type: "exacuter",
      },
      setLoading,
      `shared/work-stages/${l.id}/status`,
      false,
      "Updating",
      false,
      "PUT"
    );

    if (request.status === 200) {
      setleads((prev) =>
        prev.map((lead) =>
          lead.id === l.id ? { ...lead, twoDExacuterStage: newStatus } : lead
        )
      );
    }
  };
  return (
    <>
      <KanbanBoard
        leads={leads}
        loading={loading}
        movelead={movelead}
        setleads={setleads}
        statusArray={Object.keys(TwoDExacuterStages)}
        setFilters={setFilters}
        type="exacuter"
      />
    </>
  );
}
export default TwoDExacuterKanban;

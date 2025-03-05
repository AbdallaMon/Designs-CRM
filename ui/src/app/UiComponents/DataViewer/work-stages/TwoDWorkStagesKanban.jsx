"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import KanbanBoard from "../Kanban/KanbanBoard";
import { ThreeDWorkStages, TwoDWorkStages } from "@/app/helpers/constants";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import { useEffect } from "react";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

function TwoDWorkStagesKanban({ staffId }) {
  const { user } = useAuth();
  const admin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const {
    data: leads,
    loading,
    setData: setleads,
    setFilters,
  } = useDataFetcher("shared/work-stages?type=two-d&", false);
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
        oldStatus: l.twoDWorkStage,
        isAdmin: user.role === "ADMIN",
        type: "two-d",
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
          lead.id === l.id ? { ...lead, twoDWorkStage: newStatus } : lead
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
        statusArray={Object.keys(TwoDWorkStages)}
        setFilters={setFilters}
        type="two-d"
      />
    </>
  );
}
export default TwoDWorkStagesKanban;

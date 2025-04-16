"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import LeadsSlider from "../../slider/LeadsSlider";
import { LeadSliderCard } from "./NewLeadsPage";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";

export function NonConsultedLeads() {
  const { user } = useAuth();
  const {
    data,
    loading,
    setData,
    page,
    setPage,
    limit,
    setLimit,
    total,
    totalPages,
    setFilters,
  } = useDataFetcher("shared/client-leads" + `?noConsulted=true&`, false);
  if (user.role !== "ADMIN") return;

  return (
    <LeadsSlider
      title="Non consulted leads"
      loading={loading}
      data={data}
      total={total}
      limit={limit}
      page={page}
      setLimit={setLimit}
      setPage={setPage}
      totalPages={totalPages}
    >
      {data?.map((lead) => (
        <LeadSliderCard lead={lead} key={lead.id} setData={setData} />
      ))}
    </LeadsSlider>
  );
}

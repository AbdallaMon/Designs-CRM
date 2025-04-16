"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher.js";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import LeadsSlider from "@/app/UiComponents/DataViewer/slider/LeadsSlider.jsx";
import PaginationWithLimit from "@/app/UiComponents/DataViewer/PaginationWithLimit.jsx";
import React from "react";
import { LeadSliderCard } from "@/app/UiComponents/DataViewer/leads/new-leads/NewLeadsPage.jsx";

export default function OnHoldLeads() {
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
  } = useDataFetcher(
    "shared/client-leads" + `?staffId=${user.id}&assignedOverdue=true&`,
    false
  );

  return (
    <>
      <LeadsSlider
        title="Shuffle leads"
        loading={loading}
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
    </>
  );
}

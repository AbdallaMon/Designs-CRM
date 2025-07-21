"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import LeadsSlider from "../../slider/LeadsSlider";
import { LeadSliderCard } from "./NewLeadsPage";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import { Box } from "@mui/material";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent";
import { useEffect } from "react";

export function NonConsultedLeads() {
  const { user } = useAuth();
  const {
    data,
    loading,
    setData,
    page,
    setPage,filters,
    limit,
    setLimit,
    total,
    totalPages,
    setFilters,
  } = useDataFetcher("shared/client-leads" + `?noConsulted=true&`, false);
  useEffect(()=>{
  if(filters){
    setPage(1)
  }
  },[filters])
  if (user.role !== "ADMIN"&&user.role!=="CONTACT_INITIATOR") return;
  return (
    <>
            <Box mb={2}>
   <SearchComponent
                apiEndpoint="search?model=clientLead"
                setFilters={setFilters}
                inputLabel="Search lead by id ,name or phone"
                renderKeys={[
                  "id",
                  "client.name",
                  "client.phone",
                  "client.email",
                ]}
                mainKey="id"
                searchKey={"id"}
                localFilters={{ status:{
                  in:["NEW"]
                } ,initialConsult:false}}
              />
                      </Box>
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
      </>
  );
}

"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import {useToastContext} from "@/app/providers/ToastLoadingProvider";
import {Box, Button, Card, CardActionArea, CardContent, CardHeader, Container, Typography} from "@mui/material";

import React, {useState} from "react";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";
import {LeadCategory} from "@/app/helpers/constants.js";
import FilterSelect from "@/app/UiComponents/formComponents/FilterSelect.jsx";
import {enumToKeyValueArray} from "@/app/helpers/functions/utility.js";
import ConfirmWithActionModel from "@/app/UiComponents/models/ConfirmsWithActionModel.jsx";
import {handleRequestSubmit} from "@/app/helpers/functions/handleSubmit.js";
import {FaBusinessTime} from "react-icons/fa";
import TabsWithLinks from "@/app/UiComponents/utility/TabsWithLinks.jsx";
import ExcelAnalyzer from "@/app/UiComponents/buttons/UploadExcelFile.jsx";
import PaginationWithLimit from "@/app/UiComponents/DataViewer/PaginationWithLimit.jsx";
import LeadsSlider from "@/app/UiComponents/DataViewer/slider/LeadsSlider.jsx";
import dayjs from "dayjs";
import {styled} from "@mui/material/styles";
import PreviewDialog from "@/app/UiComponents/DataViewer/leads/PreviewLead.jsx";
import Link from "next/link";
import OnHoldLeads from "@/app/UiComponents/DataViewer/leads/OnHoldLeads.jsx";
const columns = [
    {name: "client.name", label: "Client Name"},
    {name: "client.email", label: "Email"},
    {name: "selectedCategory", label: "Lead Type", enum: LeadCategory, type: "enum"},
    {name:"description",label:"Description" },

    {name: "price", label: "Price"},
    {
        name: "createdAt",
        label: "Created At",
        type: "date"
    },

];
export default function NewLeadsPage({searchParams,staff}) {
    const links = [
        {href: "/dashboard/overdue-deals", title: "See Overdue Deals", icon: <FaBusinessTime/>},
    ];
    const {
        data,
        loading,
        setData,
        page,
        setPage,
        limit,
        setLimit,
        total,
        setTotal, totalPages, setFilters
    } = useDataFetcher("shared/client-leads" + `?isNew=true&`, false,{clientId:searchParams.clientId?searchParams.clientId:null});


    return (
          <Container maxWidth="xxl">
              <LeadsSlider title="New leads" loading={loading} data={data} total={total} limit={limit} page={page} setLimit={setLimit}
                           setPage={setPage}
                           totalPages={totalPages}>
                  {data?.map((lead)=><LeadSliderCard lead={lead} key={lead.id} setData={setData} />)}
              </LeadsSlider>

              <OnHoldLeads/>
          </Container>
    );
}
const StyledCardContent = styled(CardContent)(({ theme }) => ({
    height: '100px', // Set a maximum height for the content
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingTop:0
}));

export function LeadSliderCard({ lead,setData }) {
    const formattedDate = dayjs(lead.createdAt).format('YYYY-MM-DD');
    const {setLoading} = useToastContext()
    async function createADeal(lead) {
        const assign = await handleRequestSubmit(lead, setLoading, `shared/client-leads`, false, "Assigning", false, "PUT")
        if (assign.status === 200) {
            setData((data) => data.filter((l) => l.id !== lead.id))
        }
        return assign
    }
    return (
          <Card >
              <CardHeader title={lead.selectedCategory} />
              <StyledCardContent>
                  <Typography variant="body2" color="text.secondary">
                     {lead.client.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                       {lead.client.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                      {formattedDate}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                      {lead.description}
                  </Typography>
              </StyledCardContent>
              <CardActionArea sx={{ display: 'flex', justifyContent: 'flex-end', gap:0.5,mt:1.5}}>
                  <ConfirmWithActionModel
                          title={"Are you sure you want to get this lead and assign it to you as a new deal?"}
                                  handleConfirm={() => createADeal(lead)}
                            label={"Start a deal"}
                          fullWidth={true}
                          size="small"
                      />

                  {/*<Button variant="contained" size="small" color="primary" fullWidth onClick={createADeal}>*/}
                  {/*    Start a Deal*/}
                  {/*</Button>*/}
                  <Button component={Link} href={`/dashboard/deals/${lead.id}`} variant="contained" size="small" color="primary" fullWidth >
                      Preview
                  </Button>
              </CardActionArea>
          </Card>
    );
}
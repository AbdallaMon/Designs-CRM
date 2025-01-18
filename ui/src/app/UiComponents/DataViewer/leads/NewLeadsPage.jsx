"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import {useToastContext} from "@/app/providers/ToastLoadingProvider";
import {Box} from "@mui/material";

import React from "react";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";
import {LeadCategory} from "@/app/helpers/constants.js";
import FilterSelect from "@/app/UiComponents/formComponents/FilterSelect.jsx";
import {enumToKeyValueArray} from "@/app/helpers/functions/utility.js";
import ConfirmWithActionModel from "@/app/UiComponents/models/ConfirmsWithActionModel.jsx";
import {handleRequestSubmit} from "@/app/helpers/functions/handleSubmit.js";
import {FaBusinessTime} from "react-icons/fa";
import TabsWithLinks from "@/app/UiComponents/utility/TabsWithLinks.jsx";
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
    const {setLoading} = useToastContext()
    const leadTypes = enumToKeyValueArray(LeadCategory)
    async function createADeal(item) {
        const assign = await handleRequestSubmit(item, setLoading, `shared/client-leads`, false, "Assigning", false, "PUT")
        if (assign.status === 200) {
            setData((data) => data.filter((lead) => lead.id !== item.id))
        }
    }

    return (
          <div>

              <AdminTable
                    data={data}
                    columns={columns}
                    page={page}
                    setPage={setPage}
                    limit={limit}
                    setLimit={setLimit}
                    total={total}
                    setTotal={setTotal}
                    totalPages={totalPages}
                    setData={setData}
                    loading={loading}
                    extraComponent={({item}) => (
                          <>
                          {staff &&
                          <Box sx={{display: "flex", gap: 2}}>
                              <ConfirmWithActionModel
                                    title={"Are you sure you want to get this lead and assign it to you as a new deal?"}
                                    handleConfirm={() => createADeal(item)}
                                    label={"Start a deal"}
                              />
                          </Box>
                    }
                          </>
                    )}
              >
                  <Box display="flex" width="100%" gap={2} flexWrap="wrap" alignItems="center"
                       justifyContent="space-between"
                       flexDirection={{xs: "column-reverse", md: "row"}}
                  >
                      <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" flex={1}>
                          <Box sx={{width: {xs: "100%", md: "fit-content"}}}>
                              <SearchComponent
                                    apiEndpoint="search?model=client"
                                    setFilters={setFilters}
                                    inputLabel="Search by name or email"
                                    renderKeys={["name", "email"]}
                                    mainKey="name"
                                    searchKey={"clientId"}
                                    withParamsChange={true}

                              />
                          </Box>
                          <Box sx={{width: {xs: "100%", md: "fit-content"}}}>
                              <FilterSelect options={leadTypes} label={"Lead Type"}
                                            loading={false}
                                            param={"type"}
                                            setFilters={setFilters}
                              />
                          </Box>
                      </Box>
                      <Box>
                          <TabsWithLinks links={links}/>
                      </Box>
                  </Box>
              </AdminTable>

          </div>
    );
}

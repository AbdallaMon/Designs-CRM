"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import {Box} from "@mui/material";

import React from "react";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";
import { LeadCategory} from "@/app/helpers/constants.js";
import FilterSelect from "@/app/UiComponents/formComponents/FilterSelect.jsx";
import {enumToKeyValueArray} from "@/app/helpers/functions/utility.js";
const columns = [
    { name: "client.name", label: "Client Name" },
    { name: "client.email", label: "Email" },
    { name: "selectedCategory", label: "Lead Type",enum:LeadCategory,type:"enum" },
    {name:"description",label:"Description" },
    {name:"price",label: "Price"},
    {
        name: "createdAt",
        label: "Created At",
        type:"date"
    },
    {name: "assignedTo.name", label: "Assigned to",type:"href",linkCondition:(item)=>`/dashboard/users/${item.assignedTo.id}`},
];
export default function Leads() {
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
    } = useDataFetcher("shared/client-leads"+`?assignedOverdue=true&`, false);
        const leadTypes=enumToKeyValueArray(LeadCategory)
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
              >
                  <Box                     display="flex" width="100%" gap={2}  flexWrap="wrap" alignItems="center"
                                           justifyContent="space-between"
                                           flexDirection={{xs:"column-reverse",md:"row"}}
                  >
                      <Box display="flex" gap={2}  flexWrap="wrap" alignItems="center"  flex={1}>
                          <Box sx={{width:{xs:"100%",md:"fit-content"}}} >
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
                          <Box sx={{width:{xs:"100%",md:"fit-content"}}} >
                              <FilterSelect options={leadTypes} label={"Lead Type"}
                                            loading={false}
                                            param={"type"}
                                            setFilters={setFilters}
                              />
                          </Box>
                      </Box>

                  </Box>
              </AdminTable>

          </div>
    );
}

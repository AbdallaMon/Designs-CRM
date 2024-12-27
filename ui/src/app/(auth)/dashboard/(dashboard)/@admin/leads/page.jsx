"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import {useToastContext} from "@/app/providers/ToastLoadingProvider";
import {Box} from "@mui/material";

import React from "react";
import {useAuth} from "@/app/providers/AuthProvider.jsx";

const columns = [
    {name: "client.phone", label: "Phone"},

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
    } = useDataFetcher("shared/client-leads", false);

    const {setLoading} = useToastContext()




    return (
          <div>
              <Box display="flex" width="fit-content" gap={2} px={2} flexWrap="wrap" alignItems="center">
                  <div>
                      {/*<SearchComponent*/}
                      {/*      apiEndpoint="search?model=user"*/}
                      {/*      setFilters={setFilters}*/}
                      {/*      inputLabel="  ابحث بالاسم او الايميل لاختيار طالب"*/}
                      {/*      renderKeys={["personalInfo.basicInfo.name", "email"]}*/}
                      {/*      mainKey="email"*/}
                      {/*      localFilters={{role: "STUDENT"}}*/}
                      {/*      withParamsChange={true}*/}
                      {/*/>*/}
                  </div>
                  <div>
                      {/*<FilterSelect options={studentStatusOption} label={"حالة حساب الطالب"}*/}
                      {/*              loading={false}*/}
                      {/*              param={"status"}*/}
                      {/*              setFilters={setFilters}*/}
                      {/*/>*/}
                  </div>
                  <div>
                      {/*<FilterSelect options={grantStatus} label={"حالة المنح"}*/}
                      {/*              loading={false}*/}
                      {/*              param={"hasGrant"}*/}
                      {/*              setFilters={setFilters}*/}
                      {/*/>*/}
                  </div>
              </Box>
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
                          <Box sx={{display: "flex", gap: 2}}>
                          </Box>
                    )}
              />

          </div>
    );
}

"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import AdminTable from "@/shared/components/AdminTable";
import { Box } from "@mui/material";

import React, { useEffect, useState } from "react";
import SearchComponent from "@/shared/components/formComponents/SearchComponent.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import LastSeen from "@/shared/components/buttons/LastSeen";
import SalaryInfoButton from "@/features/accountant/SalaryDialog.jsx";
import CreateModal from "@/shared/components/models/CreateModal.jsx";
import EditModal from "@/shared/components/models/EditModal.jsx";
import { inputs, columns } from "@/features/accountant/config/salariesConfig.js";

export default function Salaries() {
  const {
    data,
    loading,
    setData,
    page,
    setPage,
    limit,
    setLimit,
    total,
    setTotal,
    totalPages,
    setFilters,
  } = useDataFetcher("accounting/users", false);

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
        inputs={inputs}
        loading={loading}
        extraComponent={({ item }) => (
          <>
            <Box sx={{ display: "flex", gap: 2 }}>
              <LastSeen
                initialLastSeen={item}
                userId={item.id}
                accountant={true}
              />
              {item.baseSalary ? (
                <>
                  <SalaryInfoButton userId={item.id} />
                </>
              ) : (
                <Box>
                  <CreateModal
                    label={"Create salary"}
                    inputs={inputs}
                    href={`accounting/salaries/${item.id}`}
                    handleSubmit={(data) => {
                      window.location.reload();
                    }}
                    setData={setData}
                    extraProps={{
                      formTitle: "New salary",
                      btnText: "Create",
                      variant: "outlined",
                    }}
                  />
                </Box>
              )}
            </Box>
          </>
        )}
      >
        <Box
          display="flex"
          width="100%"
          gap={2}
          flexWrap="wrap"
          alignItems="center"
          justifyContent="space-between"
          flexDirection={{ xs: "column-reverse", md: "row" }}
        >
          <Box
            display="flex"
            gap={2}
            flexWrap="wrap"
            alignItems="center"
            flex={1}
          >
            <Box sx={{ width: { xs: "100%", md: "fit-content" } }}>
              <SearchComponent
                resource="users"
                setFilters={setFilters}
                inputLabel="Search by name or email"
                renderKeys={["name", "email"]}
                mainKey="name"
                searchKey={"userId"}
                withParamsChange={true}
              />
            </Box>
          </Box>
        </Box>
      </AdminTable>
    </div>
  );
}

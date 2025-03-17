"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import { Box } from "@mui/material";

import React, { useEffect, useState } from "react";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import LastSeen from "@/app/UiComponents/buttons/LastSeen";
import { userRolesEnum } from "@/app/helpers/constants";
import SalaryInfoButton from "./SalaryDialog";
import CreateModal from "../../models/CreateModal";
import EditModal from "../../models/EditModal";

const inputs = [
  {
    data: {
      id: "baseSalary",
      type: "number",
      label: "Base salary",
      key: "baseSalary.baseSalary",
    },
    pattern: {
      required: {
        value: true,
        message: "Please enter a Base salary",
      },
    },
  },
  {
    data: {
      id: "baseWorkHours",
      type: "number",
      label: "Base work hours",
      key: "baseSalary.baseWorkHours",
    },
    pattern: {
      required: {
        value: true,
        message: "Please enter a Base work hours",
      },
    },
  },
  {
    data: {
      id: "taxAmount",
      type: "number",
      label: "Tax amount",
      key: "baseSalary.taxAmount",
    },
    pattern: {
      required: {
        value: true,
        message: "Please enter a tax amount",
      },
    },
  },
];
const columns = [
  { name: "name", label: "User Name" },
  { name: "email", label: "Email" },
  { name: "role", label: "Main role", type: "enum", enum: userRolesEnum },
  {
    name: "isActive",
    label: "Account status",
    type: "boolean",
    enum: { TRUE: "Active", FALSE: "Banned" },
  },
];

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
  } = useDataFetcher("accountant/users", false);

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
                    href={`accountant/salaries/${item.id}`}
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
                apiEndpoint="search?model=user"
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

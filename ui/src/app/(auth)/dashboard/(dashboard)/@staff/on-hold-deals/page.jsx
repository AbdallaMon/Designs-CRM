"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { Box } from "@mui/material";

import React from "react";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";
import { LeadCategory } from "@/app/helpers/constants.js";
import FilterSelect from "@/app/UiComponents/formComponents/FilterSelect.jsx";
import { enumToKeyValueArray } from "@/app/helpers/functions/utility.js";
import ConfirmWithActionModel from "@/app/UiComponents/models/ConfirmsWithActionModel.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";

const columns = [
  { name: "client.name", label: "Client Name" },
  { name: "client.phone", label: "Phone" },
  {
    name: "selectedCategory",
    label: "Lead Type",
    enum: LeadCategory,
    type: "enum",
  },
  { name: "description", label: "Description" },
  { name: "price", label: "Price" },
  {
    name: "createdAt",
    label: "Created At",
    type: "date",
  },
];
export default function Leads() {
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
    setTotal,
    totalPages,
    setFilters,
  } = useDataFetcher(
    "shared/client-leads" + `?staffId=${user.id}&assignedOverdue=true&`,
    false
  );

  const { setLoading } = useToastContext();
  const leadTypes = enumToKeyValueArray(LeadCategory);
  async function createADeal(item) {
    item = { ...item, overdue: true };
    const assign = await handleRequestSubmit(
      item,
      setLoading,
      `shared/client-leads`,
      false,
      "Assigning",
      false,
      "PUT"
    );
    if (assign.status === 200) {
      setData((data) => data.filter((lead) => lead.id !== item.id));
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
        extraComponent={({ item }) => (
          <Box sx={{ display: "flex", gap: 2 }}>
            <ConfirmWithActionModel
              title={
                "Are you sure you want to get this lead and assign it to you as a new deal?"
              }
              handleConfirm={() => createADeal(item)}
              label={"Start a deal"}
            />
          </Box>
        )}
      ></AdminTable>
    </div>
  );
}

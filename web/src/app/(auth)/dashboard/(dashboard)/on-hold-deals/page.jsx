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

// Admin variant (matches the former @admin/on-hold-deals slot)
const adminColumns = [
  {
    name: "id",
    label: "Lead ID",
    type: "href",
    linkCondition: (item) => {
      if (!item.id) {
        return false;
      }
      return `/dashboard/deals/${item.id}`;
    },
  },
  { name: "client.name", label: "Client Name" },
  { name: "client.email", label: "Email" },
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
  {
    name: "assignedTo.name",
    label: "Assigned to",
    type: "href",
    linkCondition: (item) => {
      if (!item.assignedTo || !item.assignedTo.id) {
        return false; // Skip if assignedTo is not present or id is missing
      }
      console.log(item, "item in assigned to link condition");
      return `/dashboard/users/${item.assignedTo.id}`;
    },
  },
];

function AdminOnHoldDeals() {
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
  } = useDataFetcher("shared/client-leads" + `?assignedOverdue=true&`, false);
  const leadTypes = enumToKeyValueArray(LeadCategory);
  console.log(data, "data in leads page");
  return (
    <div>
      <AdminTable
        data={data}
        columns={adminColumns}
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
                apiEndpoint="search?model=client"
                setFilters={setFilters}
                inputLabel="Search by name or email"
                renderKeys={["name", "email"]}
                mainKey="name"
                searchKey={"clientId"}
                withParamsChange={true}
              />
            </Box>
            <Box sx={{ width: { xs: "100%", md: "fit-content" } }}>
              <FilterSelect
                options={leadTypes}
                label={"Lead Type"}
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

// Super-admin / super-sales variant (matches the former
// @super_admin/@super_sales on-hold-deals slots)
const superColumns = [
  { name: "client.name", label: "Client Name" },
  { name: "client.email", label: "Email" },
  { name: "selectedCategory", label: "Lead Type", enum: LeadCategory, type: "enum" },
  { name: "description", label: "Description" },
  { name: "price", label: "Price" },
  {
    name: "createdAt",
    label: "Created At",
    type: "date",
  },
  {
    name: "assignedTo.name",
    label: "Assigned to",
    type: "href",
    linkCondition: (item) => `/dashboard/users/${item.assignedTo.id}`,
  },
];

function SuperOnHoldDeals() {
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
  } = useDataFetcher("shared/client-leads" + `?assignedOverdue=true&`, false);
  const leadTypes = enumToKeyValueArray(LeadCategory);
  return (
    <div>
      <AdminTable
        data={data}
        columns={superColumns}
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
        <Box
          display="flex"
          width="100%"
          gap={2}
          flexWrap="wrap"
          alignItems="center"
          justifyContent="space-between"
          flexDirection={{ xs: "column-reverse", md: "row" }}
        >
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" flex={1}>
            <Box sx={{ width: { xs: "100%", md: "fit-content" } }}>
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
            <Box sx={{ width: { xs: "100%", md: "fit-content" } }}>
              <FilterSelect
                options={leadTypes}
                label={"Lead Type"}
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

// Staff variant (matches the former @staff/on-hold-deals slot)
const staffColumns = [
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

function StaffOnHoldDeals() {
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
        columns={staffColumns}
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

export default function Leads() {
  const { user } = useAuth();
  if (!user?.role) return null;
  const role = user.role;

  if (role === "STAFF" && !user.isSuperSales) {
    return <StaffOnHoldDeals />;
  }
  if (role === "ADMIN") {
    return <AdminOnHoldDeals />;
  }
  return <SuperOnHoldDeals />;
}

"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import { Box, Button } from "@mui/material";

import React, { useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";
import { LeadCategory } from "@/app/helpers/constants.js";
import { FaBusinessTime } from "react-icons/fa";
import TabsWithLinks from "@/app/UiComponents/layout/TabsWithLinks.jsx";
import PreviewDialog from "@/app/UiComponents/DataViewer/leads/PreviewLeadDialog.jsx";
import DateRangeFilter from "@/app/UiComponents/formComponents/DateRangeFilter.jsx";

const columns = [
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
const assignedTo = {
  name: "assignedTo.name",
  label: "Assigned to",
  type: "href",
  linkCondition: (item) => `/dashboard/users/${item.assignedTo?.id}`,
};
export default function AllDealsPage({ staff }) {
  const links = [
    {
      href: "/dashboard/overdue-deals",
      title: "See Overdue Deals",
      icon: <FaBusinessTime />,
    },
  ];
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
    "shared/client-leads" + (staff ? `?staffId=${user.id}&` : ""),
    false
  );

  const [dialogId, setDialogId] = useState(null);
  return (
    <div>
      {Boolean(dialogId) && (
        <PreviewDialog
          open={Boolean(dialogId)}
          onClose={() => setDialogId(null)}
          setleads={setData}
          id={dialogId}
          admin={!staff}
        />
      )}
      <AdminTable
        data={data}
        columns={
          staff
            ? columns
            : data && data.length > 0
            ? [...columns, assignedTo]
            : columns
        }
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
            <Button variant={"outlined"} onClick={() => setDialogId(item.id)}>
              Preview details
            </Button>
          </Box>
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
              {!staff && (
                <SearchComponent
                  apiEndpoint="search?model=user"
                  setFilters={setFilters}
                  inputLabel="Search staff by name or email"
                  renderKeys={["name", "email"]}
                  mainKey="name"
                  searchKey={"staffId"}
                  withParamsChange={true}
                />
              )}
            </Box>
            <Box sx={{ width: { xs: "100%", md: "fit-content" } }}>
              {/* <SearchComponent
                apiEndpoint="search?model=client"
                setFilters={setFilters}
                inputLabel="Search by client name or phone"
                renderKeys={["name", "phone"]}
                mainKey="name"
                searchKey={"clientId"}
                withParamsChange={true}
              /> */}
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
                localFilters={{ staffId: user.id, userRole: user.role }}
                withParamsChange={true}
              />
            </Box>{" "}
            <Box sx={{ width: { xs: "100%", md: "fit-content" } }}>
              <DateRangeFilter
                noMargin={true}
                setFilters={setFilters}
                lastThreeMonth={true}
              />
            </Box>
          </Box>
          <Box>
            <TabsWithLinks links={links} />
          </Box>
        </Box>
      </AdminTable>
    </div>
  );
}

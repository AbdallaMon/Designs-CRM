"use client";
import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Box, Grid2 as Grid } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent";
import DateRangeFilter from "@/app/UiComponents/formComponents/DateRangeFilter";
import FilterSelect from "@/app/UiComponents/formComponents/FilterSelect";
import TabsWithLinks from "@/app/UiComponents/utility/TabsWithLinks";
import KanbanColumn from "./KanbanColumn";
import { useAuth } from "@/app/providers/AuthProvider";
import { CONTRACT_LEVELS } from "@/app/helpers/constants";

dayjs.extend(relativeTime);

const OptimizedKanbanLead = ({
  links,
  statusArray,
  setFilters,
  type,
  reRenderColumns,
  setReRenderColumns,
  staffId,
  filters,
  isNotStaff,
}) => {
  const { user } = useAuth();
  const admin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <Box px={1.5}>
          <Box
            sx={{
              display: "flex",
              width: "100%",
              p: { xs: 1.5, md: 3 },
              mb: 2,
              backgroundColor: "background.paper",
              borderRadius: 1,
              boxShadow: 1,
              gap: 1,
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: {
                xs: "column",
                md: "row",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                alignItems: "center",
                width: {
                  xs: "100%",
                  md: "auto",
                },
              }}
            >
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
              {admin && (
                <SearchComponent
                  apiEndpoint={`search?model=${type ? type : "STAFF"}`}
                  setFilters={setFilters}
                  inputLabel="Search staff by name or email"
                  renderKeys={["name", "email"]}
                  mainKey="name"
                  searchKey={"staffId"}
                  withParamsChange={true}
                />
              )}{" "}
              {!isNotStaff && (
                <>
                  <DateRangeFilter
                    noMargin={true}
                    setFilters={setFilters}
                    lastThreeMonth={true}
                  />
                  <FilterSelect
                    options={CONTRACT_LEVELS.map((level) => ({
                      id: level,
                      name: level.charAt(0).toUpperCase() + level.slice(1),
                    }))}
                    label={"Contract Level"}
                    loading={false}
                    param={"contractLevel"}
                    setFilters={setFilters}
                  />
                </>
              )}
            </Box>
            {links && (
              <Box
                display="flex"
                justifyContent="flex-end"
                sx={{
                  width: {
                    xs: "100%",
                    md: "auto",
                  },
                }}
              >
                <TabsWithLinks
                  links={links}
                  sx={{
                    "& .MuiTabs-flexContainer": {
                      justifyContent: {
                        xs: "center",
                        md: "flex-end",
                      },
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
        <Grid
          container
          spacing={2}
          sx={{
            p: 3,
            bgcolor: "grey.100",
            flexWrap: "noWrap",
            overflowX: "auto",
            "::-webkit-scrollbar": {
              height: "6px",
            },
            "::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "4px",
            },
            "::-webkit-scrollbar-thumb": {
              background: "#bbb",
              borderRadius: "4px",
            },
            "::-webkit-scrollbar-thumb:hover": {
              background: "#999",
            },
          }}
        >
          {statusArray.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              statusArray={statusArray}
              reRenderColumns={reRenderColumns}
              setRerenderColumns={setReRenderColumns}
              staffId={staffId}
              filters={filters}
              setFilters={setFilters}
              admin={admin}
              type={type}
              isNotStaff={isNotStaff}
            />
          ))}
        </Grid>
      </DndProvider>
    </>
  );
};

export default OptimizedKanbanLead;

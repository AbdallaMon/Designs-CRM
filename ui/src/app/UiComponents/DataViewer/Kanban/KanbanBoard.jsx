"use client";
import React, { useEffect, useState } from "react";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Box, Grid2 as Grid, Select, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import TabsWithLinks from "@/app/UiComponents/utility/TabsWithLinks.jsx";
import DateRangeFilter from "@/app/UiComponents/formComponents/DateRangeFilter.jsx";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";
import KanbanColumn from "../Kanban/KanbanColumn";
import { useAuth } from "@/app/providers/AuthProvider";
import { CONTRACT_LEVELS, getPriorityOrder } from "@/app/helpers/constants";
import FilterSelect from "../../formComponents/FilterSelect";

dayjs.extend(relativeTime);

const KanbanBoard = ({
  links,
  statusArray,
  leads,
  setleads,
  movelead,
  loading,
  setFilters,
  type,
}) => {
  const { user } = useAuth();
  const admin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  return (
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
              renderKeys={["id", "client.name", "client.phone", "client.email"]}
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
            )}
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
            leads={
              loading
                ? []
                : type === "STAFF"
                ? leads.filter((lead) => {
                    return lead.status === status;
                  })
                : leads
                    .filter((lead) => {
                      if (
                        lead.projects[0].type === "3D_Modification" &&
                        !lead.projects[0].isModification
                      ) {
                        return false;
                      }
                      return lead.projects[0]?.status === status;
                    })
                    .sort((a, b) => {
                      const priorityA = getPriorityOrder(
                        a.projects[0]?.priority
                      );
                      const priorityB = getPriorityOrder(
                        b.projects[0]?.priority
                      );
                      return priorityB - priorityA; // HIGH priority first
                    })
            }
            movelead={movelead}
            admin={admin}
            setleads={setleads}
            type={type}
          />
        ))}
      </Grid>
    </DndProvider>
  );
};

export default KanbanBoard;

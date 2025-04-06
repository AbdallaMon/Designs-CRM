"use client";
import React, { useEffect, useState } from "react";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Box, Grid2 as Grid, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import TabsWithLinks from "@/app/UiComponents/utility/TabsWithLinks.jsx";
import DateRangeFilter from "@/app/UiComponents/formComponents/DateRangeFilter.jsx";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";
import KanbanColumn from "../Kanban/KanbanColumn";
import { useAuth } from "@/app/providers/AuthProvider";

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
              withParamsChange={true}
            />
            {/* <SearchComponent
              apiEndpoint="search?model=client"
              setFilters={setFilters}
              inputLabel="Search client by name or phone"
              renderKeys={["name", "phone", ""]}
              mainKey="name"
              searchKey={"clientId"}
              withParamsChange={true}
            /> */}
            {admin && (
              <SearchComponent
                apiEndpoint={`search?model=${
                  type === "three-d"
                    ? "THREE_D_DESIGNER"
                    : type === "two-d"
                    ? "TWO_D_DESIGNER"
                    : type === "exacuter"
                    ? "TWO_D_EXECUTOR"
                    : "STAFF"
                }`}
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
                : leads.filter((lead) => {
                    if (type === "three-d") {
                      return lead.threeDWorkStage === status;
                    }
                    if (type === "two-d") {
                      return lead.twoDWorkStage === status;
                    } else if (type === "exacuter") {
                      return lead.twoDExacuterStage === status;
                    }
                    return lead.status === status;
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

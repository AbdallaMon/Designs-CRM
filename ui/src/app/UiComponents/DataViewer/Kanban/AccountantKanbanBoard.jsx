"use client";
import React, { useEffect, useState } from "react";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Box, Grid2 as Grid, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import TabsWithLinks from "@/app/UiComponents/utility/TabsWithLinks.jsx";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";
import AccountantKanbanColumn from "./AccountantKanbanColumn";
import { useSearchParams } from "next/navigation";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";

dayjs.extend(relativeTime);

const AccountantKanbanBoard = ({
  links,
  statusArray,
  moveCard,
  status = "NOT_PAID",
  type,
}) => {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const {
    data: payments,
    loading,
    setData: setPayments,
    setFilters,
  } = useDataFetcher(`accountant/payments?paymentId=${paymentId}&`, false, {
    status: status,
  });
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
              apiEndpoint="search?model=client"
              setFilters={setFilters}
              inputLabel="Search client by name or phone"
              renderKeys={["name", "phone"]}
              mainKey="name"
              searchKey={"clientId"}
              withParamsChange={true}
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
          <AccountantKanbanColumn
            key={status}
            status={status}
            statusArray={statusArray}
            payments={
              loading
                ? []
                : payments.filter((payment) => {
                    if (type === "three-d") {
                      return payment.clientLead.threeDWorkStage === status;
                    }
                    return payment.paymentLevel === status;
                  })
            }
            moveCard={moveCard}
            setPayments={setPayments}
            type={type}
          />
        ))}
      </Grid>
    </DndProvider>
  );
};
export default AccountantKanbanBoard;

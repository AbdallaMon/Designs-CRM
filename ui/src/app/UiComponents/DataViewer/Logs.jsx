"use client"
import React, { useState } from "react";
import {
    Card,
    CardContent,
    Typography,
    Box,
    List,
    ListItem,
    Avatar,
    Grid2 as Grid,
    Container, Divider, CardHeader,
} from "@mui/material";
import parse from "html-react-parser";
import { AiOutlineFileText, AiOutlineUserAdd } from "react-icons/ai";
import { BiTransfer, BiNote } from "react-icons/bi";
import { FaFileUpload } from "react-icons/fa";
import {MdAttachMoney, MdCall} from "react-icons/md";
import dayjs from "dayjs";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher.js";
import PaginationWithLimit from "@/app/UiComponents/DataViewer/PaginationWithLimit.jsx";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader.jsx";
import DateRangeFilter from "@/app/UiComponents/formComponents/DateRangeFilter.jsx";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";

export const LogColors = {
    LEAD_CREATED: "#4caf50",
    LEAD_ASSIGNED: "#2196f3",
    LEAD_STATUS_CHANGED: "#ff9800",
    NOTE_ADDED: "#9c27b0",
    FILE_UPLOADED: "#3f51b5",
    LEAD_TRANSFERRED: "#f44336",
    LEAD_CONTACT: "#009688",
    CALL_REMINDER_CREATED: "#00bcd4",
    CALL_REMINDER_STATUS: "#ff5722",
    PRICE_OFFER_SUBMITTED: "#8bc34a",
    PRICE_OFFER_UPDATED: "#cddc39",
    FINAL_PRICE_ADDED: "#ffc107",
    FINAL_PRICE_CHANGED: "#e91e63",
    OTHER: "#607d8b",
};

const LogsPage = () => {

    const {
        data:logs,
        loading,
        setData,
        page,
        setPage,
        limit,
        setLimit,
        total,
        setTotal, totalPages, setFilters
    } = useDataFetcher("admin/logs" , false);


    const logIcons = {
        LEAD_CREATED: <AiOutlineUserAdd size={24} />,
        LEAD_ASSIGNED: <AiOutlineUserAdd size={24} />,
        LEAD_STATUS_CHANGED: <AiOutlineFileText size={24} />,
        NOTE_ADDED: <BiNote size={24} />,
        FILE_UPLOADED: <FaFileUpload size={24} />,
        LEAD_TRANSFERRED: <BiTransfer size={24} />,
        LEAD_CONTACT: <MdAttachMoney size={24} />,
        CALL_REMINDER_CREATED: <MdCall size={24} />,
        CALL_REMINDER_STATUS: <MdCall size={24} />,
        PRICE_OFFER_SUBMITTED: <MdAttachMoney size={24} />,
        PRICE_OFFER_UPDATED: <MdAttachMoney size={24} />,
        FINAL_PRICE_ADDED: <MdAttachMoney size={24} />,
        FINAL_PRICE_CHANGED: <MdAttachMoney size={24} />,
        OTHER: <AiOutlineFileText size={24} />,
    };

    return (

          <Container maxWidth="xl" sx={{ marginY: 4 ,position:"relative"}}>
              {loading&&<FullScreenLoader/>}
              <Card sx={{ boxShadow: 3, padding: 2 }}>
<CardHeader    title="Logs Page" subheader=" View the latest activity logs across the system.">
</CardHeader>

                  <CardContent>
                      <Box sx={{display:"flex",gap:2}}>
                          <Box sx={{width: {xs: "100%", md: "fit-content"}}}>
                              <SearchComponent
                                    apiEndpoint="search?model=user"
                                    setFilters={setFilters}
                                    inputLabel="Search staff by name or email"
                                    renderKeys={["name", "email"]}
                                    mainKey="name"
                                    searchKey={"userId"}
                                    withParamsChange={true}
                              />
                          </Box>
                      <DateRangeFilter setFilters={setFilters}/>

                      </Box>
                      <List>
                          {logs.map((log) => (
                                <>
                                <ListItem key={log.id}  sx={{
                                    borderLeft:`2px solid ${LogColors[log.type]}`,
                                    my:1.5
                                }}>
                                    <Grid container spacing={2} alignItems="center" justifyContent="center">
                                        <Grid >
                                            <Avatar
                                                  sx={{
                                                      bgcolor: LogColors[log.type] || "#607d8b",
                                                      width: 40,
                                                      height: 40,
                                                  }}
                                            >
                                                {logIcons[log.type]}
                                            </Avatar>
                                        </Grid>

                                        <Grid >
                                            <Typography
                                                  variant="body1"
                                            >
                                                {parse(log.text)}
                                            </Typography>
                                            <Typography
                                                  variant="body2"
                                                  color="textSecondary"
                                            >
                                                {`By ${log.user.name} at ${dayjs(log.createdAt).format(
                                                      "YYYY-MM-DD HH:mm:ss"
                                                )}`}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </ListItem>
                                    <Divider/>
                                </>
                          ))}
                      </List>
                  </CardContent>
                  <PaginationWithLimit total={total} limit={limit} page={page} setLimit={setLimit}
                                       setPage={setPage}
                                       totalPages={totalPages}/>
              </Card>

          </Container>
    );
};

export default LogsPage;

"use client"
import React from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
    Typography,
    Box,
    Chip,
    Paper,
    Stack,
    Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { BsKanban } from 'react-icons/bs';
import { BiDollarCircle } from 'react-icons/bi';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { KanbanStatusArray, statusColors } from "@/app/helpers/constants.js";
import LeadCard from "@/app/UiComponents/DataViewer/KanbanLeadCard.jsx";

dayjs.extend(relativeTime);

const ItemTypes = {
    CARD: "card",
};

const ColumnHeader = styled(Box)(({ theme, statusColor }) => ({
    background: theme.palette.background.paper,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
    boxShadow: 'none',
    border: `1px solid ${theme.palette.divider}`,
    position: 'relative',
    '&:before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        backgroundColor: statusColor,
        borderRadius: '4px 4px 0 0'
    }
}));

const StatusChip = styled(Chip)(({ theme, statuscolor }) => ({
    backgroundColor: `${statuscolor}20`,
    color: statuscolor,
    fontWeight: 600,
    height: '24px',
    '& .MuiChip-label': {
        padding: '0 8px',
    }
}));

const Column = ({ status, leads, movelead, admin,setleads }) => {
    const [, drop] = useDrop({
        accept: ItemTypes.CARD,
        drop: (item) => movelead(item.id, status),
    });

    const totalValue = leads.reduce((acc, lead) => acc + parseFloat(lead.price.replace(/,/g, '') || 0), 0);
    const statusColor = statusColors[status];

    return (
          <Paper
                ref={drop}
                elevation={0}
                sx={{
                    bgcolor: 'grey.50',
                    p: 2,
                    minWidth: 320,
                    height: '100vh',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: 'divider',
                }}
          >
              <ColumnHeader statusColor={statusColor}>
                  <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                          <BsKanban size={20} color={statusColor} />
                          <Typography variant="h6" color="text.primary" sx={{
                              fontSize: '1.1rem',
                              fontWeight: 600
                          }}>
                              {status.replace(/_/g, " ")}
                          </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                          <StatusChip
                                label={`${leads.length} ${leads.length === 1 ? 'lead' : 'leads'}`}
                                statuscolor={statusColor}
                                size="small"
                          />
                          <Box display="flex" alignItems="center" gap={1}>
                              <BiDollarCircle size={16} style={{ color: statusColor }} />
                              <Typography
                                    variant="body2"
                                    sx={{
                                        color: statusColor,
                                        bgcolor: `${statusColor}10`,
                                        py: 0.5,
                                        px: 1,
                                        borderRadius: 1,
                                        fontWeight: 500
                                    }}
                              >
                                  {totalValue.toLocaleString()}
                              </Typography>
                          </Box>
                      </Box>
                  </Stack>
              </ColumnHeader>

              <Box sx={{
                  overflowY: 'auto',
                  flexGrow: 1,
                  '::-webkit-scrollbar': {
                      width: '6px',
                  },
                  '::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                      borderRadius: '4px',
                  },
                  '::-webkit-scrollbar-thumb': {
                      background: '#bbb',
                      borderRadius: '4px',
                  },
                  '::-webkit-scrollbar-thumb:hover': {
                      background: '#999',
                  },
              }}>
                  <Stack spacing={1}>
                      {leads.map((lead) => (
                            <LeadCard key={lead.id} lead={lead} movelead={movelead} admin={admin} setleads={setleads} />
                      ))}
                  </Stack>
              </Box>
          </Paper>
    );
};

const KanbanBoard = ({ admin }) => {
    // ... Rest of the KanbanBoard component remains the same ...
    const [leads, setleads] = React.useState([
        {
            id: 1,
            client: { name: "Acme Corp" },
            user: { name: "John Smith" },
            status: "IN_PROGRESS",
            price: "15,000.00",
            callReminders: [
                {
                    time: "2024-12-25T10:00:00",
                    status: "COMPLETED",
                    reminderReason: "Initial consultation",
                    callResult: "Positive, interested in enterprise plan",
                },
                {
                    time: "2024-12-28T14:00:00",
                    status: "IN_PROGRESS",
                    reminderReason: "Discuss proposal details",
                }
            ],
        },
        {
            id: 2,
            client: { name: "TechStart Solutions" },
            user: { name: "Sarah Johnson" },
            status: "NEEDS_IDENTIFIED",
            price: "8,500.00",
            callReminders: [
                {
                    time: "2024-12-20T11:00:00",
                    status: "COMPLETED",
                    reminderReason: "Requirements gathering",
                    callResult: "Need additional features",
                },
                {
                    time: "2024-12-22T15:30:00",
                    status: "COMPLETED",
                    reminderReason: "Feature discussion",
                    callResult: "Approved feature list",
                }
            ],
        },
        {
            id: 3,
            client: { name: "Global Innovations" },
            user: { name: "Mike Wilson" },
            status: "INTERESTED",
            price: "22,000.00",
            callReminders: [
                {
                    time: "2024-12-26T09:00:00",
                    status: "IN_PROGRESS",
                    reminderReason: "Present solution demo",
                }
            ],
        },
        {
            id: 4,
            client: { name: "DataFlow Inc" },
            user: { name: "Emily Chen" },
            status: "NEGOTIATING",
            price: "45,000.00",
            callReminders: [
                {
                    time: "2024-12-15T13:00:00",
                    status: "COMPLETED",
                    reminderReason: "Budget discussion",
                    callResult: "Requesting 10% discount",
                },
                {
                    time: "2024-12-18T16:00:00",
                    status: "COMPLETED",
                    reminderReason: "Final negotiation",
                    callResult: "Agreement on terms",
                }
            ],
        },
        {
            id: 5,
            client: { name: "SmartServe Solutions" },
            user: { name: "Alex Turner" },
            status: "CONTACT_INITIATED",
            price: "12,750.00",
            callReminders: []
        },
        {
            id: 6,
            client: { name: "Future Tech Ltd" },
            user: { name: "David Lee" },
            status: "IN_PROGRESS",
            price: "33,200.00",
            callReminders: [
                {
                    time: "2024-12-24T14:00:00",
                    status: "COMPLETED",
                    reminderReason: "Initial meeting",
                    callResult: "Very interested, needs technical review",
                },
                {
                    time: "2024-12-29T11:00:00",
                    status: "IN_PROGRESS",
                    reminderReason: "Technical walkthrough",
                }
            ],
        }
    ]);

    const movelead = (id, newStatus) => {
        setleads((prev) =>
              prev.map((task) =>
                    task.id === id ? { ...task, status: newStatus } : task
              )
        );
    };
    return (
          <DndProvider backend={HTML5Backend}>
              <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        p: 3,
                        bgcolor: 'grey.100',
                        overflowX: "auto",
                        '::-webkit-scrollbar': {
                            height: '6px',
                        },
                        '::-webkit-scrollbar-track': {
                            background: '#f1f1f1',
                            borderRadius: '4px',
                        },
                        '::-webkit-scrollbar-thumb': {
                            background: '#bbb',
                            borderRadius: '4px',
                        },
                        '::-webkit-scrollbar-thumb:hover': {
                            background: '#999',
                        },
                    }}
              >
                  {KanbanStatusArray.map((status) => (
                        <Column
                              key={status}
                              status={status}
                              leads={leads.filter((lead) => lead.status === status)}
                              movelead={movelead}
                              admin={admin}
                              setleads={setleads}
                        />
                  ))}
              </Box>
          </DndProvider>
    );
};

export default KanbanBoard;
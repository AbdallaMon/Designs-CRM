"use client"
import React, {useEffect, useState} from "react";
import {DndProvider, useDrop} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import {Box, Button, Chip, Grid2 as Grid, Modal, Stack, TextField, Typography,} from "@mui/material";
import {styled} from "@mui/material/styles";
import {BsKanban} from 'react-icons/bs';
import {BiDollarCircle} from 'react-icons/bi';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {KanbanStatusArray, simpleModalStyle, statusColors} from "@/app/helpers/constants.js";
import LeadCard from "@/app/UiComponents/DataViewer/leads/KanbanLeadCard.jsx";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher.js";
import FilterSelect from "@/app/UiComponents/formComponents/FilterSelect.jsx";
import TabsWithLinks from "@/app/UiComponents/utility/TabsWithLinks.jsx";
import {FaBusinessTime} from "react-icons/fa";
import {useAuth} from "@/app/providers/AuthProvider.jsx";
import {handleRequestSubmit} from "@/app/helpers/functions/handleSubmit.js";
import {useToastContext} from "@/app/providers/ToastLoadingProvider.js";
import {FinalizeModal} from "@/app/UiComponents/DataViewer/leads/FinalizeModal.jsx";
import DateRangeFilter from "@/app/UiComponents/formComponents/DateRangeFilter.jsx";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";

dayjs.extend(relativeTime);

const ItemTypes = {
    CARD: "card",
};

const ColumnHeader = styled(Box)(({theme, statusColor}) => ({
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

const StatusChip = styled(Chip)(({theme, statuscolor}) => ({
    backgroundColor: `${statuscolor}20`,
    color: statuscolor,
    fontWeight: 600,
    height: '24px',
    '& .MuiChip-label': {
        padding: '0 8px',
    }
}));

const Column = ({status, leads, movelead, admin, setleads}) => {
    const [, drop] = useDrop({
        accept: ItemTypes.CARD,
        drop: (item) => {
            movelead(item, status);
        },
    });

    const totalValue = leads.reduce((acc, lead) => acc + parseFloat(lead.price.replace(/,/g, '') || 0), 0);
    const statusColor = statusColors[status];

    return (
          <Grid
                size={2}
                ref={drop}
                elevation={0}
                sx={{
                    bgcolor: 'grey.50',
                    p: 0,
                    minWidth: 250,
                    height: '100vh',
                    borderRadius: 0,
                    display: 'flex',
                    flexDirection: 'column',
                }}
          >
              <ColumnHeader statusColor={statusColor}>
                  <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                          <BsKanban size={20} color={statusColor}/>
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
                              <BiDollarCircle size={16} style={{color: statusColor}}/>
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
                                  {totalValue}
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
                            <LeadCard key={lead.id} lead={lead} movelead={movelead} admin={admin} setleads={setleads}/>
                      ))}
                  </Stack>
              </Box>
          </Grid>
    );
};

const KanbanBoard = ({admin,staffId}) => {
    const {user} = useAuth()
    const {
        data: leads,
        loading,
        setData: setleads,
        setFilters
    } = useDataFetcher("shared/client-leads/deals" +`?staffId=${admin?staffId:user.id}&`, false);
    useEffect(()=>{
        if(admin){
            setFilters((old)=>({...old,staffId}))
        }
    },[staffId])
    const [finalizeModel,setFinalizeModel]=useState(false)
    const [currentId,setCurrentId]=useState(null)
const {setLoading}=useToastContext()

    const movelead =async (l, newStatus) => {
        if(newStatus==="FINALIZED"){
            setCurrentId(l.id)
            setFinalizeModel(true)
            return
        }
        const request = await handleRequestSubmit({status: newStatus,oldStatus:l.status,isAdmin:user.role==="ADMIN"}, setLoading, `shared/client-leads/${l.id}/status`, false, "Updating",false, "PUT")
            if(request.status===200) {
                setleads((prev) =>
                      prev.map((lead) =>
                            lead.id === l.id ? {...lead, status: newStatus} : lead
                      )
                );
}
    };
    const links = [
        {href: "/dashboard/all-deals", title: "See all deals", icon: <FaBusinessTime/>},
    ];
    const rangeTypes = [{id: "WEEK", name: "Week"}, {id: "MONTH", name: "Month"}]
    return (
          <DndProvider backend={HTML5Backend}>
              {currentId&&
<FinalizeModal  lead={leads?.find((l)=>l.id===currentId)}open={finalizeModel} setOpen={setFinalizeModel} id={currentId} setId={setCurrentId} setleads={setleads}/>
              }
              <Box px={1.5}>
                  <Box
                        sx={{
                            display: 'flex',
                            width: '100%',
                            p: {xs: 1.5, md: 3}, // Added padding
                            mb: 2, // Margin bottom for spacing from Kanban
                            backgroundColor: 'background.paper', // Added background
                            borderRadius: 1, // Rounded corners
                            boxShadow: 1, // Subtle shadow
                            gap: 1, // Increased gap
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexDirection: {
                                xs: 'column',
                                md: 'row'
                            }
                        }}
                  >
                      <Box
                            sx={{
                                display: 'flex',
                                gap: 2,
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                width: {
                                    xs: '100%',
                                    md: 'auto'
                                }
                            }}
                      >
                          <SearchComponent
                                apiEndpoint="search?model=client"
                                setFilters={setFilters}
                                inputLabel="Search client by name or email"
                                renderKeys={["name", "email"]}
                                mainKey="name"
                                searchKey={"clientId"}
                                withParamsChange={true}
                          />
                          {admin&&
                                <SearchComponent
                                      apiEndpoint="search?model=user"
                                      setFilters={setFilters}
                                      inputLabel="Search staff by name or email"
                                      renderKeys={["name", "email"]}
                                      mainKey="name"
                                      searchKey={"staffId"}
                                      withParamsChange={true}
                                />
                          }
                          <DateRangeFilter noMargin={true} setFilters={setFilters} lastThreeMonth={true}/>
                      </Box>
                      <Box
                            display="flex" justifyContent="flex-end"
                            sx={{

                                width: {
                                    xs: '100%',
                                    md: 'auto'
                                },
                            }}
                      >
                          <TabsWithLinks
                                links={links}
                                sx={{
                                    '& .MuiTabs-flexContainer': {
                                        justifyContent: {
                                            xs: 'center',
                                            md: 'flex-end'
                                        }
                                    }
                                }}
                          />
                      </Box>
                  </Box>
              </Box>
              <Grid
                    container
                    spacing={2}
                    sx={{
                        p: 3,
                        bgcolor: 'grey.100',
                        flexWrap: "noWrap",
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
                              leads={loading ? [] : leads.filter((lead) => lead.status === status)}
                              movelead={movelead}
                              admin={admin}
                              setleads={setleads}
                        />
                  ))}
              </Grid>
          </DndProvider>
    );
};
export default KanbanBoard;
"use client"
import React, {useEffect, useState} from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogTitle,
    Grid2 as Grid,
    IconButton,
    Paper,
    Stack,
    Tab,
    Tabs,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    BsArrowLeft,
    BsBuilding,
    BsCalendar,
    BsChatDots,
    BsCheckCircle,
    BsClock,
    BsFileText,
    BsInfoCircle,
    BsPerson,
    BsTelephone,
} from 'react-icons/bs';
import {ConsultationType, DesignItemType, DesignType, Emirate} from "@/app/helpers/constants.js";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader.jsx";
import {getData} from "@/app/helpers/functions/getData.js";
import {CallResultDialog, NewCallDialog, NewNoteDialog} from "@/app/UiComponents/DataViewer/leads/leadsDialogs.jsx";
import dayjs from "dayjs";
import {AiOutlineClockCircle as ClockIcon} from "react-icons/ai";


const TabPanel = ({children, value, index}) => (
      <Box role="tabpanel" hidden={value !== index} sx={{py: 2}}>
          {value === index && children}
      </Box>
);


// LeadContent Component (Extracted Shared Content)
const LeadContent = ({
                         lead,
                         activeTab,
                         setActiveTab,
                         theme,
                         isMobile,
                         getStatusBgColor,
                         handleClose,
                     }) => {


    return (
          <>
              <DialogTitle sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  pb: 2
              }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={2} alignItems="center">
                          {handleClose && (
                                <IconButton onClick={handleClose} sx={{mr: 1}}>
                                    <BsArrowLeft size={20}/>
                                </IconButton>
                          )}
                          <Avatar sx={{bgcolor: theme.palette.primary.main}}>
                              {lead.client.name[0]}
                          </Avatar>
                          <Typography variant="h6">{lead.client.name}</Typography>
                      </Stack>
                      <Chip
                            label={lead.status.replace(/_/g, " ")}
                            sx={{
                                bgcolor: getStatusBgColor(lead.status),
                                color: theme.palette.getContrastText(getStatusBgColor(lead.status)),
                                fontWeight: 500
                            }}
                      />
                  </Stack>
              </DialogTitle>

              <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    sx={{
                        px: 3,
                        borderBottom: 1,
                        borderColor: 'divider',
                        minHeight: "fit-content",

                        '& .MuiTab-root': {
                            fontSize: '0.875rem'
                        }
                    }}
                    variant={isMobile ? "fullWidth" : "standard"}
                    scrollButtons="auto"
              >
                  <Tab
                        icon={<BsInfoCircle size={20}/>}
                        label="Details"
                        sx={{textTransform: 'none'}}
                  />
                  <Tab
                        icon={<BsTelephone size={20}/>}
                        label="Calls"
                        sx={{textTransform: 'none'}}
                  />
                  <Tab
                        icon={<BsFileText size={20}/>}
                        label="Notes"
                        sx={{textTransform: 'none'}}
                  />
              </Tabs>

              <Box sx={{p: {xs: 2, md: 3}, overflowY: "auto", maxHeight: {md: "600px"}}}>
                  <TabPanel value={activeTab} index={0}>
                      <LeadData lead={lead} />
                  </TabPanel>

                  <TabPanel value={activeTab} index={1}>
                      <CallReminders lead={lead}/>
                  </TabPanel>

                  <TabPanel value={activeTab} index={2}>
                      <LeadNotes lead={lead}/>
                  </TabPanel>
              </Box>
          </>
    );
};

function LeadData({lead}) {
    let description = lead?.selectedCategory === "CONSULTATION" ? ConsultationType[lead.consultationType] : `${DesignType[lead.designType]} - ${DesignItemType[lead.designItemType]} - ${Emirate[lead.emirate]}`
const theme=useTheme()
    return (
          <Stack spacing={3}>
              <InfoCard title="Lead Information" icon={BsBuilding} theme={theme}>
                  <Grid container spacing={4}>
                      <Grid size={{xs: 12, md: 6}}>
                          <Typography color="text.secondary" variant="caption">
                              Category
                          </Typography>
                          <Typography variant="body1">
                              {lead.selectedCategory}
                          </Typography>
                      </Grid>

                      <Grid size={{xs: 12, md: 6}}>
                          <Typography color="text.secondary" variant="caption">
                              Location
                          </Typography>
                          <Typography variant="body1">
                              {lead.emirate}
                          </Typography>
                      </Grid>
                      <Grid size={{xs: 12, md: 6}}>
                          <Typography color="text.secondary" variant="caption">
                              Value
                          </Typography>
                          <Typography variant="body1">
                              AED {lead.price}
                          </Typography>
                      </Grid>
                      <Grid size={{xs: 12}}>
                          <Typography color="text.secondary" variant="caption">
                              Description
                          </Typography>
                          <Typography variant="body1">
                              {description}
                          </Typography>
                      </Grid>
                  </Grid>
              </InfoCard>

              <InfoCard title="Contact Information" icon={BsPerson} theme={theme}>
                  <Grid container spacing={4}>
                      <Grid size={{xs: 12, md: 6}}>
                          <Typography color="text.secondary" variant="caption">
                              Client Name
                          </Typography>
                          <Typography variant="body1">
                              {lead.client.name}
                          </Typography>
                          <Typography color="text.secondary" variant="caption">
                              Client Phone
                          </Typography>
                          <Typography variant="body1">
                              {lead.client.phone}
                          </Typography>
                      </Grid>
                      <Grid size={{xs: 12, md: 6}}>
                          <Typography color="text.secondary" variant="caption">
                              Assigned To
                          </Typography>
                          <Typography variant="body1">
                              {lead.assignedTo.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                              {lead.assignedTo.email}
                          </Typography>
                      </Grid>
                  </Grid>
              </InfoCard>
          </Stack>

    )
}

function CallReminders({lead}) {
    const [callReminders, setCallReminders] = useState(lead?.callReminders)
    const [nextCall,setNextCall]=useState()
    const [timeLeft,setTimeLeft]=useState("")
const theme=useTheme()
    useEffect(() => {
        if (lead?.callReminders) setCallReminders(lead.callReminders)
    }, [lead])
    useEffect(()=>{
        if(!callReminders||callReminders?.length===0)return
        if(callReminders[0].status==="IN_PROGRESS")setNextCall(callReminders[0])
    },[callReminders])
    const getStatusBgColor = (status) => {
        switch (status) {
            case 'IN_PROGRESS':
                return theme.palette.warning.light;
            case 'DONE':
                return theme.palette.success.light;
            default:
                return theme.palette.grey[200];
        }
    };

    React.useEffect(() => {
        if (!nextCall?.time) return;
        const calculateTimeLeft = () => {
            const now = new Date();
            const callTime = new Date(nextCall.time);
            const diff = callTime - now;

            if (diff <= 0) {
                setTimeLeft('Now');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h ${minutes}m`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${seconds}s`);
            }
        };

        calculateTimeLeft();

        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [nextCall]);
    return (
          <Stack spacing={3}>
              <NewCallDialog lead={lead} setCallReminders={setCallReminders}/>
              <Stack spacing={2}>
                  {callReminders?.map((call) => (
                        <Paper
                              key={call.id}
                              variant="outlined"
                              sx={{
                                  p: 2.5,
                                  borderRadius: 2,
                                  '&:hover': {
                                      boxShadow: theme.shadows[2],
                                      transition: 'box-shadow 0.3s ease-in-out'
                                  }
                              }}
                        >

                            <Stack spacing={2}>
                                {call.status==="IN_PROGRESS"&&
                                      <Box display="flex" alignItems="center" mb={1}>
                                          <ClockIcon fontSize="small" sx={{mr: 1}}/>
                                          <Typography variant="subtitle2" color="primary">
                                              Next Call in {timeLeft}
                                          </Typography>
                                      </Box>
                                }
                                <Stack
                                      direction="row"
                                      justifyContent="space-between"
                                      alignItems="flex-start"
                                >
                                    <Stack spacing={1}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <BsCalendar size={16} color={theme.palette.primary.main}/>
                                            <Typography variant="subtitle2">
                                                      <>
                                                {dayjs(call.time).format('MM/DD/YYYY, h:mm A')}
                                                      </>
                                            </Typography>
                                        </Stack>
                                        <Typography color="text.secondary">
                                          <strong>Reason</strong>: {call.reminderReason}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Chip
                                              size="small"
                                              icon={call.status === 'DONE' ?
                                                    <BsCheckCircle size={14}/> :
                                                    <BsClock size={14}/>
                                              }
                                              label={call.status.replace(/_/g, " ")}
                                              sx={{
                                                  bgcolor: getStatusBgColor(call.status),
                                                  color: theme.palette.getContrastText(getStatusBgColor(call.status)),
                                                  fontWeight: 500
                                              }}
                                        />
                                        {call.status === 'IN_PROGRESS' && (
                                              <CallResultDialog lead={lead} setCallReminders={setCallReminders} call={call} />
                                        )}
                                    </Stack>
                                </Stack>
                                {call.callResult && (
                                      <Box
                                            sx={{
                                                mt: 1,
                                                p: 1.5,
                                                bgcolor: theme.palette.action.hover,
                                                borderRadius: 1
                                            }}
                                      >
                                          <Typography variant="body2">
                                              <strong>Result</strong>: {call.callResult}
                                          </Typography>
                                      </Box>
                                )}
                            </Stack>
                        </Paper>
                  ))}
              </Stack>
          </Stack>

    )
}

function LeadNotes({lead}) {
    const [notes, setNotes] = useState(lead?.notes)
    const theme=useTheme()
    useEffect(() => {
        if (lead?.notes) setNotes(lead.notes)
    }, [lead])
    return (
          <Stack spacing={2}>
              <NewNoteDialog lead={lead} setNotes={setNotes}/>
              <Stack spacing={2}>
                  {notes?.map((note) => (
                        <Paper
                              key={note.id}
                              variant="outlined"
                              sx={{
                                  p: 2.5,
                                  borderRadius: 2,
                                  '&:hover': {
                                      boxShadow: theme.shadows[2],
                                      transition: 'box-shadow 0.3s ease-in-out'
                                  }
                              }}
                        >
                            <Stack spacing={1}>
                                <Typography variant="body1">
                                    {note.content}
                                </Typography>
                                <Stack
                                      direction="row"
                                      spacing={1}
                                      alignItems="center"
                                >
                                    <Avatar
                                          sx={{
                                              width: 24,
                                              height: 24,
                                              bgcolor: theme.palette.primary.main,
                                              fontSize: '0.75rem'
                                          }}
                                    >
                                        {note.user.name[0]}
                                    </Avatar>
                                    <Typography variant="caption" color="text.secondary">
                                        {note.user.name} • {dayjs(note.createdAt).format('MM/DD/YYYY')}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                  ))}
              </Stack>
          </Stack>

    )
}

// InfoCard Component (No major changes, just accept theme as prop)
const InfoCard = ({title, icon: Icon, children, theme}) => (
      <Paper
            variant="outlined"
            sx={{
                p: 2,
                borderRadius: 2,
                '&:hover': {
                    boxShadow: theme.shadows[2],
                    transition: 'box-shadow 0.3s ease-in-out'
                }
            }}
      >
          <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                  <Icon size={18} color={theme.palette.primary.main}/>
                  <Typography variant="subtitle1">{title}</Typography>
              </Stack>
              {children}
          </Stack>
      </Paper>
);


// PreviewDialog Component with Conditional Rendering
const PreviewDialog = ({open, onClose, id, setleads, page = false}) => {
    const [activeTab, setActiveTab] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [loading, setLoading] = useState(true)
    const [lead, setLead] = useState(null)
    useEffect(() => {
        async function getALeadDetails() {
            if (open) {

                const leadDetails = await getData({url: `shared/client-leads/${id}`, setLoading})
                console.log(leadDetails, "leadDetails")
                setLead(leadDetails.data)
            }
        }

        getALeadDetails()
    }, [id, open])
    // New States for Notes


    const getStatusBgColor = (status) => {
        switch (status) {
            case 'IN_PROGRESS':
                return theme.palette.warning.light;
            case 'DONE':
                return theme.palette.success.light;
            default:
                return theme.palette.grey[200];
        }
    };


    const handlePageClose = () => {
        if (onClose) onClose();
    };


    return (
          <>
              {page ? (
                    <Container maxWidth="md" sx={{mt: 4, mb: 4}}>
                        {loading ? <FullScreenLoader/> :

                              <LeadContent
                                    lead={lead}
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    theme={theme}
                                    isMobile={isMobile}
                                    getStatusBgColor={getStatusBgColor}
                                    handleClose={handlePageClose}
                              />
                        }
                    </Container>
              ) : (
                    // Render as a Dialog
                    <Dialog
                          open={open}
                          onClose={onClose}
                          fullWidth
                          maxWidth="md"
                          PaperProps={{
                              sx: {borderRadius: 2}
                          }}
                          fullScreen={isMobile}
                    >
                        {loading ? <FullScreenLoader/> :
                              <>
                                  <LeadContent
                                        lead={lead}
                                        activeTab={activeTab}
                                        setActiveTab={setActiveTab}
                                        theme={theme}
                                        isMobile={isMobile}
                                        getStatusBgColor={getStatusBgColor}
                                        handleClose={handlePageClose}
                                  />
                                  <DialogActions
                                        sx={{
                                            p: 2,
                                            borderTop: 1,
                                            borderColor: 'divider',
                                            gap: 1
                                        }}
                                  >
                                      <Button onClick={onClose} variant="outlined">
                                          Close
                                      </Button>
                                  </DialogActions>
                              </>
                        }
                    </Dialog>
              )}


          </>
    );
};

export default PreviewDialog;

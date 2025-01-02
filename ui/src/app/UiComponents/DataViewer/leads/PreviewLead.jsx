"use client"
import React, {useEffect, useState} from 'react';
import {
    alpha,
    Avatar,
    Box,
    Button,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogTitle, Fade,
    Grid2 as Grid,
    IconButton, Menu, MenuItem, Modal,
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
    BsCheckCircle,
    BsClock,
    BsFileText,
    BsInfoCircle,
    BsPerson, BsPersonCheck,
    BsTelephone,
} from 'react-icons/bs';
import {
    ClientLeadStatus,
    ConsultationType,
    DesignItemType,
    DesignType,
    Emirate,
    KanbanLeadsStatus, LeadCategory, simpleModalStyle, statusColors
} from "@/app/helpers/constants.js";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader.jsx";
import {getData} from "@/app/helpers/functions/getData.js";
import {CallResultDialog, NewCallDialog, NewNoteDialog} from "@/app/UiComponents/DataViewer/leads/leadsDialogs.jsx";
import dayjs from "dayjs";
import {AiOutlineClockCircle as ClockIcon, AiOutlineSwap} from "react-icons/ai";
import {calculateTimeLeft, enumToKeyValueArray} from "@/app/helpers/functions/utility.js";
import {handleRequestSubmit} from "@/app/helpers/functions/handleSubmit.js";
import {useToastContext} from "@/app/providers/ToastLoadingProvider.js";
import {RiAlarmLine, RiCalendarLine, RiCheckboxCircleLine, RiTimeLine, RiUserLine} from "react-icons/ri";
import ConfirmWithActionModel from "@/app/UiComponents/models/ConfirmsWithActionModel.jsx";


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
                         handleClose,
                         setleads,
                         setLead,admin
                     }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const {setLoading} = useToastContext();
const [openConfirm,setOpenConfirm]=useState(false)
    const handleClick = (event) => {
    if(!admin){
        setAnchorEl(event.currentTarget);
    }
    };

    const handleMenuClose = async (value) => {
        if(admin)return

        const request = await handleRequestSubmit(
              {status: value},
              setLoading,
              `staff/client-leads/${lead.id}/status`,
              false,
              "Updating",
              null,
              "PUT"
        );
        if (request.status === 200) {
            if (setleads) {
                setleads((prev) =>
                      prev.map((l) =>
                            l.id === lead.id ? {...l, status: value} : l
                      )
                );
            }
            if (setLead) {
                setLead((oldLead) => ({...oldLead, status: value}));
            }
            setAnchorEl(null);
        }
    };

    const handleConvertLead =async () => {
        if(admin)return
        const request=await handleRequestSubmit({status:"ON_HOLD"},setLoading,`staff/client-leads/${lead.id}/status`,false,"Converting",false,"PUT")
   if(request.status===200){
       window.setTimeout(()=>{
           window.location.reload()
       },500)
   }
    };

    const leadStatus = enumToKeyValueArray(KanbanLeadsStatus);

    return (
          <>
              <DialogTitle
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        pb: 2
                    }}
              >
                  <Stack spacing={2}>
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

                      <Stack
                            direction={"row"}
                            spacing={1}
                            alignItems={{ sm: 'center' }}
                            justifyContent="flex-end"
                      >
                          {!admin&&
                          <Button
                                fullWidth={isMobile}
                                variant="outlined"
                                startIcon={<BsPersonCheck size={18} />}
                                onClick={()=>setOpenConfirm(true)}
                                sx={{
                                    borderRadius: "50px",
                                    textTransform: 'none'
                                }}
                          >
                              Convert lead
                          </Button>
                          }
                          {!admin&&
                          <Modal open={openConfirm}              onClose={() => setOpenConfirm(false)}
                                 closeAfterTransition>
                              <Fade in={openConfirm}>

                              <Box sx={{...simpleModalStyle}}>
                                  <Typography variant="h6" component="h2" mb={2}>
                                      Convert lead so some one else take it?
                                  </Typography>
                                  <Box sx={{display: 'flex', justifyContent: 'flex-end', marginTop: '16px'}}>
                                      <Button variant="contained" color={ "primary"}
                                              onClick={handleConvertLead}
                                      >
                                          Confirm
                                      </Button>
                                      <Button variant="contained" onClick={() => setOpenConfirm(false)} sx={{marginLeft: '8px',    color:"text.white"
                                      }} color="secondary" >
                                          Cancel
                                      </Button>
                                  </Box>
                              </Box>
                              </Fade>
                          </Modal>
                          }
                          <Button
                                fullWidth={isMobile}
                                variant="contained"
                                startIcon={!admin&&<AiOutlineSwap/>}
                                aria-controls={open ? 'basic-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={open ? 'true' : undefined}
                                onClick={handleClick}
                                sx={{
                                    background: statusColors[lead.status],
                                    color: theme.palette.getContrastText(statusColors[lead.status]),
                                    fontWeight: 500,
                                    borderRadius: "50px"
                                }}
                          >
                              {ClientLeadStatus[lead.status]}
                          </Button>
                          <Menu
                                id="basic-menu"
                                anchorEl={anchorEl}
                                open={open}
                                onClose={() => setAnchorEl(null)}
                                MenuListProps={{
                                    'aria-labelledby': 'basic-button',
                                }}
                          >
                              {leadStatus.map((lead) => (
                                    <MenuItem
                                          key={lead.id}
                                          value={lead.id}
                                          onClick={() => handleMenuClose(lead.id)}
                                    >
                                        {lead.name}
                                    </MenuItem>
                              ))}
                          </Menu>
                      </Stack>
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
                      <LeadData lead={lead} admin={admin}/>
                  </TabPanel>
                  <TabPanel value={activeTab} index={1}>
                      <CallReminders admin={admin} lead={lead} setleads={setleads}/>
                  </TabPanel>
                  <TabPanel value={activeTab} index={2}>
                      <LeadNotes admin={admin} lead={lead}/>
                  </TabPanel>
              </Box>
          </>
    );
};
function LeadData({lead,admin}) {
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
                              {LeadCategory[lead.selectedCategory]}
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

function CallReminders({ lead,setleads,admin }) {
    const [callReminders, setCallReminders] = useState(lead?.callReminders);
    const [nextCall, setNextCall] = useState();
    const [timeLeft, setTimeLeft] = useState("");
    const theme = useTheme();

    useEffect(() => {
        if (lead?.callReminders) setCallReminders(lead.callReminders);
    }, [lead]);

    useEffect(() => {
        if (!callReminders || callReminders?.length === 0) return;
        if (callReminders[0].status === "IN_PROGRESS") setNextCall(callReminders[0]);
    }, [callReminders]);

    const getStatusStyles = (status) => ({
        backgroundColor: {
            'IN_PROGRESS': alpha(theme.palette.warning.main, 0.1),
            'DONE': alpha(theme.palette.success.main, 0.1),
        }[status] || alpha(theme.palette.grey[500], 0.1),
        color: {
            'IN_PROGRESS': theme.palette.warning.dark,
            'DONE': theme.palette.success.dark,
        }[status] || theme.palette.grey[700],
        borderColor: {
            'IN_PROGRESS': theme.palette.warning.main,
            'DONE': theme.palette.success.main,
        }[status] || theme.palette.grey[300],
    });

    React.useEffect(() => {
        if (!nextCall?.time) return;



        calculateTimeLeft(setTimeLeft,nextCall);
        const timer = setInterval(()=>calculateTimeLeft(setTimeLeft,nextCall), 1000);
        return () => clearInterval(timer);
    }, [nextCall]);

    return (
          <Stack spacing={3}>
              {!admin&&
              <NewCallDialog lead={lead} setCallReminders={setCallReminders}  setleads={setleads}/>
              }
              <Stack spacing={2}>
                  {callReminders?.map((call) => (
                        <Paper
                              key={call.id}
                              elevation={0}
                              sx={{
                                  position: 'relative',
                                  p: 3,
                                  borderRadius: 2,
                                  border: `1px solid ${theme.palette.divider}`,
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': {
                                      boxShadow: theme.shadows[4],
                                      transform: 'translateY(-2px)',
                                      borderColor: theme.palette.primary.main,
                                  }
                              }}
                        >
                            <Stack spacing={2}>
                                <Stack
                                      direction="row"
                                      justifyContent="space-between"
                                      alignItems="center"
                                >
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Chip
                                              size="small"
                                              icon={
                                                  call.status === 'DONE' ?
                                                        <RiCheckboxCircleLine size={16} /> :
                                                        <RiAlarmLine size={16} />
                                              }
                                              label={call.status.replace(/_/g, " ")}
                                              sx={{
                                                  ...getStatusStyles(call.status),
                                                  fontWeight: 600,
                                                  border: '1px solid',
                                                  '& .MuiChip-icon': {
                                                      color: 'inherit'
                                                  }
                                              }}
                                        />
                                        {!admin&&
                                              <>
                                        {call.status === 'IN_PROGRESS' && (
                                              <CallResultDialog
                                                    lead={lead}
                                                    setCallReminders={setCallReminders}
                                                    call={call}
                                                    setleads={setleads}
                                              />
                                        )}
                                        </>
                                        }
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <RiUserLine size={16} color={theme.palette.text.secondary} />
                                        <Typography variant="body2" color="text.secondary">
                                            {call.user.name}
                                        </Typography>
                                    </Stack>
                                </Stack>
                                {call.status === "IN_PROGRESS" && (
                                      <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                                color: theme.palette.primary.main,
                                                p: 2,
                                                borderRadius: 2,
                                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                            }}
                                      >
                                          <RiTimeLine size={20} style={{ marginRight: theme.spacing(1) }} />
                                          <Typography variant="subtitle2" fontWeight="600">
                                              Next Call in {timeLeft}
                                          </Typography>
                                      </Box>
                                )}

                                {/* Main Content */}
                                <Stack spacing={2}>
                                    {/* DateTime */}
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <RiCalendarLine size={18} color={theme.palette.primary.main} />
                                        <Typography variant="subtitle2">
                                            {dayjs(call.time).format('MM/DD/YYYY, h:mm A')}
                                        </Typography>
                                    </Stack>

                                    {/* Reason */}
                                    <Box
                                          sx={{
                                              bgcolor: alpha(theme.palette.background.default, 0.6),
                                              p: 2,
                                              borderRadius: 2,
                                              border: `1px solid ${theme.palette.divider}`,
                                          }}
                                    >
                                        <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                                            <Box component="span" fontWeight="600">Reason:</Box>{' '}
                                            {call.reminderReason}
                                        </Typography>
                                    </Box>

                                    {/* Call Result */}
                                    {call.callResult && (
                                          <Box
                                                sx={{
                                                    p: 2,
                                                    bgcolor: alpha(theme.palette.success.main, 0.05),
                                                    borderRadius: 2,
                                                    border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                                                }}
                                          >
                                              <Typography variant="body2" color="success.dark">
                                                  <Box component="span" fontWeight="600">Result:</Box>{' '}
                                                  {call.callResult}
                                              </Typography>
                                          </Box>
                                    )}
                                </Stack>
                            </Stack>
                        </Paper>
                  ))}
              </Stack>
          </Stack>
    );
}
function LeadNotes({lead ,admin}) {
    const [notes, setNotes] = useState(lead?.notes)
    const theme=useTheme()
    useEffect(() => {
        if (lead?.notes) setNotes(lead.notes)
    }, [lead])
    return (
          <Stack spacing={2}>
              {!admin&&
              <NewNoteDialog lead={lead} setNotes={setNotes}/>
              }
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
const PreviewDialog = ({open, onClose, id, setleads, page = false,admin}) => {
    const [activeTab, setActiveTab] = useState(0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [loading, setLoading] = useState(true)
    const [lead, setLead] = useState(null)
    useEffect(() => {
        async function getALeadDetails() {
            if (open) {
                const leadDetails = await getData({url: `shared/client-leads/${id}`, setLoading})
                setLead(leadDetails.data)
            }
        }

        getALeadDetails()
    }, [id, open])
    // New States for Notes

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
                                    handleClose={handlePageClose}
                                    setLead={setLead}
                                    setleads={setleads}
                                    admin={admin}
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
                                        handleClose={handlePageClose}
                                        setLead={setLead}
                                        setleads={setleads}
                                        admin={admin}
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

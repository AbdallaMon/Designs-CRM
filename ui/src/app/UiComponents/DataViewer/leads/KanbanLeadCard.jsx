"use client"
import React from 'react';
import {useDrag} from 'react-dnd';
import {
    Box, Button,
    Card,
    CardContent,
    Chip,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    AiOutlineClockCircle as ClockIcon,
    AiOutlineDollar as MoneyIcon,
    AiOutlineEllipsis as MoreVertIcon,
    AiOutlineEye as PreviewIcon,
    AiOutlineFileText as NoteIcon,
    AiOutlinePhone as PhoneIcon,
    AiOutlinePlus as AddIcon,
    AiOutlineSwap as ChangeStatusIcon,
    AiOutlineUser as UserIcon
} from "react-icons/ai";

import {styled} from "@mui/material/styles";
import dayjs from "dayjs";
import {KanbanStatusArray, statusColors} from "@/app/helpers/constants.js";
import PreviewDialog from "@/app/UiComponents/DataViewer/leads/PreviewLead.jsx";
import {CallResultDialog, NewCallDialog, NewNoteDialog} from "@/app/UiComponents/DataViewer/leads/leadsDialogs.jsx";
import {handleRequestSubmit} from "@/app/helpers/functions/handleSubmit.js";
import {useToastContext} from "@/app/providers/ToastLoadingProvider.js";
import {hideMoreData} from "@/app/helpers/functions/utility.js";

const ItemTypes = {
    CARD: "card",
};

const StyledCard = styled(Card)(({theme, status}) => ({
    margin: theme.spacing(1),
    padding:theme.spacing(0.2),
    borderLeft: `5px solid ${statusColors[status]}`,
    transition: 'all 0.3s',
    cursor: 'grab',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4],
    },
    '&:active': {
        cursor: 'grabbing'
    }
}));

const CallInfoBox = styled(Box)(({theme, variant}) => ({
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: variant === 'next' ? '#e3f2fd' : '#f5f5f5',
    marginTop: theme.spacing(1),
}));

const LeadCard = ({lead, movelead, admin, setleads}) => {
    const [, drag] = useDrag({
        type: ItemTypes.CARD,
        item: {id: lead.id, status: lead.status},
    });
    console.log(lead,"lead")
    const {setLoading} = useToastContext()
    const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
    const [timeLeft, setTimeLeft] = React.useState('');
    const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);

    const handleMenuClick = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleStatusChange = async (newStatus) => {
        const request = await handleRequestSubmit({status: newStatus}, setLoading, `staff/client-leads/${lead.id}/status`, false, "Updating")
        if (request.status === 200) {
            movelead(lead.id, newStatus);
            handleMenuClose();
        }
    };

    // Process call reminders
    const getCallInfo = React.useCallback((callReminders) => {
        if (!callReminders || callReminders.length === 0) {
            return {lastCall: null, nextCall: null};
        }

        const sortedCalls = [...callReminders].sort((a, b) =>
              new Date(b.time) - new Date(a.time)
        );

        const lastTwoCalls = sortedCalls.slice(0, 2);

        if (lastTwoCalls.length === 1) {
            if (lastTwoCalls[0].status === 'IN_PROGRESS') {
                return {lastCall: null, nextCall: lastTwoCalls[0]};
            }
            return {lastCall: lastTwoCalls[0], nextCall: null};
        }

        if (lastTwoCalls[0].status === 'IN_PROGRESS') {
            return {lastCall: lastTwoCalls[1], nextCall: lastTwoCalls[0]};
        }

        return {lastCall: lastTwoCalls[0], nextCall: null};
    }, []);

    const {lastCall, nextCall} = getCallInfo(lead.callReminders);

    // Update timer - Fixed version
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
          <div ref={drag}>
              <StyledCard status={lead.status}>
                  <CardContent>
                      <Box>
                          <Typography variant="h6" component="div">
                              {lead.client.name}
                          </Typography>
                      </Box>
                      <Box my={1} display="flex" alignItems="center" gap={1}>
                          <Chip
                                icon={<MoneyIcon/>}
                                label={lead.price}
                                variant="outlined"
                          />
                          <Tooltip title="Actions">
                              <IconButton
                                    size="small"
                                    onClick={handleMenuClick}
                              >
                                  <MoreVertIcon/>
                              </IconButton>
                          </Tooltip>
                      </Box>
                      {admin && lead.assingedTo && (
                            <Box display="flex" alignItems="center" mb={2}>
                                <UserIcon fontSize="small" sx={{mr: 1, color: 'text.secondary'}}/>
                                <Typography variant="body2" color="text.secondary">
                                    {lead.assingedTo.name}
                                </Typography>
                            </Box>
                      )}
                      <Stack spacing={2}>
                          {nextCall && (
                                <CallInfoBox variant="next">
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <ClockIcon fontSize="small" sx={{mr: 1}}/>
                                        <Typography variant="subtitle2" color="primary">
                                            Next Call in {timeLeft}
                                        </Typography>
                                    </Box>
                                    <Box pl={3}>
                                        <Typography variant="body2" color="text.secondary">
                                            {dayjs(nextCall.time).format("MMM D, YYYY HH:mm")}
                                        </Typography>
                                        <Typography variant="body2">
                                            Reason: {hideMoreData(nextCall.reminderReason) || "N/A"}
                                        </Typography>
                                        <CallResultDialog setleads={setleads} lead={lead} call={nextCall}
                                                          type={"button"} text={"Update call"}>

                                        </CallResultDialog>
                                    </Box>
                                </CallInfoBox>
                          )}
                          {lastCall && (
                                <CallInfoBox>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <PhoneIcon fontSize="small" sx={{mr: 1}}/>
                                        <Typography variant="subtitle2">Last Call</Typography>
                                    </Box>
                                    <Box pl={3}>
                                        <Typography variant="body2" color="text.secondary">
                                            {dayjs(lastCall.time).format("MMM D, YYYY HH:mm")}
                                        </Typography>
                                        <Typography  variant="body2" color="text.secondary" my={1.2}>
                                            Reason: {hideMoreData(lastCall.reminderReason)}
                                        </Typography>
                                        <Typography variant="body2">
                                            Result: {hideMoreData(lastCall.callResult) || "N/A"}
                                        </Typography>
                                    </Box>
                                </CallInfoBox>
                          )}

                      </Stack>
                  </CardContent>
              </StyledCard>

              <Menu
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={handleMenuClose}
              >
                  {/* Status menu header */}
                  <Box sx={{px: 2, py: 1, bgcolor: 'grey.50'}}>
                      <Typography variant="caption" color="text.secondary">
                          Available Actions
                      </Typography>
                  </Box>

                  <MenuItem onClick={() => {
                  }}>
                      <NewNoteDialog type="children" setleads={setleads} lead={lead}>
                          <NoteIcon fontSize="small" sx={{mr: 1}}/>
                          Add Note
                      </NewNoteDialog>
                  </MenuItem>
                  <MenuItem >
                      <NewCallDialog type="children" setleads={setleads} lead={lead}>
                          <AddIcon fontSize="small" sx={{mr: 1}}/>
                          Schedule Call
                      </NewCallDialog>
                  </MenuItem>
                  <MenuItem onClick={() => {
                      setPreviewDialogOpen(true);
                  }}>
                      <Button
                            sx={{
                                display:"flex",
                                gap:1,
                                justifyContent:"flex-start",
                                width:"100%"
                            }}
                            variant={"text"}>

                      <PreviewIcon fontSize="small" sx={{mr: 1}}/>
                      Preview Details
                      </Button>
                  </MenuItem>
                  <Divider/>
                  <Box sx={{px: 2, py: 1, bgcolor: 'grey.50'}}>

                      <Typography variant="caption" color="text.secondary">
                          Change Status
                      </Typography>
                  </Box>
                  {KanbanStatusArray.map((status) => (
                        <MenuItem
                              key={status}
                              onClick={() => handleStatusChange(status)}
                              sx={{
                                  color: statusColors[status],
                                  '&:hover': {
                                      backgroundColor: statusColors[status] + '20'
                                  }
                              }}
                        >
                            <ChangeStatusIcon fontSize="small" sx={{mr: 1}}/>
                            {status.replace(/_/g, " ")}
                        </MenuItem>
                  ))}
              </Menu>

              <PreviewDialog
                    open={previewDialogOpen}
                    onClose={() => setPreviewDialogOpen(false)}
                    setleads={setleads}
                    id={lead.id}
              />
          </div>
    );
};

export default LeadCard;
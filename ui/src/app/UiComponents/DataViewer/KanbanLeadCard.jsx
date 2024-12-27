"use client"
import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import {
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    Chip,
    IconButton,
    Divider,
    Stack,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField, Tooltip,

} from "@mui/material";
import {
    AiOutlineEllipsis as MoreVertIcon,

    AiOutlineDollar as MoneyIcon,
    AiOutlineUser as UserIcon,
    AiOutlinePhone as PhoneIcon,
    AiOutlineClockCircle as ClockIcon,
    AiOutlineFileText as NoteIcon,
    AiOutlineSwap as ChangeStatusIcon,
    AiOutlinePlus as AddIcon, AiOutlineEye as PreviewIcon
} from "react-icons/ai";

import {styled} from "@mui/material/styles";
import dayjs from "dayjs";
import {KanbanStatusArray, statusColors} from "@/app/helpers/constants.js";
import PreviewDialog from "@/app/UiComponents/DataViewer/PreviewLead.jsx";
const ItemTypes = {
    CARD: "card",
};

const StyledCard = styled(Card)(({ theme, status }) => ({
    margin: theme.spacing(1),
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

const CallInfoBox = styled(Box)(({ theme, variant }) => ({
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: variant === 'next' ? '#e3f2fd' : '#f5f5f5',
    marginTop: theme.spacing(1),
}));

const AddNoteDialog = ({ open, onClose, leadId }) => {
    const [note, setNote] = React.useState('');

    const handleSubmit = () => {
        console.log('Adding note for lead:', leadId, note);
        onClose();
    };

    return (
          <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
              <DialogTitle>Add Note</DialogTitle>
              <DialogContent>
                  <TextField
                        autoFocus
                        margin="dense"
                        label="Note"
                        fullWidth
                        multiline
                        rows={4}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                  />
              </DialogContent>
              <DialogActions>
                  <Button onClick={onClose}>Cancel</Button>
                  <Button onClick={handleSubmit} variant="contained">Add</Button>
              </DialogActions>
          </Dialog>
    );
};

const AddCallReminderDialog = ({ open, onClose, leadId }) => {
    const [reminder, setReminder] = React.useState({
        time: '',
        reason: ''
    });

    const handleSubmit = () => {
        console.log('Adding call reminder for lead:', leadId, reminder);
        onClose();
    };

    return (
          <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
              <DialogTitle>Schedule Call Reminder</DialogTitle>
              <DialogContent>
                  <TextField
                        margin="dense"
                        label="Date & Time"
                        type="datetime-local"
                        fullWidth
                        value={reminder.time}
                        onChange={(e) => setReminder({...reminder, time: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                        margin="dense"
                        label="Reason"
                        fullWidth
                        multiline
                        rows={2}
                        value={reminder.reason}
                        onChange={(e) => setReminder({...reminder, reason: e.target.value})}
                  />
              </DialogContent>
              <DialogActions>
                  <Button onClick={onClose}>Cancel</Button>
                  <Button onClick={handleSubmit} variant="contained">Schedule</Button>
              </DialogActions>
          </Dialog>
    );
};


const LeadCard = ({ lead, movelead, admin,setleads }) => {
    const [, drag] = useDrag({
        type: ItemTypes.CARD,
        item: { id: lead.id, status: lead.status },
    });

    const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
    const [timeLeft, setTimeLeft] = React.useState('');
    const [noteDialogOpen, setNoteDialogOpen] = React.useState(false);
    const [reminderDialogOpen, setReminderDialogOpen] = React.useState(false);
    const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);

    const handleMenuClick = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleStatusChange = (newStatus) => {
        movelead(lead.id, newStatus);
        handleMenuClose();
    };

    // Process call reminders
    const getCallInfo = React.useCallback((callReminders) => {
        if (!callReminders || callReminders.length === 0) {
            return { lastCall: null, nextCall: null };
        }

        const sortedCalls = [...callReminders].sort((a, b) =>
              new Date(b.time) - new Date(a.time)
        );

        const lastTwoCalls = sortedCalls.slice(0, 2);

        if (lastTwoCalls.length === 1) {
            if (lastTwoCalls[0].status === 'IN_PROGRESS') {
                return { lastCall: null, nextCall: lastTwoCalls[0] };
            }
            return { lastCall: lastTwoCalls[0], nextCall: null };
        }

        if (lastTwoCalls[0].status === 'IN_PROGRESS') {
            return { lastCall: lastTwoCalls[1], nextCall: lastTwoCalls[0] };
        }

        return { lastCall: lastTwoCalls[0], nextCall: null };
    }, []);

    const { lastCall, nextCall } = getCallInfo(lead.callReminders);

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

        // Initial calculation
        calculateTimeLeft();

        // Update every second
        const timer = setInterval(calculateTimeLeft, 1000);

        // Cleanup on unmount or when nextCall changes
        return () => clearInterval(timer);
    }, [nextCall]);

    return (
          <div ref={drag}>
              <StyledCard status={lead.status}>
                  <CardContent>
                      <Box >
                          <Typography variant="h6" component="div">
                              {lead.client.name}
                          </Typography>
                      </Box>

                      <Box my={1} display="flex" alignItems="center" gap={1}>
                              <Chip
                                    icon={<MoneyIcon />}
                                    label={lead.price}
                                    variant="outlined"
                              />
                              <Tooltip title="Actions">
                                  <IconButton
                                        size="small"
                                        onClick={handleMenuClick}
                                  >
                                      <MoreVertIcon />
                                  </IconButton>
                              </Tooltip>
                          </Box>



                      {admin && lead.user && (
                            <Box display="flex" alignItems="center" mb={2}>
                                <UserIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                    {lead.user.name}
                                </Typography>
                            </Box>
                      )}

                      <Stack spacing={2}>
                          {lastCall && (
                                <CallInfoBox>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                                        <Typography variant="subtitle2">Last Call</Typography>
                                    </Box>
                                    <Box pl={4}>
                                        <Typography variant="body2" color="text.secondary">
                                            {dayjs(lastCall.time).format("MMM D, YYYY HH:mm")}
                                        </Typography>
                                        <Typography variant="body2">
                                            Result: {lastCall.callResult || "N/A"}
                                        </Typography>
                                    </Box>
                                </CallInfoBox>
                          )}

                          {nextCall && (
                                <CallInfoBox variant="next">
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <ClockIcon fontSize="small" sx={{ mr: 1 }} />
                                        <Typography variant="subtitle2" color="primary">
                                            Next Call in {timeLeft}
                                        </Typography>
                                    </Box>
                                    <Box pl={4}>
                                        <Typography variant="body2" color="text.secondary">
                                            {dayjs(nextCall.time).format("MMM D, YYYY HH:mm")}
                                        </Typography>
                                        <Typography variant="body2">
                                            Reason: {nextCall.reminderReason || "N/A"}
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
                  <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">
                          Available Actions
                      </Typography>
                  </Box>

                  <MenuItem onClick={() => {
                      setNoteDialogOpen(true);
                      handleMenuClose();
                  }}>
                      <NoteIcon fontSize="small" sx={{ mr: 1 }} />
                      Add Note
                  </MenuItem>
                  <MenuItem onClick={() => {
                      setReminderDialogOpen(true);
                      handleMenuClose();
                  }}>
                      <AddIcon fontSize="small" sx={{ mr: 1 }} />
                      Schedule Call
                  </MenuItem>
                  <MenuItem onClick={() => {
                      setPreviewDialogOpen(true);
                      handleMenuClose();
                  }}>
                      <PreviewIcon fontSize="small" sx={{ mr: 1 }} />
                      Preview Details
                  </MenuItem>
                  <Divider />
                  {/* Status change section header */}
                  <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
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
                            <ChangeStatusIcon fontSize="small" sx={{ mr: 1 }} />
                            {status.replace(/_/g, " ")}
                        </MenuItem>
                  ))}
              </Menu>

              <AddNoteDialog
                    open={noteDialogOpen}
                    onClose={() => setNoteDialogOpen(false)}
                    leadId={lead.id}
              />

              <AddCallReminderDialog
                    open={reminderDialogOpen}
                    onClose={() => setReminderDialogOpen(false)}
                    leadId={lead.id}
              />

              <PreviewDialog
                    open={previewDialogOpen}
                    onClose={() => setPreviewDialogOpen(false)}
                    setleads={setleads}
              />
          </div>
    );
};

export default LeadCard;
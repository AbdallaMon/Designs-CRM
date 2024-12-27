import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Chip,
    Stack,
    TextField,
    Tab,
    Tabs,
    Paper,
    Alert,
    IconButton,
    Avatar,
    useTheme,
    useMediaQuery,
    Grid2 as Grid,
} from '@mui/material';
import {
    BsCheckCircle,
    BsPlus,
    BsClock,
    BsTelephone,
    BsFileText,
    BsInfoCircle,
    BsCalendar,
    BsPerson,
    BsGeoAlt,
    BsCurrencyDollar,
    BsBuilding,
    BsChatDots,
} from 'react-icons/bs';

// Sample Lead Data (As Provided)
const sampleLead = {
    id: 1,
    client: {
        id: 1,
        name: "Acme Corp",
        phone: "+971501234567"
    },
    user: {
        id: 1,
        name: "John Smith",
        email: "john@example.com"
    },
    selectedCategory: "DESIGN",
    designType: "RESIDENTIAL",
    designItemType: "UNDER_CONSTRUCTION",
    emirate: "DUBAI",
    status: "IN_PROGRESS",
    price: "150,000.00",
    files: [
        { id: 1, name: "Requirements.pdf", url: "/files/req.pdf", createdAt: "2024-12-20T10:00:00" }
    ],
    notes: [
        { id: 1, content: "Initial contact made", userId: 1, user: { name: "John Smith" }, createdAt: "2024-12-20T10:00:00" },
        { id: 2, content: "Client interested in premium package", userId: 1, user: { name: "John Smith" }, createdAt: "2024-12-21T14:30:00" }
    ],
    callReminders: [
        {
            id: 1,
            time: "2024-12-20T11:00:00",
            status: "DONE",
            reminderReason: "Initial consultation",
            callResult: "Positive response, interested in design services",
            userId: 1,
            user: { name: "John Smith" }
        },
        {
            id: 2,
            time: "2024-12-28T14:00:00",
            status: "IN_PROGRESS",
            reminderReason: "Follow-up on proposal",
            userId: 1,
            user: { name: "John Smith" }
        }
    ],
    createdAt: "2024-12-20T10:00:00",
    updatedAt: "2024-12-21T14:30:00"
};


// TabPanel Component (No changes needed)
const TabPanel = ({ children, value, index }) => (
      <Box role="tabpanel" hidden={value !== index} sx={{ py: 2 }}>
          {value === index && children}
      </Box>
);

// CallResultDialog Component (Minor Fixes)
const CallResultDialog = ({ open, onClose, onSubmit }) => {
    const [result, setResult] = useState('');

    const handleSubmit = () => {
        onSubmit(result);
        setResult('');
    };

    return (
          <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  Update Call Result
              </DialogTitle>
              <DialogContent sx={{ mt: 2 }}>
                  <TextField
                        autoFocus
                        margin="dense"
                        label="Call Result"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={result}
                        onChange={(e) => setResult(e.target.value)}
                  />
              </DialogContent>
              <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Button onClick={onClose} variant="outlined">Cancel</Button>
                  <Button onClick={handleSubmit} variant="contained" color="primary" disabled={!result.trim()}>
                      Submit
                  </Button>
              </DialogActions>
          </Dialog>
    );
};

// NewCallDialog Component (No changes needed)
const NewCallDialog = ({ open, onClose, onSubmit }) => {
    const [callData, setCallData] = useState({ time: '', reminderReason: '' });

    const handleSubmit = () => {
        onSubmit(callData);
        setCallData({ time: '', reminderReason: '' });
    };

    return (
          <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
              <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  Schedule New Call
              </DialogTitle>
              <DialogContent>
                  <Stack spacing={3} sx={{ mt: 2 }}>
                      <TextField
                            type="datetime-local"
                            label="Call Time"
                            value={callData.time}
                            onChange={(e) => setCallData({ ...callData, time: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                            label="Reminder Reason"
                            value={callData.reminderReason}
                            onChange={(e) => setCallData({ ...callData, reminderReason: e.target.value })}
                            fullWidth
                            multiline
                            rows={2}
                      />
                  </Stack>
              </DialogContent>
              <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Button onClick={onClose} variant="outlined">Cancel</Button>
                  <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!callData.time || !callData.reminderReason}
                        color="primary"
                  >
                      Schedule
                  </Button>
              </DialogActions>
          </Dialog>
    );
};

// PreviewDialog Component with Enhancements
const PreviewDialog = ({ open, onClose, lead = sampleLead, setleads }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [showCallResult, setShowCallResult] = useState(false);
    const [showNewCall, setShowNewCall] = useState(false);
    const [selectedCall, setSelectedCall] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // New States for Notes
    const [newNote, setNewNote] = useState('');

    const handleCallResult = (callId, result) => {
        const updatedLead = {
            ...lead,
            callReminders: lead.callReminders.map(call =>
                  call.id === callId ? { ...call, status: 'DONE', callResult: result } : call
            )
        };
        setleads(updatedLead);
        setShowCallResult(false);
    };

    const handleNewCall = (callData) => {
        const newCall = {
            id: lead.callReminders.length + 1,
            ...callData,
            status: 'IN_PROGRESS',
            userId: lead.user.id,
            user: lead.user
        };
        const updatedLead = {
            ...lead,
            callReminders: [...lead.callReminders, newCall]
        };
        setleads(updatedLead);
        setShowNewCall(false);
    };

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const note = {
            id: lead.notes.length + 1,
            content: newNote.trim(),
            userId: lead.user.id,
            user: lead.user,
            createdAt: new Date().toISOString()
        };
        const updatedLead = {
            ...lead,
            notes: [...lead.notes, note]
        };
        setleads(updatedLead);
        setNewNote('');
    };

    const canScheduleNewCall = !lead.callReminders.some(call => call.status === 'IN_PROGRESS');

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

    const InfoCard = ({ title, icon: Icon, children }) => (
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
                      <Icon size={18} color={theme.palette.primary.main} />
                      <Typography variant="subtitle1">{title}</Typography>
                  </Stack>
                  {children}
              </Stack>
          </Paper>
    );

    return (
          <>
              <Dialog
                    open={open}
                    onClose={onClose}
                    fullWidth
                    maxWidth="md"
                    PaperProps={{
                        sx: { borderRadius: 2 }
                    }}
                    fullScreen={isMobile}
              >
                  <DialogTitle sx={{
                      borderBottom: 1,
                      borderColor: 'divider',
                      pb: 2
                  }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
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
                            '& .MuiTab-root': {
                                minHeight: "fit-content",
                                fontSize: '0.875rem'
                            }
                        }}
                        variant={isMobile ? "fullWidth" : "standard"}
                        scrollButtons="auto"
                  >
                      <Tab
                            icon={<BsInfoCircle size={20} />}
                            label="Details"
                            sx={{ textTransform: 'none' }}
                      />
                      <Tab
                            icon={<BsTelephone size={20} />}
                            label="Calls"
                            sx={{ textTransform: 'none' }}
                      />
                      <Tab
                            icon={<BsFileText size={20} />}
                            label="Notes"
                            sx={{ textTransform: 'none' }}
                      />
                  </Tabs>

                  <DialogContent sx={{p:{xs:2,md:3}}}>
                      <TabPanel value={activeTab} index={0}>
                          <Stack spacing={3}>
                              <InfoCard title="Lead Information" icon={BsBuilding}>
                                  <Grid container spacing={4}>
                                      <Grid size={{xs:12,sm:6}}>
                                          <Typography color="text.secondary" variant="caption">
                                              Category
                                          </Typography>
                                          <Typography variant="body1">
                                              {lead.selectedCategory}
                                          </Typography>
                                      </Grid>
                                      <Grid size={{xs:12,sm:6}}>
                                          <Typography color="text.secondary" variant="caption">
                                              Type
                                          </Typography>
                                          <Typography variant="body1">
                                              {lead.designType} - {lead.designItemType}
                                          </Typography>
                                      </Grid>
                                      <Grid size={{xs:12,sm:6}}>
                                          <Typography color="text.secondary" variant="caption">
                                              Location
                                          </Typography>
                                          <Typography variant="body1">
                                              {lead.emirate}
                                          </Typography>
                                      </Grid>
                                      <Grid size={{xs:12,sm:6}}>
                                          <Typography color="text.secondary" variant="caption">
                                              Value
                                          </Typography>
                                          <Typography variant="body1">
                                              AED {lead.price}
                                          </Typography>
                                      </Grid>
                                  </Grid>
                              </InfoCard>

                              <InfoCard title="Contact Information" icon={BsPerson}>
                                  <Grid container spacing={4}>
                                      <Grid size={{xs:12,sm:6}}>
                                          <Typography color="text.secondary" variant="caption">
                                              Client Phone
                                          </Typography>
                                          <Typography variant="body1">
                                              {lead.client.phone}
                                          </Typography>
                                      </Grid>
                                      <Grid size={{xs:12,sm:6}}>
                                          <Typography color="text.secondary" variant="caption">
                                              Assigned To
                                          </Typography>
                                          <Typography variant="body1">
                                              {lead.user.name}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                              {lead.user.email}
                                          </Typography>
                                      </Grid>
                                  </Grid>
                              </InfoCard>
                          </Stack>
                      </TabPanel>

                      <TabPanel value={activeTab} index={1}>
                          <Stack spacing={3}>
                              {canScheduleNewCall ? (
                                    <Button
                                          variant="contained"
                                          startIcon={<BsPlus size={20} />}
                                          onClick={() => setShowNewCall(true)}
                                          sx={{ alignSelf: 'flex-start' }}
                                    >
                                        Schedule New Call
                                    </Button>
                              ) : (
                                    <Alert
                                          severity="info"
                                          sx={{
                                              borderRadius: 2,
                                              '& .MuiAlert-message': { color: theme.palette.info.dark }
                                          }}
                                    >
                                        Complete the in-progress call before scheduling a new one
                                    </Alert>
                              )}

                              <Stack spacing={2}>
                                  {lead.callReminders.map((call) => (
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
                                                <Stack
                                                      direction="row"
                                                      justifyContent="space-between"
                                                      alignItems="flex-start"
                                                >
                                                    <Stack spacing={1}>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <BsCalendar size={16} color={theme.palette.primary.main} />
                                                            <Typography variant="subtitle2">
                                                                {new Date(call.time).toLocaleString()}
                                                            </Typography>
                                                        </Stack>
                                                        <Typography color="text.secondary">
                                                            {call.reminderReason}
                                                        </Typography>
                                                    </Stack>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Chip
                                                              size="small"
                                                              icon={call.status === 'DONE' ?
                                                                    <BsCheckCircle size={14} /> :
                                                                    <BsClock size={14} />
                                                              }
                                                              label={call.status.replace(/_/g, " ")}
                                                              sx={{
                                                                  bgcolor: getStatusBgColor(call.status),
                                                                  color: theme.palette.getContrastText(getStatusBgColor(call.status)),
                                                                  fontWeight: 500
                                                              }}
                                                        />
                                                        {call.status === 'IN_PROGRESS' && (
                                                              <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<BsChatDots size={14} />}
                                                                    onClick={() => {
                                                                        setSelectedCall(call);
                                                                        setShowCallResult(true);
                                                                    }}
                                                              >
                                                                  Update Result
                                                              </Button>
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
                                                              {call.callResult}
                                                          </Typography>
                                                      </Box>
                                                )}
                                            </Stack>
                                        </Paper>
                                  ))}
                              </Stack>
                          </Stack>
                      </TabPanel>

                      <TabPanel value={activeTab} index={2}>
                          <Stack spacing={2}>
                              {/* Add New Note Section */}
                              <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        backgroundColor: theme.palette.background.paper,
                                    }}
                              >
                                  <Stack direction="row" spacing={2} alignItems="center">

                                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                          {lead.user.name[0]}
                                      </Avatar>
                                      <TextField
                                            label="Add a new note"
                                            variant="outlined"
                                            fullWidth
                                            multiline
                                            rows={2}
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAddNote();
                                                }
                                            }}
                                            placeholder="Write your note here..."
                                      />
                                      <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<BsPlus size={16} />}
                                            onClick={handleAddNote}
                                            disabled={!newNote.trim()}
                                      >
                                          Add
                                      </Button>
                                  </Stack>
                              </Paper>

                              {/* Existing Notes */}
                              <Stack spacing={2}>
                                  {lead.notes.map((note) => (
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
                                                        {note.user.name} • {new Date(note.createdAt).toLocaleString()}
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        </Paper>
                                  ))}
                              </Stack>
                          </Stack>
                      </TabPanel>
                  </DialogContent>

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
              </Dialog>

              <CallResultDialog
                    open={showCallResult}
                    onClose={() => setShowCallResult(false)}
                    onSubmit={(result) => handleCallResult(selectedCall?.id, result)}
              />

              <NewCallDialog
                    open={showNewCall}
                    onClose={() => setShowNewCall(false)}
                    onSubmit={handleNewCall}
              />
          </>
    );
};

export default PreviewDialog;

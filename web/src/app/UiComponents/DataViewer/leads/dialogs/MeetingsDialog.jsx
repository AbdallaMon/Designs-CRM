"use client";
import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { BsPlus } from "react-icons/bs";

import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";

import dayjs from "dayjs";

import {
  FormControl,
  InputLabel,
  Box,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import utc from "dayjs/plugin/utc";
import { meetingTypes } from "@/app/helpers/constants";
import { getData } from "@/app/helpers/functions/getData";
import { OpenButton } from "./OpenButton";

dayjs.extend(utc);

export const NewMeetingDialog = ({
  lead,
  setleads,
  type = "button",
  children,
  setMeetingReminders,
}) => {
  const [meetingData, setMeetingData] = useState({
    time: "",
    reminderReason: "",
    type: "",
    isAdmin: false,
    adminId: null,
  });
  const [open, setOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const { user } = useAuth();
  const { setLoading } = useToastContext();

  // Function to load admin users
  const loadAdminUsers = async () => {
    const response = await getData({
      url: "shared/utilities/users/admins",
      setLoading: setLoadingAdmins,
    });

    if (response.status === 200) {
      setAdminUsers(response.data);
    }
  };

  function handleOpen() {
    setOpen(true);
    loadAdminUsers(); // Load admins when dialog opens
  }

  const reminderName = "Meeting";

  function onClose() {
    setMeetingData({
      time: "",
      reminderReason: "",
      type: "",
      isAdmin: false,
      adminId: null,
    });
    setOpen(false);
  }

  const handleAddNewCall = async () => {
    const requestData = {
      reminderReason: meetingData.reminderReason,
      time: dayjs(meetingData.time).utc().toISOString(),
      userId: user.id,
      type: meetingData.type,
      isAdmin: meetingData.isAdmin,
      ...(meetingData.isAdmin &&
        meetingData.adminId && { adminId: meetingData.adminId }),
    };

    const request = await handleRequestSubmit(
      requestData,
      setLoading,
      `shared/client-leads/${lead.id}/meeting-reminders`,
      false,
      "Creating"
    );

    if (request.status === 200) {
      if (setMeetingReminders) {
        setMeetingReminders((oldCalls) => [
          request.data.newReminder,
          ...oldCalls,
        ]);
      }
      if (setleads) {
        setleads((oldLeads) =>
          oldLeads.map((l) => {
            if (l.id === lead.id) {
              l.meetingReminders = request.data.latestTwo;
            }
            return l;
          })
        );
      }
      setMeetingData({
        time: "",
        reminderReason: "",
        type: "",
        isAdmin: false,
        adminId: null,
      });
      setOpen(false);
    }
  };

  const handleMeetingDataChange = (field, value) => {
    setMeetingData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "isAdmin" && !value && { adminId: null }),
    }));
  };

  return (
    <>
      {type === "button" ? (
        <Button
          onClick={handleOpen}
          variant="contained"
          startIcon={<BsPlus size={20} />}
          sx={{
            alignSelf: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            py: 1.5,
            boxShadow: 2,
            "&:hover": {
              boxShadow: 4,
            },
          }}
        >
          Schedule New {reminderName}
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}

      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 24,
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            background: (theme) => theme.palette.grey[50],
            fontWeight: 700,
            fontSize: "1.5rem",
            py: 3,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <BsPlus size={24} />
            Schedule New {reminderName}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Paper elevation={0} sx={{ p: 4 }}>
            <Stack spacing={4}>
              {/* Meeting Type Section */}
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  Meeting Details
                </Typography>
                <Stack spacing={3}>
                  <FormControl fullWidth>
                    <InputLabel id="meeting-type-label">
                      Meeting Type *
                    </InputLabel>
                    <Select
                      labelId="meeting-type-label"
                      value={meetingData.type}
                      label="Meeting Type *"
                      onChange={(e) =>
                        handleMeetingDataChange("type", e.target.value)
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      {meetingTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    type="datetime-local"
                    label={`${reminderName} Time`}
                    value={meetingData.time}
                    onChange={(e) =>
                      handleMeetingDataChange("time", e.target.value)
                    }
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <TextField
                    label="Reminder Reason"
                    value={meetingData.reminderReason}
                    onChange={(e) =>
                      handleMeetingDataChange("reminderReason", e.target.value)
                    }
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Enter the purpose or agenda for this meeting..."
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Stack>
              </Box>

              <Divider />

              {/* Admin Assignment Section */}
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  Assignment
                </Typography>
                <Stack spacing={3}>
                  <FormControl fullWidth>
                    <InputLabel id="admin-schedule-label">
                      Schedule for an Admin?
                    </InputLabel>
                    <Select
                      labelId="admin-schedule-label"
                      value={meetingData.isAdmin}
                      label="Schedule for an Admin?"
                      onChange={(e) =>
                        handleMeetingDataChange("isAdmin", e.target.value)
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value={false}>
                        No - Schedule for myself
                      </MenuItem>
                      <MenuItem value={true}>
                        Yes - Schedule for an admin
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {meetingData.isAdmin && (
                    <FormControl fullWidth>
                      <InputLabel id="admin-select-label">
                        Select Admin *
                      </InputLabel>
                      <Select
                        labelId="admin-select-label"
                        value={meetingData.adminId || ""}
                        label="Select Admin *"
                        onChange={(e) =>
                          handleMeetingDataChange("adminId", e.target.value)
                        }
                        disabled={loadingAdmins}
                        sx={{ borderRadius: 2 }}
                      >
                        {loadingAdmins ? (
                          <MenuItem disabled>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CircularProgress size={16} />
                              Loading admins...
                            </Box>
                          </MenuItem>
                        ) : (
                          adminUsers.map((admin) => (
                            <MenuItem key={admin.id} value={admin.id}>
                              <Box>
                                <Typography variant="body1">
                                  {admin.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {admin.email}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            borderTop: 1,
            borderColor: "divider",
            background: (theme) => theme.palette.grey[50],
            gap: 2,
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddNewCall}
            variant="contained"
            color="primary"
            disabled={
              !meetingData.time ||
              !meetingData.type ||
              (meetingData.isAdmin && !meetingData.adminId)
            }
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              py: 1,
              boxShadow: 2,
              "&:hover": {
                boxShadow: 4,
              },
            }}
          >
            Schedule {reminderName}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
export const NewClientMeetingDialog = ({
  lead,
  setleads,
  type = "button",
  children,
  setMeetingReminders,
}) => {
  const [meetingData, setMeetingData] = useState({
    isAdmin: false,
    adminId: null,
  });
  const [open, setOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const { user } = useAuth();
  const { setLoading } = useToastContext();

  // Function to load admin users
  const loadAdminUsers = async () => {
    const response = await getData({
      url: "shared/utilities/users/admins",
      setLoading: setLoadingAdmins,
    });

    if (response.status === 200) {
      setAdminUsers(response.data);
    }
  };

  function handleOpen() {
    setOpen(true);
    loadAdminUsers(); // Load admins when dialog opens
  }

  function onClose() {
    setMeetingData({
      isAdmin: false,
      adminId: null,
    });
    setOpen(false);
  }

  const handleAddNewCall = async () => {
    const requestData = {
      userId: user.id,
      isAdmin: meetingData.isAdmin,
      ...(meetingData.isAdmin &&
        meetingData.adminId && { adminId: meetingData.adminId }),
    };

    const request = await handleRequestSubmit(
      requestData,
      setLoading,
      `shared/client-leads/${lead.id}/meeting-reminders/token`,
      false,
      "Creating"
    );

    if (request.status === 200) {
      if (setMeetingReminders) {
        setMeetingReminders((oldCalls) => [
          request.data.newReminder,
          ...oldCalls,
        ]);
      }
      if (setleads) {
        setleads((oldLeads) =>
          oldLeads.map((l) => {
            if (l.id === lead.id) {
              l.meetingReminders = request.data.latestTwo;
            }
            return l;
          })
        );
      }
      setMeetingData({
        isAdmin: false,
        adminId: null,
      });
      setOpen(false);
    }
  };

  const handleMeetingDataChange = (field, value) => {
    setMeetingData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "isAdmin" && !value && { adminId: null }),
    }));
  };

  return (
    <>
      {type === "button" ? (
        <Button
          onClick={handleOpen}
          variant="contained"
          startIcon={<BsPlus size={20} />}
          sx={{
            alignSelf: "flex-start",
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            py: 1.5,
            boxShadow: 2,
            "&:hover": {
              boxShadow: 4,
            },
          }}
        >
          Generate client appointment link
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}

      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 24,
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            background: (theme) => theme.palette.grey[50],
            fontWeight: 700,
            fontSize: "1.5rem",
            py: 3,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <BsPlus size={24} />
            Client appointment link
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Paper elevation={0} sx={{ p: 4 }}>
            <Stack spacing={4}>
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  Assignment
                </Typography>
                <Stack spacing={3}>
                  <FormControl fullWidth>
                    <InputLabel id="admin-schedule-label">
                      Schedule for an Admin?
                    </InputLabel>
                    <Select
                      labelId="admin-schedule-label"
                      value={meetingData.isAdmin}
                      label="Schedule for an Admin?"
                      onChange={(e) =>
                        handleMeetingDataChange("isAdmin", e.target.value)
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value={false}>
                        No - Schedule for myself
                      </MenuItem>
                      <MenuItem value={true}>
                        Yes - Schedule for an admin
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {meetingData.isAdmin && (
                    <FormControl fullWidth>
                      <InputLabel id="admin-select-label">
                        Select Admin *
                      </InputLabel>
                      <Select
                        labelId="admin-select-label"
                        value={meetingData.adminId || ""}
                        label="Select Admin *"
                        onChange={(e) =>
                          handleMeetingDataChange("adminId", e.target.value)
                        }
                        disabled={loadingAdmins}
                        sx={{ borderRadius: 2 }}
                      >
                        {loadingAdmins ? (
                          <MenuItem disabled>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CircularProgress size={16} />
                              Loading admins...
                            </Box>
                          </MenuItem>
                        ) : (
                          adminUsers.map((admin) => (
                            <MenuItem key={admin.id} value={admin.id}>
                              <Box>
                                <Typography variant="body1">
                                  {admin.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {admin.email}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            borderTop: 1,
            borderColor: "divider",
            background: (theme) => theme.palette.grey[50],
            gap: 2,
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddNewCall}
            variant="contained"
            color="primary"
            disabled={meetingData.isAdmin && !meetingData.adminId}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              py: 1,
              boxShadow: 2,
              "&:hover": {
                boxShadow: 4,
              },
            }}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

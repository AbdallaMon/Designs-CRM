"use client";
import React, { useState } from "react";
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
} from "@mui/material";
import { BsPlus } from "react-icons/bs";

import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";

import {
  FormControl,
  InputLabel,
  Box,
  Typography,
  CircularProgress,
  alpha,
  useTheme,
} from "@mui/material";
import { RiLink } from "react-icons/ri";
import { getData } from "@/app/helpers/functions/getData";
import { OpenButton } from "@/features/leads/dialogs/OpenButton.jsx";

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
  const theme = useTheme();

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
            py: 2.5,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
                fontSize: 22,
              }}
            >
              <RiLink />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                Client appointment link
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Generate a link for the client to book a slot
              </Typography>
            </Box>
          </Stack>
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

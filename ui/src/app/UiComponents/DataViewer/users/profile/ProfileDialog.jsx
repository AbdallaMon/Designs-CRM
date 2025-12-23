"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
  Checkbox,
  IconButton,
  Paper,
  Chip,
  Fade,
} from "@mui/material";
import { FaTimes, FaEdit, FaCheck, FaGoogle } from "react-icons/fa";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// ✅ your project utils
import UploadImageWithAvatarPreview from "@/app/UiComponents/formComponents/UploadImageWithAvatarPreview";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { getData } from "@/app/helpers/functions/getData";

export default function ProfileDialog({ open, onClose, userId }) {
  const { loading, setLoading } = useToastContext();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [profile, setProfile] = useState(null);

  // editable fields
  const [name, setName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [allowNotification, setAllowNotification] = useState(true);
  const [allowEmailing, setAllowEmailing] = useState(true);

  // UI state
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  // small inline alerts (not big snackbar)
  const [inlineSuccess, setInlineSuccess] = useState("");
  const [inlineError, setInlineError] = useState("");

  const [googleLoading, setGoogleLoading] = useState(false);

  const isGoogleConnected = useMemo(() => {
    return Boolean(profile?.googleEmail || profile?.googleConnected);
  }, [profile]);

  const resetInline = useCallback(() => {
    setInlineSuccess("");
    setInlineError("");
  }, []);

  const refetchProfile = useCallback(async () => {
    if (!userId) return;

    resetInline();

    const req = await getData({
      setLoading,
      url: `shared/users/${userId}/profile`,
    });

    if (req?.status === 200) {
      const user = req?.data?.user || req?.data || null;

      setProfile(user);
      setName(user?.name || "");
      setProfilePicture(user?.profilePicture || "");
      setAllowNotification(user?.allowNotification ?? true);
      setAllowEmailing(user?.allowEmailing ?? true);
      return;
    }

    setInlineError(req?.data?.message || "Failed to load profile.");
  }, [userId, setLoading, resetInline]);

  // open => fetch
  useEffect(() => {
    if (!open) return;
    refetchProfile();
    setIsEditingAvatar(false);
  }, [open, refetchProfile]);

  // ✅ listen to success/error coming from google callback
  useEffect(() => {
    if (!open) return;

    const google = searchParams?.get("google");
    const googleMsg = searchParams?.get("googleMsg");

    if (!google) return;

    if (google === "success") {
      setInlineSuccess(googleMsg || "Google connected successfully.");
      refetchProfile();
    }

    if (google === "error") {
      setInlineError(
        googleMsg || "Google connection failed. Please try again."
      );
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete("google");
    next.delete("googleMsg");
    router.replace(
      `${pathname}${next.toString() ? `?${next.toString()}` : ""}`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onUploadChange = useCallback((key, value) => {
    console.log(key, value, "on upload change profile dialog");
    if (key === "profilePicture") setProfilePicture(value);
  }, []);

  const onSave = useCallback(async () => {
    if (!userId) return;

    resetInline();

    const req = await handleRequestSubmit(
      {
        name: name?.trim(),
        profilePicture: profilePicture || null,
        allowNotification,
        allowEmailing,
      },
      setLoading,
      `shared/users/${userId}/profile`,
      false,
      "Saving profile",
      false,
      "PUT"
    );

    if (req?.status === 200) {
      setInlineSuccess("Profile updated successfully.");
      setIsEditingAvatar(false);
      refetchProfile();
      return;
    }

    setInlineError(req?.data?.message || "Failed to update profile.");
  }, [
    userId,
    name,
    profilePicture,
    allowNotification,
    allowEmailing,
    setLoading,
    refetchProfile,
    resetInline,
  ]);

  const onGoogleConnect = useCallback(async () => {
    if (!userId) return;

    resetInline();
    setGoogleLoading(true);

    const req = await handleRequestSubmit(
      {},
      setLoading,
      `shared/users/${userId}/google/connect`,
      false,
      "Connecting Google",
      false,
      "POST"
    );

    if (req?.status === 200 && req?.data?.redirectUrl) {
      window.location.href = req.data.redirectUrl;
      return;
    }

    if (req?.status === 200) {
      setInlineSuccess("Google connected.");
      refetchProfile();
    } else {
      setInlineError(req?.data?.message || "Failed to connect Google.");
    }

    setGoogleLoading(false);
  }, [userId, setLoading, refetchProfile, resetInline]);

  const onGoogleDisconnect = useCallback(async () => {
    if (!userId) return;

    resetInline();
    setGoogleLoading(true);

    const req = await handleRequestSubmit(
      {},
      setLoading,
      `shared/users/${userId}/google/disconnect`,
      false,
      "Disconnecting Google",
      false,
      "POST"
    );

    if (req?.status === 200) {
      setInlineSuccess("Google disconnected.");
      refetchProfile();
    } else {
      setInlineError(req?.data?.message || "Failed to disconnect Google.");
    }

    setGoogleLoading(false);
  }, [userId, setLoading, refetchProfile, resetInline]);

  const headerRight = (
    <IconButton onClick={onClose} size="small">
      <FaTimes />
    </IconButton>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          pb: 2,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Profile Settings
        </Typography>
        {headerRight}
      </DialogTitle>

      <DialogContent dividers sx={{ px: 3, py: 3 }}>
        <Stack spacing={3}>
          {/* Inline alerts */}
          <Fade in={Boolean(inlineSuccess || inlineError)}>
            <Box>
              {inlineSuccess ? (
                <Alert severity="success" onClose={resetInline}>
                  {inlineSuccess}
                </Alert>
              ) : null}
              {inlineError ? (
                <Alert severity="error" onClose={resetInline}>
                  {inlineError}
                </Alert>
              ) : null}
            </Box>
          </Fade>

          {!profile && loading ? (
            <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Profile Header Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)"
                      : "linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack spacing={2.5}>
                  {/* Avatar section */}
                  <Stack direction="row" spacing={2.5} alignItems="center">
                    <Box sx={{ position: "relative" }}>
                      <Avatar
                        src={profilePicture || profile?.profilePicture || ""}
                        sx={{
                          width: 80,
                          height: 80,
                          border: "3px solid",
                          borderColor: "background.paper",
                          boxShadow: 2,
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                        sx={{
                          position: "absolute",
                          bottom: -4,
                          right: -4,
                          bgcolor: "primary.main",
                          color: "white",
                          width: 32,
                          height: 32,
                          "&:hover": {
                            bgcolor: "primary.dark",
                          },
                          boxShadow: 2,
                        }}
                      >
                        {isEditingAvatar ? (
                          <FaCheck size={14} />
                        ) : (
                          <FaEdit size={14} />
                        )}
                      </IconButton>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ mb: 0.5 }}
                      >
                        {profile?.name || "—"}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {profile?.email || "—"}
                      </Typography>
                      <Chip
                        label={profile?.role || "—"}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Stack>

                  {/* Upload component - only show when editing */}
                  {isEditingAvatar && (
                    <Fade in={isEditingAvatar}>
                      <Box>
                        <UploadImageWithAvatarPreview
                          value={profilePicture}
                          onChange={onUploadChange}
                          keyId={"profilePicture"}
                          label={"Profile picture"}
                          hide={true}
                        />
                      </Box>
                    </Fade>
                  )}
                </Stack>
              </Paper>

              {/* Basic Information */}
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
                >
                  Basic Information
                </Typography>

                <TextField
                  label="Display Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  variant="outlined"
                  placeholder="Enter your name"
                />
              </Box>

              <Divider />

              {/* Preferences */}
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  Preferences
                </Typography>

                <Stack spacing={1.5}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1.5,
                      transition: "all 0.2s",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(33, 150, 243, 0.05)"
                            : "rgba(33, 150, 243, 0.02)",
                      },
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={allowNotification}
                          onChange={(e) =>
                            setAllowNotification(e.target.checked)
                          }
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            Push Notifications
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Receive notifications about updates and activities
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1.5,
                      transition: "all 0.2s",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(33, 150, 243, 0.05)"
                            : "rgba(33, 150, 243, 0.02)",
                      },
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={allowEmailing}
                          onChange={(e) => setAllowEmailing(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            Email Notifications
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Receive email updates and newsletters
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>
                </Stack>
              </Box>

              <Divider />

              {/* Google Calendar Integration */}
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  Calendar Integration
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    border: "1px solid",
                    borderColor: isGoogleConnected ? "success.main" : "divider",
                    borderRadius: 2,
                    bgcolor: isGoogleConnected
                      ? (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(76, 175, 80, 0.08)"
                            : "rgba(76, 175, 80, 0.04)"
                      : "transparent",
                  }}
                >
                  <Stack spacing={2}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: isGoogleConnected
                              ? "success.main"
                              : "action.hover",
                          }}
                        >
                          <FaGoogle
                            size={20}
                            color={isGoogleConnected ? "white" : "gray"}
                          />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            Google Calendar
                          </Typography>
                          {isGoogleConnected ? (
                            <Typography
                              variant="caption"
                              color="success.main"
                              fontWeight={600}
                            >
                              {profile?.googleEmail || "Connected"}
                            </Typography>
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Not connected
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {isGoogleConnected ? (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={onGoogleDisconnect}
                          disabled={googleLoading}
                          startIcon={
                            googleLoading ? (
                              <CircularProgress size={16} />
                            ) : null
                          }
                        >
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={onGoogleConnect}
                          disabled={googleLoading}
                          startIcon={
                            googleLoading ? (
                              <CircularProgress size={16} />
                            ) : (
                              <FaGoogle size={14} />
                            )
                          }
                        >
                          Connect
                        </Button>
                      )}
                    </Stack>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      Sync your calendar events and meetings with Google
                      Calendar
                    </Typography>
                  </Stack>
                </Paper>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" size="large">
          Cancel
        </Button>

        <Button
          onClick={onSave}
          variant="contained"
          size="large"
          disabled={loading || !profile}
          startIcon={loading ? <CircularProgress size={18} /> : null}
          sx={{ minWidth: 140 }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

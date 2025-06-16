"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid2 as Grid,
  Chip,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Checkbox,
  Divider,
  Stack,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  FaImage,
  FaPlus,
  FaNoteSticky,
  FaLink,
  FaCopy,
  FaUser,
  FaCalendar,
  FaPalette,
  FaHome,
  FaFileImage,
  FaTimes,
} from "react-icons/fa";
import { getData } from "@/app/helpers/functions/getData";
import { useAlertContext } from "@/app/providers/MuiAlert";
import dayjs from "dayjs";
import { NotesComponent } from "../utility/Notes";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import FullScreenLoader from "../../feedback/loaders/FullscreenLoader";
import { useAuth } from "@/app/providers/AuthProvider";
import DeleteModal from "../../models/DeleteModal";
import ConfirmWithActionModel from "../../models/ConfirmsWithActionModel";

const ClientImageSessionManager = ({ clientLeadId }) => {
  const { user } = useAuth();
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false);
  const [newSessionDialogOpen, setNewSessionDialogOpen] = useState(false);
  const [selectedSpaces, setSelectedSpaces] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setAlertError } = useAlertContext();
  const { setLoading: setToastLoading } = useToastContext();
  const [copiedToken, setCopiedToken] = useState(null);
  const [openConrimGenerateLink, setconfirmGenerateLink] = useState(false);
  async function fetchData() {
    const [imageSessionRequst, spacesRequest] = await Promise.all([
      getData({
        url: `shared/image-session/${clientLeadId}/sessions?`,
        setLoading,
      }),
      getData({ url: "shared/image-session?model=space&", setLoading }),
    ]);
    if (imageSessionRequst.status === 200 && spacesRequest.status === 200) {
      setSessions(imageSessionRequst.data);
      setSpaces(spacesRequest.data);
    }
  }
  useEffect(() => {
    if (sessionsDialogOpen) {
      fetchData();
    }
  }, [sessionsDialogOpen]);

  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 50);
  };

  const handleRegenerateLink = async (sessionId) => {
    const regenerateRequest = await handleRequestSubmit(
      {},
      setToastLoading,
      `shared/image-session/${clientLeadId}/sessions/${sessionId}/re-generate`,
      false,
      "Regenerating",
      false,
      "PUT"
    );
    if (regenerateRequest.status === 200) {
      setSessions((old) =>
        old.map((s) => {
          if (s.id == sessionId) {
            return { ...s, token: regenerateRequest.data.token };
          } else {
            return s;
          }
        })
      );
      return regenerateRequest;
    }
  };

  const handleSpaceToggle = (spaceId) => {
    setSelectedSpaces((prev) =>
      prev.includes(spaceId)
        ? prev.filter((id) => id !== spaceId)
        : [...prev, spaceId]
    );
  };

  const handleCreateSession = async () => {
    if (selectedSpaces.length === 0) {
      setAlertError("Please select at least one space");
      return;
    }
    const createRequest = await handleRequestSubmit(
      { spaces: selectedSpaces },
      setToastLoading,
      `shared/image-session/${clientLeadId}/sessions`,
      false,
      "Creating"
    );
    if (createRequest.status === 200) {
      setSelectedSpaces([]);
      setNewSessionDialogOpen(false);
      fetchData();
    }
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format("DD/MM/YYYY");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return "warning";
      case "COMPLETED":
        return "success";
      default:
        return "default";
    }
  };
  if (
    user.role !== "ADMIN" &&
    user.role !== "SUPER_ADMIN" &&
    user.role !== "STAFF"
  )
    return;

  return (
    <Box>
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          startIcon={<FaFileImage />}
          onClick={() => setSessionsDialogOpen(true)}
        >
          View Sessions
        </Button>
      </Stack>
      <Dialog
        open={sessionsDialogOpen}
        onClose={() => setSessionsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" gap={1} justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <FaFileImage />
              Client Image Sessions
            </Box>
            <Button
              variant="outlined"
              startIcon={<FaPlus />}
              onClick={() => setNewSessionDialogOpen(true)}
              color="primary"
            >
              Create New Session
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading && <FullScreenLoader />}
          {sessions.length === 0 ? (
            <Alert severity="info">No sessions found</Alert>
          ) : (
            <Grid container spacing={3}>
              {sessions.map((session) => {
                const origin = window.location.origin;
                const url = `${origin}/image-session?token=${session.token}`;
                return (
                  <Grid key={session.id}>
                    <Card elevation={2}>
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          mb={2}
                        >
                          <Box display="flex" gap={1.5}>
                            <Typography variant="h6" component="div">
                              Session
                            </Typography>
                            <NotesComponent
                              idKey={"imageSessionId"}
                              id={session.id}
                              slug="shared"
                              showAddNotes={false}
                            />
                          </Box>{" "}
                          <Box display="flex" gap={1.5} alignItems="center">
                            {session.sessionStatus === "IN_PROGRESS" && (
                              <DeleteModal
                                buttonType="ICON"
                                href={`shared/image-session/${clientLeadId}/sessions`}
                                item={session}
                                setData={setSessions}
                              />
                            )}
                            <Chip
                              label={session.sessionStatus.replace("_", " ")}
                              color={getStatusColor(session.sessionStatus)}
                              size="small"
                            />{" "}
                          </Box>
                        </Box>

                        <Grid container spacing={2}>
                          {/* Session Info */}
                          <Grid size={{ md: 6 }}>
                            <Box mb={2}>
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                mb={1}
                              >
                                <FaUser size={14} />
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Created by:{" "}
                                  {session.createdBy?.name || "Unknown"}
                                </Typography>
                              </Box>
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                mb={1}
                              >
                                <FaCalendar size={14} />
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Created: {formatDate(session.createdAt)}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Token Section */}
                            <Box mb={2}>
                              <Typography variant="subtitle2" gutterBottom>
                                Session url
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "monospace",
                                    backgroundColor: "#f5f5f5",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    flex: 1,
                                  }}
                                >
                                  {url}
                                </Typography>
                                <Tooltip title={"Copy Token"}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyToken(url)}
                                    color={
                                      copiedToken === url
                                        ? "success"
                                        : "default"
                                    }
                                  >
                                    <FaCopy />
                                  </IconButton>
                                </Tooltip>
                                {session.sessionStatus === "IN_PROGRESS" && (
                                  <>
                                    <ConfirmWithActionModel
                                      title={
                                        "Are you sure u want to regenerate new link?"
                                      }
                                      description="This action will delete the old link while keeping the data and just generate new link"
                                      handleConfirm={async () => {
                                        return await handleRegenerateLink(
                                          session.id
                                        );
                                      }}
                                      label="Regenerate link"
                                      isDelete={true}
                                      removeAfterConfirm={true}
                                    />
                                  </>
                                )}
                              </Box>
                            </Box>

                            {session.pdfUrl ? (
                              <Box mb={2}>
                                <Typography variant="subtitle2" gutterBottom>
                                  PDF Report
                                </Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  href={session.pdfUrl}
                                  target="_blank"
                                  startIcon={<FaLink />}
                                >
                                  View PDF
                                </Button>
                              </Box>
                            ) : (
                              <Alert severity="error">
                                Client didnt approve the session yet
                              </Alert>
                            )}
                          </Grid>

                          <Grid size={{ md: 6 }}>
                            {/* Selected Spaces */}
                            <Box mb={2}>
                              <Typography variant="subtitle2" gutterBottom>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <FaHome size={14} />
                                  Selected Spaces
                                </Box>
                              </Typography>
                              <Box display="flex" flexWrap="wrap" gap={1}>
                                {session.selectedSpaces.map((spaceSession) => (
                                  <Chip
                                    key={spaceSession.id}
                                    label={spaceSession.space.name}
                                    size="medium"
                                    variant="outlined"
                                    avatar={
                                      <Avatar
                                        src={spaceSession.space.avatarUrl}
                                        sx={{ width: 40, height: 40 }}
                                      >
                                        {spaceSession.space.name
                                          .charAt(0)
                                          .toUpperCase()}
                                      </Avatar>
                                    }
                                  />
                                ))}
                              </Box>
                            </Box>

                            {session.preferredPatterns.length > 0 && (
                              <Box mb={2}>
                                <Typography variant="subtitle2" gutterBottom>
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                  >
                                    <FaPalette size={14} />
                                    Preferred Patterns
                                  </Box>
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={1}>
                                  {session.preferredPatterns.map((pattern) => (
                                    <Chip
                                      key={pattern.id}
                                      label={pattern.name}
                                      size="medium"
                                      color="secondary"
                                      variant="outlined"
                                      avatar={
                                        <Avatar
                                          src={pattern.avatarUrl}
                                          sx={{ width: 40, height: 40 }}
                                        >
                                          {pattern.name.charAt(0).toUpperCase()}
                                        </Avatar>
                                      }
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              <Box display="flex" alignItems="center" gap={1}>
                                <FaImage size={14} />
                                Selected Images ({session.selectedImages.length}
                                )
                              </Box>
                            </Typography>
                            <Grid container spacing={2}>
                              {session.selectedImages.map((selectedImage) => (
                                <Grid
                                  size={{ xs: 6, sm: 4, md: 3 }}
                                  key={selectedImage.id}
                                >
                                  <Card variant="outlined">
                                    <CardMedia
                                      component="img"
                                      height="120"
                                      image={selectedImage.image.url}
                                      alt="Selected image"
                                    />
                                    <CardContent sx={{ padding: 1 }}>
                                      <NotesComponent
                                        id={selectedImage.id}
                                        idKey="selectedImageId"
                                        slug="shared"
                                        showAddNotes={false}
                                      />
                                    </CardContent>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={newSessionDialogOpen}
        onClose={() => setNewSessionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <FaPlus />
            Create New Session
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select spaces for the new client image session. You must select at
            least one space.
          </Typography>

          <List>
            {spaces?.map((space) => (
              <ListItem key={space.id} disablePadding>
                <ListItemButton
                  onClick={() => handleSpaceToggle(space.id)}
                  dense
                >
                  <Checkbox
                    edge="start"
                    checked={selectedSpaces.includes(space.id)}
                    tabIndex={-1}
                    disableRipple
                  />
                  <ListItemAvatar>
                    <Avatar>
                      <FaHome />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={space.name}
                    secondary={`Space ID: ${space.id}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          {selectedSpaces.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Spaces ({selectedSpaces.length}):
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {selectedSpaces.map((spaceId) => {
                  const space = spaces.find((s) => s.id === spaceId);
                  return (
                    <Chip
                      key={spaceId}
                      label={space?.name}
                      onDelete={() => handleSpaceToggle(spaceId)}
                      deleteIcon={<FaTimes />}
                      color="primary"
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          {selectedSpaces.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Please select at least one space to create a session.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setNewSessionDialogOpen(false);
              setSelectedSpaces([]);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSession}
            disabled={selectedSpaces.length === 0}
            startIcon={<FaPlus />}
          >
            Create Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientImageSessionManager;

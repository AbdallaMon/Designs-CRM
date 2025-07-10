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
  Stack,
  Alert,
  Tooltip,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from "@mui/material";
import {
  FaImage,
  FaPlus,
  FaLink,
  FaCopy,
  FaUser,
  FaCalendar,
  FaPalette,
  FaHome,
  FaFileImage,
  FaTimes,
  FaCheckCircle,
  FaEye,
  FaFilePdf,
  FaPaperPlane,
  FaPlay,
  FaObjectGroup,
} from "react-icons/fa";
import { getData } from "@/app/helpers/functions/getData";
import { useAlertContext } from "@/app/providers/MuiAlert";
import dayjs from "dayjs";
import { NotesComponent } from "../../utility/Notes";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import FullScreenLoader from "../../../feedback/loaders/FullscreenLoader";
import { useAuth } from "@/app/providers/AuthProvider";
import DeleteModal from "../../../models/DeleteModal";
import ConfirmWithActionModel from "../../../models/ConfirmsWithActionModel";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { checkIfAdmin } from "@/app/helpers/functions/utility";

const ClientImageSessionManager = ({ clientLeadId }) => {
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false);
  const [newSessionDialogOpen, setNewSessionDialogOpen] = useState(false);
  const [selectedSpaces, setSelectedSpaces] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setAlertError } = useAlertContext();
  const { setLoading: setToastLoading } = useToastContext();
  const [copiedToken, setCopiedToken] = useState(null);
  // Enhanced status configuration
  const getStatusConfig = (status) => {
    const configs = {
      INITIAL: {
        label: "Initial Setup",
        color: "default",
        icon: <FaPlay />,
        progress: 5,
        description: "Session created, ready to start",
        variant: "outlined",
      },
      PREVIEW_COLOR_PATTERN: {
        label: "Previewing Colors",
        color: "info",
        icon: <FaEye />,
        progress: 15,
        description: "Client is viewing color patterns",
        variant: "filled",
      },
      SELECTED_COLOR_PATTERN: {
        label: "Colors Selected",
        color: "success",
        icon: <FaCheckCircle />,
        progress: 25,
        description: "Color pattern has been selected",
        variant: "filled",
      },
      PREVIEW_MATERIAL: {
        label: "Previewing Materials",
        color: "info",
        icon: <FaEye />,
        progress: 35,
        description: "Client is viewing materials",
        variant: "filled",
      },
      SELECTED_MATERIAL: {
        label: "Material Selected",
        color: "success",
        icon: <FaCheckCircle />,
        progress: 45,
        description: "Material has been selected",
        variant: "filled",
      },
      PREVIEW_STYLE: {
        label: "Previewing Styles",
        color: "info",
        icon: <FaEye />,
        progress: 55,
        description: "Client is viewing styles",
        variant: "filled",
      },
      SELECTED_STYLE: {
        label: "Style Selected",
        color: "success",
        icon: <FaCheckCircle />,
        progress: 65,
        description: "Style has been selected",
        variant: "filled",
      },
      PREVIEW_IMAGES: {
        label: "Previewing Images",
        color: "info",
        icon: <FaEye />,
        progress: 75,
        description: "Client is viewing image options",
        variant: "filled",
      },
      SELECTED_IMAGES: {
        label: "Images Selected",
        color: "success",
        icon: <FaCheckCircle />,
        progress: 85,
        description: "Images have been selected",
        variant: "filled",
      },
      PDF_GENERATED: {
        label: "PDF generation",
        color: "success",
        icon: <FaFilePdf />,
        progress: 95,
        description: "PDF report in progress",
        variant: "filled",
      },
      SUBMITTED: {
        label: "Submitted",
        color: "success",
        icon: <FaPaperPlane />,
        progress: 100,
        description: "Session completed and submitted",
        variant: "filled",
      },
    };
    return configs[status] || configs.INITIAL;
  };

  const getStepperSteps = () => [
    { key: "INITIAL", label: "Setup" },
    { key: "PREVIEW_COLOR_PATTERN", label: "Color Pattern" },
    { key: "SELECTED_COLOR_PATTERN", label: "Color Confirmed" },
    { key: "PREVIEW_MATERIAL", label: "Material" },
    { key: "SELECTED_MATERIAL", label: "Material Confirmed" },
    { key: "PREVIEW_STYLE", label: "Style" },
    { key: "SELECTED_STYLE", label: "Style Confirmed" },
    { key: "PREVIEW_IMAGES", label: "Images" },
    { key: "SELECTED_IMAGES", label: "Images Confirmed" },
    { key: "PDF_GENERATED", label: "PDF Ready" },
    { key: "SUBMITTED", label: "Complete" },
  ];

  const getCurrentStepIndex = (status) => {
    const steps = getStepperSteps();
    return steps.findIndex((step) => step.key === status);
  };

  async function fetchData() {
    await getDataAndSet({
      url: `shared/image-session/${clientLeadId}/sessions?`,
      setLoading,
      setData: setSessions,
    });
    await getDataAndSet({
      url: `shared/ids?where=${JSON.stringify({
        isArchived: false,
      })}&model=space&select=id,title&isLanguage=true&`,
      setLoading,
      setData: setSpaces,
    });
  }
  useEffect(() => {
    if (sessionsDialogOpen) {
      fetchData();
    }
  }, [sessionsDialogOpen]);

  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
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
    return dayjs(dateString).format("DD/MM/YYYY HH:mm");
  };

  const renderPDFSection = (session) => {
    const statusConfig = getStatusConfig(session.sessionStatus);

    if (session.sessionStatus === "PDF_GENERATED" && session.pdfUrl) {
      return (
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            PDF Report
          </Typography>
          <Button
            size="small"
            variant="contained"
            color="success"
            href={session.pdfUrl}
            target="_blank"
            startIcon={<FaFilePdf />}
          >
            Download PDF Report
          </Button>
        </Box>
      );
    }

    if (session.sessionStatus === "SUBMITTED" && session.pdfUrl) {
      return (
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            PDF Report
          </Typography>
          <Button
            size="small"
            variant="contained"
            color="success"
            href={session.pdfUrl}
            target="_blank"
            startIcon={<FaFilePdf />}
          >
            Download PDF Report
          </Button>
        </Box>
      );
    }

    // Handle cases where PDF should be generated but isn't available
    if (["SELECTED_IMAGES", "PDF_GENERATED"].includes(session.sessionStatus)) {
      if (session.error) {
        return (
          <Box mb={2}>
            <Alert severity="error" sx={{ mb: 1 }}>
              Something went wrong with PDF generation. Please try regenerating
              it.
            </Alert>
            <ConfirmWithActionModel
              label="Regenerate PDF"
              title="Regenerate PDF Report"
              description="This will attempt to regenerate the PDF report for this session."
              removeAfterConfirm={true}
              handleConfirm={async () => {
                const request = await handleRequestSubmit(
                  {
                    sessionData: session,
                    signatureUrl: session.signature,
                  },
                  setToastLoading,
                  `client/image-session/generate-pdf`,
                  false,
                  "Generating PDF"
                );
                if (request.status === 200) {
                  setSessions((oldSessions) =>
                    oldSessions.map((s) => {
                      if (s.id === session.id) {
                        return { ...s, error: false };
                      }
                      return s;
                    })
                  );
                  return request;
                }
              }}
            />
          </Box>
        );
      }

      return (
        <Box mb={2}>
          <Alert severity="info">
            PDF is being generated. You will receive an email notification once
            it&lsquo;s ready.
          </Alert>
        </Box>
      );
    }

    // For earlier stages, show appropriate message
    if (
      [
        "INITIAL",
        "PREVIEW_COLOR_PATTERN",
        "SELECTED_COLOR_PATTERN",
        "PREVIEW_MATERIAL",
        "SELECTED_MATERIAL",
        "PREVIEW_STYLE",
        "SELECTED_STYLE",
        "PREVIEW_IMAGES",
      ].includes(session.sessionStatus)
    ) {
      return (
        <Box mb={2}>
          <Alert severity="info">
            Session is in progress. PDF will be generated once all selections
            are completed.
          </Alert>
        </Box>
      );
    }

    return null;
  };

  if (
    user.role !== "ADMIN" &&
    user.role !== "SUPER_ADMIN" &&
    user.role !== "STAFF"
  )
    return null;

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
        maxWidth="xl"
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
                const statusConfig = getStatusConfig(session.sessionStatus);
                const currentStepIndex = getCurrentStepIndex(
                  session.sessionStatus
                );
                const steps = getStepperSteps();

                return (
                  <Grid key={session.id} size={12}>
                    <Card elevation={3} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          mb={3}
                        >
                          <Box display="flex" gap={1.5} alignItems="center">
                            <Typography variant="h6" component="div">
                              Session #{session.id}
                            </Typography>
                            <NotesComponent
                              idKey={"imageSessionId"}
                              id={session.id}
                              slug="shared"
                              showAddNotes={false}
                            />
                          </Box>

                          <Box display="flex" gap={1.5} alignItems="center">
                            {(isAdmin ||
                              !["PDF_GENERATED", "SUBMITTED"].includes(
                                session.sessionStatus
                              )) && (
                              <DeleteModal
                                buttonType="ICON"
                                href={`shared/image-session/${clientLeadId}/sessions`}
                                item={session}
                                setData={setSessions}
                              />
                            )}
                            <Chip
                              label={statusConfig.label}
                              color={statusConfig.color}
                              variant={statusConfig.variant}
                              icon={statusConfig.icon}
                              size="medium"
                            />
                          </Box>
                        </Box>

                        {/* Progress Bar */}
                        <Box mb={3}>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Progress: {statusConfig.description}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {statusConfig.progress}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={statusConfig.progress}
                            sx={{ height: 6, borderRadius: 3 }}
                            color={statusConfig.color}
                          />
                        </Box>

                        {/* Mini Stepper for completed sessions */}
                        {session.sessionStatus === "SUBMITTED" && (
                          <Box mb={3}>
                            <Typography variant="subtitle2" gutterBottom>
                              Session Timeline
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              {steps.map((step, index) => (
                                <Chip
                                  key={step.key}
                                  label={step.label}
                                  size="small"
                                  color={
                                    index <= currentStepIndex
                                      ? "success"
                                      : "default"
                                  }
                                  variant={
                                    index <= currentStepIndex
                                      ? "filled"
                                      : "outlined"
                                  }
                                  icon={
                                    index <= currentStepIndex ? (
                                      <FaCheckCircle />
                                    ) : undefined
                                  }
                                />
                              ))}
                            </Box>
                          </Box>
                        )}

                        <Grid container spacing={3}>
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
                                Session URL
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "monospace",
                                    backgroundColor: "#f8f9fa",
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    flex: 1,
                                    border: "1px solid #e9ecef",
                                  }}
                                >
                                  {url}
                                </Typography>
                                <Tooltip
                                  title={
                                    copiedToken === url ? "Copied!" : "Copy URL"
                                  }
                                >
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
                                <ConfirmWithActionModel
                                  title="Regenerate Session Link"
                                  description="This will generate a new link for this session. The old link will no longer work, but all session data will be preserved."
                                  handleConfirm={async () => {
                                    return await handleRegenerateLink(
                                      session.id
                                    );
                                  }}
                                  label="Regenerate"
                                  isDelete={false}
                                  removeAfterConfirm={true}
                                />
                              </Box>
                            </Box>

                            {/* PDF Section */}
                            {renderPDFSection(session)}
                          </Grid>

                          <Grid size={{ md: 6 }}>
                            {/* Selected Spaces */}
                            <Box mb={2}>
                              <Typography variant="subtitle2" gutterBottom>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <FaHome size={14} />
                                  Selected Spaces (
                                  {session.selectedSpaces.length})
                                </Box>
                              </Typography>
                              <Box display="flex" flexWrap="wrap" gap={1}>
                                {session.selectedSpaces.map((spaceSession) => (
                                  <Chip
                                    key={spaceSession.space.id}
                                    label={`#${spaceSession.space.id} - ${
                                      spaceSession.space?.title.find(
                                        (t) => t.language.code === "ar"
                                      ).text
                                    }`}
                                    size="medium"
                                    variant="outlined"
                                    color="primary"
                                  />
                                ))}
                              </Box>
                            </Box>

                            {/* Custom Colors */}
                            {session.colorPattern && (
                              <Box mb={2}>
                                <Typography variant="subtitle2" gutterBottom>
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                  >
                                    <FaPalette size={14} />
                                    Color Pattern{" "}
                                    {
                                      session.colorPattern.title.find(
                                        (t) => t.language.code === "ar"
                                      ).text
                                    }
                                  </Box>
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={1}>
                                  {session.colorPattern.colors.map(
                                    (color, index) => (
                                      <Chip
                                        key={color.id}
                                        label={color.colorHex}
                                        size="medium"
                                        variant="outlined"
                                        sx={{ mr: 1, mb: 1 }}
                                        avatar={
                                          <Box
                                            sx={{
                                              width: 18,
                                              height: 18,
                                              borderRadius: "50%",
                                              backgroundColor: color.colorHex,
                                              border: "2px solid #fff",
                                              boxShadow:
                                                "0 0 0 1px rgba(0,0,0,0.1)",
                                            }}
                                          />
                                        }
                                      />
                                    )
                                  )}
                                </Box>
                              </Box>
                            )}

                            {session.customColors &&
                              session.customColors.length > 0 && (
                                <Box mb={2}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      gap={1}
                                    >
                                      <FaPalette size={14} />
                                      Client Colors (
                                      {session.customColors.length})
                                    </Box>
                                  </Typography>
                                  <Box display="flex" flexWrap="wrap" gap={1}>
                                    {session.customColors.map(
                                      (color, index) => (
                                        <Chip
                                          key={color + index}
                                          label={color}
                                          size="medium"
                                          variant="outlined"
                                          sx={{ mr: 1, mb: 1 }}
                                          avatar={
                                            <Box
                                              sx={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: "50%",
                                                backgroundColor: color,
                                                border: "2px solid #fff",
                                                boxShadow:
                                                  "0 0 0 1px rgba(0,0,0,0.1)",
                                              }}
                                            />
                                          }
                                        />
                                      )
                                    )}
                                  </Box>
                                </Box>
                              )}

                            {/* Material and Style */}

                            <Box mb={2}>
                              <Typography variant="subtitle2" gutterBottom>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <FaObjectGroup size={14} />
                                  Selected Materials ({session.materials.length}
                                  )
                                </Box>
                              </Typography>
                              <Box display="flex" flexWrap="wrap" gap={1}>
                                {session.materials.map((materialSession) => (
                                  <Chip
                                    key={materialSession.material.id}
                                    label={`#${materialSession.material.id} - ${
                                      materialSession.material?.title.find(
                                        (t) => t.language.code === "ar"
                                      ).text
                                    }`}
                                    size="medium"
                                    variant="outlined"
                                    color="primary"
                                  />
                                ))}
                              </Box>
                            </Box>
                          </Grid>

                          {/* Selected Images */}
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              <Box display="flex" alignItems="center" gap={1}>
                                <FaImage size={14} />
                                Selected Images ({session.selectedImages.length}
                                )
                              </Box>
                            </Typography>
                            {session.selectedImages.length > 0 ? (
                              <Grid container spacing={2}>
                                {session.selectedImages.map((selectedImage) => (
                                  <Grid
                                    size={{ xs: 6, sm: 4, md: 3 }}
                                    key={selectedImage.id}
                                  >
                                    <Card
                                      variant="outlined"
                                      sx={{ height: "100%" }}
                                    >
                                      <CardMedia
                                        component="img"
                                        height="140"
                                        image={
                                          selectedImage.designImage.imageUrl
                                        }
                                        alt="Selected design image"
                                        sx={{ objectFit: "cover" }}
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
                            ) : (
                              <Alert severity="info">
                                No images selected yet
                              </Alert>
                            )}
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

      {/* Create New Session Dialog */}
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
                    primary={
                      space?.title.find((t) => t.language.code === "ar").text
                    }
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
                      label={`#${space?.id} - ${
                        space?.title.find((t) => t.language.code === "ar").text
                      }`}
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

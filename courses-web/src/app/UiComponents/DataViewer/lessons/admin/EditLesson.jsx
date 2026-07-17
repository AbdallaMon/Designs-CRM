"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  Stack,
  Avatar,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiVideo,
  FiFile,
  FiLink,
  FiUpload,
  FiChevronDown,
  FiArrowLeft,
  FiExternalLink,
  FiDownload,
  FiPlay,
  FiGlobe,
} from "react-icons/fi";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import LessonVideoPdfManager from "./PdfsForVideo";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";

// Enhanced Edit Lesson Info Component
const EditLessonInfo = ({ courseId, lessonId }) => {
  const theme = useTheme();
  const [lesson, setLesson] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    order: 1,
    isPreviewable: false,
  });
  const { toastLoading, setToastLoading } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  async function getLessonData() {
    const req = await getDataAndSet({
      url: `admin/courses/${courseId}/lessons/${lessonId}`,
      setData: setLesson,
      setLoading,
    });
    console.log(req, "req");
    if (req.status === 200) {
      const lesson = req.data;
      setFormData({
        title: lesson.title || "",
        description: lesson.description || "",
        duration: lesson.duration || "",
        order: lesson.order || 1,
        isPreviewable: lesson.isPreviewable || false,
      });
      setHasLoaded(true);
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const req = await handleRequestSubmit(
      formData,
      setToastLoading,
      `admin/courses/${courseId}/lessons/${lessonId}`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (req.status === 200) {
      await getLessonData();
    }
  };

  const handleAccordionChange = (event, isExpanded) => {
    if (isExpanded && !hasLoaded) {
      getLessonData();
    }
  };

  return (
    <Accordion
      onChange={handleAccordionChange}
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: theme.shadows[1],
        "&:before": {
          display: "none",
        },
        "&.Mui-expanded": {
          margin: 0,
        },
      }}
    >
      <AccordionSummary
        expandIcon={<FiChevronDown />}
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          borderRadius: "8px 8px 0 0",
          minHeight: 64,
          "&.Mui-expanded": {
            minHeight: 64,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.dark }}>
            <FiEdit2 />
          </Avatar>
          <Typography variant="h6" fontWeight="medium">
            Lesson Information
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ position: "relative", p: 3 }}>
        {loading && <LoadingOverlay />}
        {!hasLoaded && !loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={120} />
          </Stack>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ md: 6 }}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                variant="outlined"
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid size={{ md: 3 }}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  handleInputChange("duration", parseInt(e.target.value) || "")
                }
                variant="outlined"
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid size={{ md: 3 }}>
              <TextField
                fullWidth
                label="Order"
                type="number"
                value={formData.order}
                onChange={(e) =>
                  handleInputChange("order", parseInt(e.target.value) || 1)
                }
                variant="outlined"
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid size={10}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                variant="outlined"
                multiline
                rows={4}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid size={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPreviewable}
                    onChange={(e) =>
                      handleInputChange("isPreviewable", e.target.checked)
                    }
                    color="primary"
                  />
                }
                label="Allow Preview"
                sx={{ ml: 0 }}
              />
            </Grid>

            <Grid>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={<FiSave />}
                size="large"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  px: 4,
                  py: 1.5,
                }}
              >
                {loading ? "Updating..." : "Update Lesson Info"}
              </Button>
            </Grid>
          </Grid>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

// Enhanced Videos Section Component
const VideosSection = ({ courseId, lessonId }) => {
  const theme = useTheme();
  const [videoList, setVideoList] = useState([]);
  const [newVideo, setNewVideo] = useState({
    url: "",
    videoType: "IFRAME",
    order: 1,
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const { toastLoading, setToastLoading } = useToastContext();

  async function getVideos() {
    await getDataAndSet({
      url: `admin/courses/${courseId}/lessons/${lessonId}/videos`,
      setLoading,
      setData: setVideoList,
    });
    setHasLoaded(true);
  }

  const handleAccordionChange = (event, isExpanded) => {
    if (isExpanded && !hasLoaded) {
      getVideos();
    }
  };

  const handleAddVideo = async () => {
    if (newVideo.url.trim()) {
      const req = await handleRequestSubmit(
        newVideo,
        setToastLoading,
        `admin/courses/${courseId}/lessons/${lessonId}/videos`,
        false,
        "Creating"
      );
      if (req.status === 200) {
        setNewVideo({ url: "", videoType: "IFRAME", order: 1 });
        await getVideos();
      }
    }
  };

  const handleDeleteVideo = async (id) => {
    const req = await handleRequestSubmit(
      {},
      setToastLoading,
      `admin/courses/${courseId}/lessons/${lessonId}/videos/${id}`,
      false,
      "Deleting",
      false,
      "DELETE"
    );
    if (req.status === 200) {
      await getVideos();
    }
  };

  const handleEditVideo = (id) => {
    const video = videoList.find((v) => v.id === id);
    setEditingId(id);
    setEditData(video);
  };

  const handleUpdateVideo = async () => {
    const req = await handleRequestSubmit(
      editData,
      setToastLoading,
      `admin/courses/${courseId}/lessons/${lessonId}/videos/${editingId}`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (req.status === 200) {
      setEditingId(null);
      await getVideos();
      setEditData({});
    }
  };

  return (
    <Accordion
      onChange={handleAccordionChange}
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: theme.shadows[1],
        "&:before": {
          display: "none",
        },
        "&.Mui-expanded": {
          margin: 0,
        },
        position: "relative",
      }}
    >
      <AccordionSummary
        expandIcon={<FiChevronDown />}
        sx={{
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
          borderRadius: "8px 8px 0 0",
          minHeight: 64,
          "&.Mui-expanded": {
            minHeight: 64,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.secondary.dark }}>
            <FiVideo />
          </Avatar>
          <Typography variant="h6" fontWeight="medium">
            Videos ({hasLoaded ? videoList.length : "..."})
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ position: "relative", p: 3 }}>
        {loading && <LoadingOverlay />}
        {!hasLoaded && !loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={80} />
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={60} />
          </Stack>
        ) : (
          <>
            <Paper
              sx={{
                p: 3,
                mb: 3,
                backgroundColor: theme.palette.grey[50],
                borderRadius: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                gutterBottom
                fontWeight="medium"
                color="primary"
              >
                Add New Video
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ md: 6 }}>
                  <TextField
                    fullWidth
                    label="Video URL"
                    value={newVideo.url}
                    onChange={(e) =>
                      setNewVideo((prev) => ({ ...prev, url: e.target.value }))
                    }
                    variant="outlined"
                    size="medium"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ md: 6 }}>
                  <FormControl fullWidth size="medium">
                    <InputLabel>Video Type</InputLabel>
                    <Select
                      value={newVideo.videoType}
                      onChange={(e) =>
                        setNewVideo((prev) => ({
                          ...prev,
                          videoType: e.target.value,
                        }))
                      }
                      label="Video Type"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="IFRAME">Iframe</MenuItem>
                      <MenuItem value="URL">Direct URL</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ md: 6 }}>
                  <TextField
                    fullWidth
                    label="Order"
                    type="number"
                    value={newVideo.order}
                    onChange={(e) =>
                      setNewVideo((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value) || 1,
                      }))
                    }
                    variant="outlined"
                    size="medium"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ md: 12 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAddVideo}
                    startIcon={<FiPlus />}
                    disabled={!newVideo.url.trim()}
                    size="large"
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      py: 1.5,
                    }}
                  >
                    Add Video
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            <List sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
              {videoList.map((video, index) => (
                <React.Fragment key={video.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      "&:hover": {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    {editingId === video.id ? (
                      <Box sx={{ width: "100%" }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ md: 6 }}>
                            <TextField
                              fullWidth
                              label="Video URL"
                              value={editData.url || ""}
                              onChange={(e) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  url: e.target.value,
                                }))
                              }
                              size="medium"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                },
                              }}
                            />
                          </Grid>
                          <Grid size={{ md: 6 }}>
                            <FormControl fullWidth size="medium">
                              <InputLabel>Video Type</InputLabel>
                              <Select
                                value={editData.videoType || "IFRAME"}
                                onChange={(e) =>
                                  setEditData((prev) => ({
                                    ...prev,
                                    videoType: e.target.value,
                                  }))
                                }
                                label="Video Type"
                                sx={{ borderRadius: 2 }}
                              >
                                <MenuItem value="IFRAME">Iframe</MenuItem>
                                <MenuItem value="URL">Direct URL</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ md: 6 }}>
                            <TextField
                              fullWidth
                              label="Order"
                              type="number"
                              value={editData.order || 1}
                              onChange={(e) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  order: parseInt(e.target.value) || 1,
                                }))
                              }
                              variant="outlined"
                              size="medium"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                },
                              }}
                            />
                          </Grid>
                          <Grid size={{ md: 6 }}>
                            <Stack direction="row" spacing={1}>
                              <Button
                                onClick={handleUpdateVideo}
                                variant="contained"
                                size="small"
                                sx={{ borderRadius: 2, textTransform: "none" }}
                              >
                                Save
                              </Button>
                              <Button
                                onClick={() => setEditingId(null)}
                                variant="outlined"
                                size="small"
                                sx={{ borderRadius: 2, textTransform: "none" }}
                              >
                                Cancel
                              </Button>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Box>
                    ) : (
                      <>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            flexGrow: 1,
                          }}
                        >
                          <Avatar
                            sx={{ bgcolor: theme.palette.secondary.light }}
                          >
                            <FiPlay />
                          </Avatar>
                          <ListItemText
                            primary={
                              <Button
                                noWrap
                                type="a"
                                href={video.url}
                                target="_blank"
                              >
                                {video.url}
                              </Button>
                            }
                            secondary={
                              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                <Chip
                                  label={video.videoType}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                <Chip
                                  label={`Order: ${video.order}`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                />
                                <LessonVideoPdfManager
                                  courseId={courseId}
                                  lessonId={lessonId}
                                  lessonVideoId={video.id}
                                />
                              </Box>
                            }
                          />
                        </Box>
                        <ListItemSecondaryAction>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Edit Video">
                              <IconButton
                                onClick={() => handleEditVideo(video.id)}
                                size="small"
                                color="primary"
                              >
                                <FiEdit2 />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Video">
                              <IconButton
                                onClick={() => handleDeleteVideo(video.id)}
                                size="small"
                                color="error"
                              >
                                <FiTrash2 />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </ListItemSecondaryAction>
                      </>
                    )}
                  </ListItem>
                  {index < videoList.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {videoList.length === 0 && (
                <ListItem sx={{ py: 4, textAlign: "center" }}>
                  <ListItemText
                    primary={
                      <Typography variant="body1" color="text.secondary">
                        No Videos added yet
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

// Enhanced Links Section Component
const LinksSection = ({ courseId, lessonId }) => {
  const theme = useTheme();
  const [linkList, setLinkList] = useState([]);
  const [newLink, setNewLink] = useState({ url: "", title: "", order: 1 });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { toastLoading, setToastLoading } = useToastContext();

  async function getLinks() {
    await getDataAndSet({
      url: `admin/courses/${courseId}/lessons/${lessonId}/links`,
      setLoading,
      setData: setLinkList,
    });
    setHasLoaded(true);
  }

  const handleAccordionChange = (event, isExpanded) => {
    if (isExpanded && !hasLoaded) {
      getLinks();
    }
  };

  const handleAddLink = async () => {
    if (newLink.url.trim() && newLink.title.trim()) {
      const req = await handleRequestSubmit(
        newLink,
        setToastLoading,
        `admin/courses/${courseId}/lessons/${lessonId}/links`,
        false,
        "Creating"
      );
      if (req.status === 200) {
        setNewLink({ url: "", title: "", order: 1 });
        await getLinks();
      }
    }
  };

  const handleDeleteLink = async (id) => {
    const req = await handleRequestSubmit(
      {},
      setToastLoading,
      `admin/courses/${courseId}/lessons/${lessonId}/links/${id}`,
      false,
      "Deleting",
      false,
      "DELETE"
    );
    if (req.status === 200) {
      await getLinks();
    }
  };

  const handleEditLink = (id) => {
    const link = linkList.find((l) => l.id === id);
    setEditingId(id);
    setEditData(link);
  };

  const handleUpdateLink = async () => {
    const req = await handleRequestSubmit(
      editData,
      setToastLoading,
      `admin/courses/${courseId}/lessons/${lessonId}/links/${editingId}`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (req.status === 200) {
      setEditingId(null);
      await getLinks();
      setEditData({});
    }
  };

  return (
    <Accordion
      onChange={handleAccordionChange}
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: theme.shadows[1],
        "&:before": {
          display: "none",
        },
        "&.Mui-expanded": {
          margin: 0,
        },
        position: "relative",
      }}
    >
      <AccordionSummary
        expandIcon={<FiChevronDown />}
        sx={{
          backgroundColor: theme.palette.info.main,
          color: theme.palette.info.contrastText,
          borderRadius: "8px 8px 0 0",
          minHeight: 64,
          "&.Mui-expanded": {
            minHeight: 64,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.info.dark }}>
            <FiLink />
          </Avatar>
          <Typography variant="h6" fontWeight="medium">
            Links & Resources ({hasLoaded ? linkList.length : "..."})
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ position: "relative", p: 3 }}>
        {loading && <LoadingOverlay />}
        {!hasLoaded && !loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={80} />
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={60} />
          </Stack>
        ) : (
          <>
            <Paper
              sx={{
                p: 3,
                mb: 3,
                backgroundColor: theme.palette.grey[50],
                borderRadius: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                gutterBottom
                fontWeight="medium"
                color="primary"
              >
                Add New Link
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ md: 6 }}>
                  <TextField
                    fullWidth
                    label="Link URL"
                    value={newLink.url}
                    onChange={(e) =>
                      setNewLink((prev) => ({ ...prev, url: e.target.value }))
                    }
                    variant="outlined"
                    size="medium"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ md: 6 }}>
                  <TextField
                    fullWidth
                    label="Link Title"
                    value={newLink.title}
                    onChange={(e) =>
                      setNewLink((prev) => ({ ...prev, title: e.target.value }))
                    }
                    variant="outlined"
                    size="medium"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ md: 6 }}>
                  <TextField
                    fullWidth
                    label="Order"
                    type="number"
                    value={newLink.order}
                    onChange={(e) =>
                      setNewLink((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value) || 1,
                      }))
                    }
                    variant="outlined"
                    size="medium"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ md: 6 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAddLink}
                    startIcon={<FiPlus />}
                    disabled={!newLink.url.trim() || !newLink.title.trim()}
                    size="large"
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      py: 1.5,
                    }}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            <List sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
              {linkList.map((link, index) => (
                <React.Fragment key={link.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      "&:hover": {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    {editingId === link.id ? (
                      <Box sx={{ width: "100%" }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ md: 6 }}>
                            <TextField
                              fullWidth
                              label="URL"
                              value={editData.url || ""}
                              onChange={(e) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  url: e.target.value,
                                }))
                              }
                              size="medium"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                },
                              }}
                            />
                          </Grid>
                          <Grid size={{ md: 6 }}>
                            <TextField
                              fullWidth
                              label="Title"
                              value={editData.title || ""}
                              onChange={(e) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                              size="medium"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                },
                              }}
                            />
                          </Grid>
                          <Grid size={{ md: 6 }}>
                            <TextField
                              fullWidth
                              label="Order"
                              type="number"
                              value={editData.order || 1}
                              onChange={(e) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  order: parseInt(e.target.value) || 1,
                                }))
                              }
                              variant="outlined"
                              size="medium"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                },
                              }}
                            />
                          </Grid>
                          <Grid size={{ md: 6 }}>
                            <Stack direction="row" spacing={1}>
                              <Button
                                onClick={handleUpdateLink}
                                variant="contained"
                                size="small"
                                sx={{ borderRadius: 2, textTransform: "none" }}
                              >
                                Save
                              </Button>
                              <Button
                                onClick={() => setEditingId(null)}
                                variant="outlined"
                                size="small"
                                sx={{ borderRadius: 2, textTransform: "none" }}
                              >
                                Cancel
                              </Button>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Box>
                    ) : (
                      <>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            flexGrow: 1,
                          }}
                        >
                          <Avatar sx={{ bgcolor: theme.palette.info.light }}>
                            <FiGlobe />
                          </Avatar>
                          <ListItemText
                            primary={
                              <Typography
                                variant="subtitle1"
                                fontWeight="medium"
                              >
                                {link.title}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Button
                                  color="text.secondary"
                                  sx={{ mb: 1 }}
                                  component="a"
                                  href={link.url}
                                  target="_blank"
                                >
                                  {link.url}
                                </Button>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <Chip
                                    label={`Order: ${link.order}`}
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                  />
                                </Box>
                              </Box>
                            }
                          />
                        </Box>
                        <ListItemSecondaryAction>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Open Link">
                              <IconButton
                                onClick={() => window.open(link.url, "_blank")}
                                size="small"
                                color="info"
                              >
                                <FiExternalLink />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Link">
                              <IconButton
                                onClick={() => handleEditLink(link.id)}
                                size="small"
                                color="primary"
                              >
                                <FiEdit2 />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Link">
                              <IconButton
                                onClick={() => handleDeleteLink(link.id)}
                                size="small"
                                color="error"
                              >
                                <FiTrash2 />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </ListItemSecondaryAction>
                      </>
                    )}
                  </ListItem>
                  {index < linkList.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {linkList.length === 0 && (
                <ListItem sx={{ py: 4, textAlign: "center" }}>
                  <ListItemText
                    primary={
                      <Typography variant="body1" color="text.secondary">
                        No links added yet
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

// Enhanced Main Component
export const LessonManagement = ({ lessonId, courseId }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 3,
        maxWidth: "1200px",
        mx: "auto",
        backgroundColor: theme.palette.grey[50],
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: "white",
          display: "flex",
          gap: 2,
          alignItems: "center",
        }}
      >
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Lesson Management
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Lesson #{lessonId} • Course #{courseId}
        </Typography>
        <Button
          href={`/dashboard/courses/${courseId}/lessons`}
          variant="outlined"
          sx={{
            color: "black",
            background: theme.palette.secondary.main,
          }}
        >
          Back to course lessons
        </Button>
      </Paper>

      <Stack spacing={3}>
        <EditLessonInfo lessonId={lessonId} courseId={courseId} />
        <VideosSection lessonId={lessonId} courseId={courseId} />
        <PDFsSection lessonId={lessonId} courseId={courseId} />
        <LinksSection lessonId={lessonId} courseId={courseId} />
      </Stack>
    </Box>
  );
};

// Enhanced PDFs Section Component
const PDFsSection = ({ courseId, lessonId }) => {
  const theme = useTheme();
  const [pdfList, setPdfList] = useState([]);
  const [newPdf, setNewPdf] = useState({ url: "", order: 1 });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { toastLoading, setToastLoading } = useToastContext();
  const { setProgress, setOverlay } = useUploadContext();

  async function getPdfs() {
    await getDataAndSet({
      url: `admin/courses/${courseId}/lessons/${lessonId}/pdfs`,
      setLoading,
      setData: setPdfList,
    });
    setHasLoaded(true);
  }

  const handleAccordionChange = (event, isExpanded) => {
    if (isExpanded && !hasLoaded) {
      getPdfs();
    }
  };

  const handleAddPdf = async () => {
    if (newPdf.url.trim()) {
      const req = await handleRequestSubmit(
        newPdf,
        setToastLoading,
        `admin/courses/${courseId}/lessons/${lessonId}/pdfs`,
        false,
        "Creating"
      );
      if (req.status === 200) {
        setNewPdf({ url: "", order: 1 });
        await getPdfs();
      }
    }
  };

  const handleDeletePdf = async (id) => {
    const req = await handleRequestSubmit(
      {},
      setToastLoading,
      `admin/courses/${courseId}/lessons/${lessonId}/pdfs/${id}`,
      false,
      "Deleting",
      false,
      "DELETE"
    );
    if (req.status === 200) {
      await getPdfs();
    }
  };

  const handleEditPdf = (id) => {
    const pdf = pdfList.find((p) => p.id === id);
    setEditingId(id);
    setEditData(pdf);
  };

  const handleUpdatePdf = async () => {
    const req = await handleRequestSubmit(
      editData,
      setToastLoading,
      `admin/courses/${courseId}/lessons/${lessonId}/pdfs/${editingId}`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (req.status === 200) {
      setEditingId(null);
      await getPdfs();
      setEditData({});
    }
  };
  async function handleUploadImage(file, type) {
    const fileUpload = await uploadInChunks(file, setProgress, setOverlay);

    if (type === "CREATE") {
      setNewPdf((old) => ({ ...old, url: fileUpload.url }));
    } else {
      setEditData({ ...old, url: fileUpload.url });
    }
  }
  return (
    <Accordion
      onChange={handleAccordionChange}
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: theme.shadows[1],
        "&:before": {
          display: "none",
        },
        "&.Mui-expanded": {
          margin: 0,
        },
        position: "relative",
      }}
    >
      <AccordionSummary
        expandIcon={<FiChevronDown />}
        sx={{
          backgroundColor: theme.palette.success.main,
          color: theme.palette.success.contrastText,
          borderRadius: "8px 8px 0 0",
          minHeight: 64,
          "&.Mui-expanded": {
            minHeight: 64,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.success.dark }}>
            <FiFile />
          </Avatar>
          <Typography variant="h6" fontWeight="medium">
            PDFs ({hasLoaded ? pdfList.length : "..."})
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ position: "relative", p: 3 }}>
        {loading && <LoadingOverlay />}
        {!hasLoaded && !loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={80} />
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={60} />
          </Stack>
        ) : (
          <>
            <Paper
              sx={{
                p: 3,
                mb: 3,
                backgroundColor: theme.palette.grey[50],
                borderRadius: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                gutterBottom
                fontWeight="medium"
                color="primary"
              >
                Add New PDF
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ md: 6 }}>
                  <TextField
                    fullWidth
                    label="PDF URL"
                    value={newPdf.url}
                    onChange={(e) =>
                      setNewPdf((prev) => ({ ...prev, url: e.target.value }))
                    }
                    variant="outlined"
                    size="medium"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                  <SimpleFileInput
                    id="file"
                    handleUpload={(file) => {
                      handleUploadImage(file, "CREATE");
                    }}
                  />
                </Grid>
                <Grid size={{ md: 6 }}>
                  <TextField
                    fullWidth
                    label="Order"
                    type="number"
                    value={newPdf.order}
                    onChange={(e) =>
                      setNewPdf((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value) || 1,
                      }))
                    }
                    variant="outlined"
                    size="medium"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ md: 6 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAddPdf}
                    startIcon={<FiPlus />}
                    disabled={!newPdf.url.trim()}
                    size="large"
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      py: 1.5,
                    }}
                  >
                    Add PDF
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            <List sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
              {pdfList.map((pdf, index) => (
                <React.Fragment key={pdf.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      "&:hover": {
                        bgcolor: theme.palette.action.hover,
                      },
                    }}
                  >
                    {editingId === pdf.id ? (
                      <Box sx={{ width: "100%" }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ md: 6 }}>
                            <TextField
                              fullWidth
                              label="PDF URL"
                              value={editData.url || ""}
                              onChange={(e) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  url: e.target.value,
                                }))
                              }
                              size="medium"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                },
                              }}
                            />
                            <SimpleFileInput
                              id="file"
                              handleUpload={(file) => {
                                handleUploadImage(file, "EDIT");
                              }}
                            />
                          </Grid>
                          <Grid size={{ md: 6 }}>
                            <TextField
                              fullWidth
                              label="Order"
                              type="number"
                              value={editData.order || 1}
                              onChange={(e) =>
                                setEditData((prev) => ({
                                  ...prev,
                                  order: parseInt(e.target.value) || 1,
                                }))
                              }
                              variant="outlined"
                              size="medium"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2,
                                },
                              }}
                            />
                          </Grid>
                          <Grid size={{ md: 6 }}>
                            <Stack direction="row" spacing={1}>
                              <Button
                                onClick={handleUpdatePdf}
                                variant="contained"
                                size="small"
                                sx={{ borderRadius: 2, textTransform: "none" }}
                              >
                                Save
                              </Button>
                              <Button
                                onClick={() => setEditingId(null)}
                                variant="outlined"
                                size="small"
                                sx={{ borderRadius: 2, textTransform: "none" }}
                              >
                                Cancel
                              </Button>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Box>
                    ) : (
                      <>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            flexGrow: 1,
                          }}
                        >
                          <Avatar sx={{ bgcolor: theme.palette.success.light }}>
                            <FiDownload />
                          </Avatar>
                          <ListItemText
                            primary={
                              <Button
                                noWrap
                                component="a"
                                href={pdf.url}
                                target="_blank"
                              >
                                {pdf.url}
                              </Button>
                            }
                            secondary={
                              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                <Chip
                                  label={`Order: ${pdf.order}`}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              </Box>
                            }
                          />
                        </Box>
                        <ListItemSecondaryAction>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Edit PDF">
                              <IconButton
                                onClick={() => handleEditPdf(pdf.id)}
                                size="small"
                                color="primary"
                              >
                                <FiEdit2 />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete PDF">
                              <IconButton
                                onClick={() => handleDeletePdf(pdf.id)}
                                size="small"
                                color="error"
                              >
                                <FiTrash2 />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </ListItemSecondaryAction>
                      </>
                    )}
                  </ListItem>
                  {index < pdfList.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {pdfList.length === 0 && (
                <ListItem sx={{ py: 4, textAlign: "center" }}>
                  <ListItemText
                    primary={
                      <Typography variant="body1" color="text.secondary">
                        No Pdf added yet
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

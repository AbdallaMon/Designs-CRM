"use client";
import React, { useState } from "react";
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
  FiVideo,
  FiChevronDown,
  FiPlay,
} from "react-icons/fi";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import LoadingOverlay from "@/shared/components/feedback/loaders/LoadingOverlay";
import LessonVideoPdfManager from "../../PdfsForVideo";

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
      url: `courses/${courseId}/lessons/${lessonId}/videos`,
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
        `courses/${courseId}/lessons/${lessonId}/videos`,
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
      `courses/${courseId}/lessons/${lessonId}/videos/${id}`,
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
      `courses/${courseId}/lessons/${lessonId}/videos/${editingId}`,
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

export default VideosSection;

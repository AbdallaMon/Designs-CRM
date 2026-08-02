"use client";
import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
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
  FiLink,
  FiChevronDown,
  FiExternalLink,
  FiGlobe,
} from "react-icons/fi";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import LoadingOverlay from "@/shared/components/feedback/loaders/LoadingOverlay";

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
      url: `courses/${courseId}/lessons/${lessonId}/links`,
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
        `courses/${courseId}/lessons/${lessonId}/links`,
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
      `courses/${courseId}/lessons/${lessonId}/links/${id}`,
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
      `courses/${courseId}/lessons/${lessonId}/links/${editingId}`,
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

export default LinksSection;

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
  FiFile,
  FiChevronDown,
  FiDownload,
} from "react-icons/fi";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import LoadingOverlay from "@/shared/components/feedback/loaders/LoadingOverlay";
import SimpleFileInput from "@/shared/components/formComponents/SimpleFileInput";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";

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
      url: `courses/${courseId}/lessons/${lessonId}/pdfs`,
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
        `courses/${courseId}/lessons/${lessonId}/pdfs`,
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
      `courses/${courseId}/lessons/${lessonId}/pdfs/${id}`,
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
      `courses/${courseId}/lessons/${lessonId}/pdfs/${editingId}`,
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
      setEditData((old) => ({ ...old, url: fileUpload.url }));
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

export default PDFsSection;

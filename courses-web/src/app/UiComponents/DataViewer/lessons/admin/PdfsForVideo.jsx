import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Box,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import DeleteModal from "@/app/models/DeleteModal";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { MdAdd, MdClose, MdDownload, MdPictureAsPdf } from "react-icons/md";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";

const LessonVideoPdfManager = ({ lessonId, courseId, lessonVideoId }) => {
  const [open, setOpen] = useState(false);
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [_, setFile] = useState();
  // Form states
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");
  const { setToastLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  const { setProgress, setOverlay } = useUploadContext();

  // Mock API functions - replace with your actual API calls
  const fetchPdfs = async () => {
    await getDataAndSet({
      url: `admin/courses/${courseId}/lessons/${lessonId}/videos/${lessonVideoId}/pdfs`,
      setLoading,
      setData: setPdfs,
    });
  };
  async function handleFileUpload(file) {
    const fileUpload = await uploadInChunks(file, setProgress, setOverlay);

    if (fileUpload.status === 200) {
      setPdfUrl(fileUpload.url);
    }
  }

  const handleOpen = () => {
    setOpen(true);
    fetchPdfs();
  };

  const handleClose = () => {
    setOpen(false);
    setError("");
    resetForm();
  };

  const resetForm = () => {
    setPdfTitle("");
    setPdfUrl("");
  };

  const handleAddPdf = async () => {
    if (!pdfTitle.trim()) {
      setAlertError("Please enter a title for the PDF");
      return;
    }
    if (!pdfUrl) {
      setAlertError("You must upload a pdf");
    }
    const req = await handleRequestSubmit(
      {
        title: pdfTitle,
        url: pdfUrl,
        lessonVideoId,
      },
      setToastLoading,
      `admin/courses/${courseId}/lessons/${lessonId}/videos/${lessonVideoId}/pdfs`
    );
    if (req.status === 200) {
      fetchPdfs();
      resetForm();
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<MdPictureAsPdf />}
        onClick={handleOpen}
        sx={{ mb: 2 }}
      >
        Manage PDFs
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">PDF Resources</Typography>
          <IconButton onClick={handleClose} size="small">
            <MdClose />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {/* Add New PDF Section */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
              Add New PDF
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              fullWidth
              label="PDF Title"
              value={pdfTitle}
              onChange={(e) => setPdfTitle(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            <Box>
              <SimpleFileInput
                id="file"
                setData={setFile}
                handleUpload={handleFileUpload}
                label="Upload a pdf"
                input={{ accept: "application/pdf" }}
              />
            </Box>

            <TextField
              fullWidth
              label="PDF URL"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="https://example.com/document.pdf"
              sx={{ mb: 2 }}
            />
            <Button
              onClick={handleAddPdf}
              variant="contained"
              startIcon={<MdAdd />}
              disabled={!pdfUrl && !pdfTitle.trim()}
            >
              Add pdf{" "}
            </Button>
          </Box>
          <Divider sx={{ my: 2 }} />

          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
              Current PDFs ({pdfs.length})
            </Typography>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress />
              </Box>
            ) : pdfs.length === 0 ? (
              <Alert severity="info">No PDFs found for this video</Alert>
            ) : (
              <List>
                {pdfs.map((pdf) => (
                  <ListItem
                    key={pdf.id}
                    sx={{ border: "1px solid #e0e0e0", mb: 1, borderRadius: 1 }}
                  >
                    <ListItemIcon>
                      <MdPictureAsPdf color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={pdf.title}
                      secondary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mt: 0.5,
                          }}
                        >
                          <Button
                            size="small"
                            startIcon={<MdDownload />}
                            href={pdf.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download
                          </Button>
                        </Box>
                      }
                    />
                    <DeleteModal
                      href={`admin/courses/${courseId}/lessons/${lessonId}/videos/${lessonVideoId}/pdfs`}
                      item={pdf}
                      handleClose={fetchPdfs}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LessonVideoPdfManager;

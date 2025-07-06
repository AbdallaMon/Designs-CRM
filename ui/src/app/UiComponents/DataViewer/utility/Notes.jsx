"use client";
import { getData } from "@/app/helpers/functions/getData";
import { Fragment, useEffect, useState } from "react";
import LoadingOverlay from "../../feedback/loaders/LoadingOverlay";
import {
  Box,
  Button,
  Link,
  List,
  ListItemText,
  Modal,
  TextField,
  Divider,
  Typography,
  Paper,
} from "@mui/material";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { simpleModalStyle } from "@/app/helpers/constants";
import SimpleFileInput from "../../formComponents/SimpleFileInput";
import { useAlertContext } from "@/app/providers/MuiAlert";
import {
  MdNoteAdd,
  MdAttachFile,
  MdStickyNote2,
  MdClose,
  MdAdd,
} from "react-icons/md";
import { useAuth } from "@/app/providers/AuthProvider";

export function NotesComponent({
  idKey,
  id,
  slug = "accountant",
  showAddNotes = true,
  mustAddFile = false,
  simpleButton,
  isOpen = false,
  onClose,
  text = "Notes & Attachments",
}) {
  const [openModal, setOpenModal] = useState(isOpen);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [content, setContent] = useState("");
  const [file, setFile] = useState();
  const { setLoading: setGlobalLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  const { user } = useAuth();
  useEffect(() => {
    if (isOpen) {
      setOpenModal(isOpen);
    }
  }, [isOpen]);
  // Fetch notes when modal opens
  async function fetchNotes() {
    setLoading(true);
    const data = await getData({
      url: `${slug}/notes?idKey=${idKey}&id=${id}&`,
      setLoading,
    });
    setNotes(data.data);
    setLoading(false);
  }

  useEffect(() => {
    if (openModal) {
      fetchNotes();
    }
  }, [openModal]);

  // Add note function
  async function addNote() {
    if (!content) {
      setAlertError("You must enter note or title");
      return;
    }
    if (!file && mustAddFile) {
      setAlertError("You must upload file");
      return;
    }

    const data = { idKey, id, content };

    if (file) {
      const formData = new FormData();
      formData.append("file", file.file);

      const uploadResponse = await handleRequestSubmit(
        formData,
        setGlobalLoading,
        slug === "client" ? "client/upload" : "utility/upload",
        true,
        "Uploading file"
      );

      if (uploadResponse.status !== 200) {
        setAlertError("Error uploading file");
        return;
      }

      data.attachment = uploadResponse.fileUrls.file[0];
    }

    const request = await handleRequestSubmit(
      data,
      setGlobalLoading,
      `${slug}/notes`,
      false,
      "Creating"
    );

    if (request.status === 200) {
      setContent("");
      setFile(undefined);
      setIsAddingNote(false);
      fetchNotes();
    }
  }

  function handleClose() {
    setOpenModal(false);
    if (onClose) {
      onClose();
    }
  }
  if (!openModal) {
    return (
      <Button
        onClick={() => setOpenModal(true)}
        variant={simpleButton ? "text" : "contained"}
        color="primary"
        size={simpleButton ? "small" : "medium"}
        startIcon={simpleButton ? null : <MdStickyNote2 size={20} />}
      >
        {text}
      </Button>
    );
  }
  return (
    <>
      <Modal
        open={openModal}
        onClose={handleClose}
        aria-labelledby="notes-modal-title"
        aria-describedby="notes-modal-description"
      >
        <Paper
          sx={{
            ...simpleModalStyle,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            p: { xs: 1.5, md: 2 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="h5"
              color="primary"
              component="h2"
              id="notes-modal-title"
            >
              Notes & Attachments
            </Typography>
            <Button
              onClick={handleClose}
              sx={{ minWidth: "auto", p: 1 }}
              color="inherit"
            >
              <MdClose size={20} />
            </Button>
          </Box>

          {/* Add note section - shown conditionally */}
          {showAddNotes && (
            <>
              {!isAddingNote ? (
                <Button
                  onClick={() => setIsAddingNote(true)}
                  variant="outlined"
                  color="primary"
                  startIcon={<MdAdd size={20} />}
                  sx={{ mb: 2, alignSelf: "flex-start" }}
                >
                  {mustAddFile ? "Add Attachment" : "Add Note or Attachment"}
                </Button>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    mb: 3,
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    Add New Note
                  </Typography>

                  <TextField
                    fullWidth
                    id="content"
                    label="Note"
                    multiline
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />

                  <SimpleFileInput
                    label="Attachment"
                    id="file"
                    variant="outlined"
                    setData={setFile}
                  />

                  <Box
                    sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}
                  >
                    <Button
                      onClick={() => {
                        setIsAddingNote(false);
                        setContent("");
                        setFile(undefined);
                      }}
                      variant="outlined"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={addNote}
                      variant="contained"
                      color="primary"
                      startIcon={<MdNoteAdd size={20} />}
                    >
                      Save Note
                    </Button>
                  </Box>
                </Box>
              )}
              <Divider sx={{ mb: 2 }} />
            </>
          )}

          {/* Notes list */}
          <Box sx={{ overflow: "auto", flexGrow: 1 }}>
            {loading ? (
              <LoadingOverlay />
            ) : notes.length > 0 ? (
              <List sx={{ p: 0 }}>
                {notes.map((note) => (
                  <Fragment key={note.id}>
                    <Paper
                      elevation={1}
                      sx={{
                        mb: 2,
                        p: 2,
                        borderLeft: "4px solid",
                        borderColor: "primary.main",
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ mb: 1, whiteSpace: "pre-wrap" }}
                      >
                        {note.content}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mt: 1,
                        }}
                      >
                        {user && slug !== "client" && (
                          <Typography variant="caption" color="text.secondary">
                            By: {note.user.name}
                          </Typography>
                        )}

                        {note.attachment && (
                          <Button
                            component={Link}
                            href={note.attachment}
                            target="_blank"
                            startIcon={<MdAttachFile size={18} />}
                            size="small"
                            variant="outlined"
                          >
                            View Attachment
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  </Fragment>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No notes or attachments found
              </Typography>
            )}
          </Box>
        </Paper>
      </Modal>
    </>
  );
}

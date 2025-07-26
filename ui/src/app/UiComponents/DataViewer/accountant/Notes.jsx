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
} from "@mui/material";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { simpleModalStyle } from "@/app/helpers/constants";
import SimpleFileInput from "../../formComponents/SimpleFileInput";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";

export function Notes({ idKey, id, slug = "accountant" }) {
  const [openModal, setOpenModal] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
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
  return (
    <>
      <Button
        onClick={() => setOpenModal(true)}
        variant="contained"
        color="primary"
      >
        View Notes and Attatchments
      </Button>
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={simpleModalStyle}>
          <h2 id="modal-modal-title">Notes and Attatchments</h2>
          <List id="modal-modal-description">
            {loading ? (
              <LoadingOverlay />
            ) : (
              notes?.map((note) => (
                <Fragment key={note.id}>
                  <ListItemText
                    key={note.id}
                    primary={note.content}
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        {note.user.name}
                        {note.attachment && (
                          <Button
                            component={Link}
                            href={note.attachment}
                            target="_blank"
                          >
                            View attachment
                          </Button>
                        )}
                      </Box>
                    }
                    sx={{ borderLeft: "2px solid ", pl: 2, mb: 2 }}
                  />
                </Fragment>
              ))
            )}
          </List>
        </Box>
      </Modal>
    </>
  );
}

export function AddNotes({
  idKey,
  id,
  mustAddFile = true,
  slug = "accountant",
}) {
  const [openModal, setOpenModal] = useState(false);
  const { setLoading } = useToastContext();
  const [content, setContent] = useState("");
  const [file, setFile] = useState();
  const { setAlertError } = useAlertContext();
  const { setProgress, setOverlay } = useUploadContext();

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
      const uploadResponse = await uploadInChunks(
        file,
        setProgress,
        setOverlay
      );
      if (uploadResponse.status === 200) {
        data.attachment = fileUpload.url;
      }
    }
    const request = await handleRequestSubmit(
      data,
      setLoading,
      `${slug}/notes`,
      false,
      "Creating"
    );
    if (request.status === 200) {
      setOpenModal(false);
    }
  }
  return (
    <>
      <Button
        onClick={() => setOpenModal(true)}
        variant="contained"
        color="primary"
        mt={-1}
      >
        {mustAddFile ? "Add attachment" : "Add note or attachment"}
      </Button>
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={simpleModalStyle}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h2 id="modal-modal-title">Add note</h2>
            <Box id="modal-modal-description">
              <TextField
                width="100%"
                fullWidth
                id="content"
                label="Note"
                multiline
                rows={4}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                }}
              />
              <Box mt={2} />
              <SimpleFileInput
                label="File"
                id="file"
                variant="outlined"
                setData={setFile}
              />
            </Box>
            <Button onClick={addNote} variant="contained" color="primary">
              Add note
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

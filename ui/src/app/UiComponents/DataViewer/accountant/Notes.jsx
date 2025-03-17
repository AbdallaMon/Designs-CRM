import { getData } from "@/app/helpers/functions/getData";
import { Fragment, useEffect, useState } from "react";
import LoadingOverlay from "../../feedback/loaders/LoadingOverlay";
import {
  Box,
  Button,
  List,
  ListItemText,
  Modal,
  TextField,
} from "@mui/material";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { simpleModalStyle } from "@/app/helpers/constants";

export function Notes({ idKey, id }) {
  const [openModal, setOpenModal] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  console.log(notes, "notes");
  async function fetchNotes() {
    setLoading(true);
    const data = await getData({
      url: `accountant/notes?idKey=${idKey}&id=${id}&`,
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
        View notes
      </Button>
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={simpleModalStyle}>
          <h2 id="modal-modal-title">Notes</h2>
          <List id="modal-modal-description">
            {loading ? (
              <LoadingOverlay />
            ) : (
              notes?.map((note) => (
                <Fragment key={note.id}>
                  <ListItemText
                    key={note.id}
                    primary={note.content}
                    secondary={note.user.name}
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

export function AddNotes({ idKey, id }) {
  const [openModal, setOpenModal] = useState(false);
  const { setLoading } = useToastContext();
  const [content, setContent] = useState("");
  async function addNote() {
    if (!content) {
      return;
    }
    const request = await handleRequestSubmit(
      { idKey, id, content },
      setLoading,
      `accountant/notes`,
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
        variant="outlined"
        color="primary"
      >
        Add note
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
                label="Content"
                multiline
                rows={4}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                }}
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

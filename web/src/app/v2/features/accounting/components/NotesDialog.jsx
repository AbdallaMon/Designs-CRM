"use client";

// Notes + attachments dialog — the v2 port of the legacy accountant Notes/AddNotes
// (ui/src/app/UiComponents/DataViewer/accountant/Notes.jsx). Generic over an owner keyed
// by { idKey, id } (e.g. paymentId / rentId / operationalExpensesId / baseEmployeeSalaryId).
// Lists notes via GET /v2/accounting/notes?idKey=&id= and adds a note via
// POST /v2/accounting/notes (strict body { content, attachment?, idKey, id }). Attachments
// are uploaded through the v2 chunk uploader (files/chunks) which returns a URL string —
// exactly what the BE addNote expects. Gated on NOTE_LIST / NOTE_CREATE.

import { Fragment, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemText,
  TextField,
  Typography,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material";
import { MdNoteAlt, MdAttachFile } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useOverlay } from "@/app/v2/hooks/useOverlay";
import { useUpload } from "@/app/v2/hooks/useUpload";
import { UploadOverlay } from "@/app/v2/shared/components/feedback/UploadOverlay";
import { useT } from "@/app/v2/lib/i18n";
import { accountingService } from "../accounting.service.js";
import { runAccountingMutation } from "../accounting.mutations.js";

const P = PERMISSIONS.ACCOUNTING;

export function NotesDialog({ idKey, id, buttonLabel }) {
  const { t } = useT();
  const resolvedButtonLabel = buttonLabel ?? t("accounting.notes.defaultButton");
  const { hasPermission } = usePermission();
  const canList = hasPermission(P.NOTE_LIST);
  const canCreate = hasPermission(P.NOTE_CREATE);

  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { isOpen, open: openOverlay, close: closeOverlay } = useOverlay();
  const { uploadAsChunk, progress, fileName, uploadSpeed, isUploading } = useUpload({
    onUploadStart: openOverlay,
    onUploadEnd: closeOverlay,
  });

  async function fetchNotes() {
    setLoading(true);
    try {
      const res = await accountingService.listNotes(idKey, id);
      setNotes(Array.isArray(res?.data?.items) ? res.data.items : []);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && canList) fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleAdd() {
    if (!content && !file) return;
    let attachment;
    if (file) {
      const uploaded = await uploadAsChunk({ file, withThumbnail: false });
      if (uploaded?.status === 200) attachment = uploaded.url;
    }
    const res = await runAccountingMutation(
      () => accountingService.addNote({ content, attachment, idKey, id }),
      { loading: t("accounting.notes.loading"), setLoading: setSubmitting },
    );
    if (res) {
      setContent("");
      setFile(null);
      fetchNotes();
    }
  }

  if (!canList && !canCreate) return null;

  return (
    <>
      <Button variant="outlined" size="small" startIcon={<MdNoteAlt />} onClick={() => setOpen(true)}>
        {resolvedButtonLabel}
      </Button>

      <UploadOverlay
        progress={progress}
        fileName={fileName}
        uploadSpeed={uploadSpeed}
        isUploading={isUploading}
        showOverlay={isOpen}
      />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t("accounting.notes.title")}</DialogTitle>
        <DialogContent dividers>
          {canCreate && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label={t("accounting.notes.field")}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <Button component="label" variant="text" size="small" startIcon={<MdAttachFile />}>
                  {file ? file.name : t("accounting.notes.attach")}
                  <input
                    type="file"
                    hidden
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button
                  variant="contained"
                  size="small"
                  disabled={submitting || (!content && !file)}
                  onClick={handleAdd}
                >
                  {t("accounting.action.add")}
                </Button>
              </Box>
              <Divider sx={{ mt: 2 }} />
            </Box>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notes.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              {t("accounting.notes.empty")}
            </Typography>
          ) : (
            <List>
              {notes.map((note) => (
                <Fragment key={note.id}>
                  <ListItemText
                    primary={note.content || "—"}
                    secondary={
                      <Box
                        component="span"
                        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                      >
                        <span>{note.user?.name}</span>
                        {note.attachment && (
                          <MuiLink href={note.attachment} target="_blank" rel="noreferrer">
                            {t("accounting.notes.viewAttachment")}
                          </MuiLink>
                        )}
                      </Box>
                    }
                    sx={{ borderInlineStart: "2px solid", borderColor: "divider", pl: 2, mb: 1 }}
                  />
                </Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("accounting.action.close")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default NotesDialog;

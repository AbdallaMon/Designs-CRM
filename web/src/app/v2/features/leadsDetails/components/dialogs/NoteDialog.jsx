"use client";

// Add-note dialog — ports DataViewer/leads/dialogs/NoteDialog.jsx onto the v2 leads
// service + capability gating + Arabic. Gated on capabilities.canAddNote (× lead.note.manage,
// already folded into the capability by the backend dto).

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { GoPlus } from "react-icons/go";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { useT } from "@/app/v2/lib/i18n";
import { leadsService } from "@/app/v2/features/leads/leads.service.js";
import { runLeadMutation } from "@/app/v2/features/leads/leads.mutations.js";

export function NewNoteDialog({ lead, canAdd, onCreated, autoOpen = false, onAutoOpenConsumed }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const { setLoading } = useToastContext();
  const { t } = useT();

  // One-click daily verbs (item 4): open once when a deep-link asks, then clear the URL flag.
  const consumedRef = useRef(false);
  useEffect(() => {
    if (autoOpen && canAdd && !consumedRef.current) {
      consumedRef.current = true;
      setOpen(true);
      onAutoOpenConsumed?.();
    }
  }, [autoOpen, canAdd, onAutoOpenConsumed]);

  if (!canAdd) return null;

  async function handleAdd() {
    if (!content.trim()) return;
    const res = await runLeadMutation(
      () => leadsService.createNote(lead.id, { content }),
      { setLoading, loading: t("leadsDetails.note.loading") },
    );
    if (res) {
      onCreated?.(res.data);
      setContent("");
      setOpen(false);
    }
  }

  return (
    <>
      <Button
        endIcon={<GoPlus />}
        onClick={() => setOpen(true)}
        variant="contained"
        sx={{ width: "fit-content" }}
      >
        {t("leadsDetails.note.add")}
      </Button>
      {open && (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth dir="rtl">
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>{t("leadsDetails.note.title")}</DialogTitle>
          <DialogContent>
            <Stack sx={{ mt: 2 }}>
              <TextField
                label={t("leadsDetails.note.label")}
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("leadsDetails.note.placeholder")}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={() => setOpen(false)} variant="outlined">
              {t("leadsDetails.note.cancel")}
            </Button>
            <Button onClick={handleAdd} variant="contained" color="primary" disabled={!content.trim()}>
              {t("leadsDetails.note.confirm")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

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
import { leadsService } from "@/app/v2/features/leads/leads.service.js";
import { runLeadMutation } from "@/app/v2/features/leads/leads.mutations.js";

export function NewNoteDialog({ lead, canAdd, onCreated, autoOpen = false, onAutoOpenConsumed }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const { setLoading } = useToastContext();

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
      { setLoading, loading: "جاري الإنشاء..." },
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
        إضافة ملاحظة
      </Button>
      {open && (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth dir="rtl">
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>إضافة ملاحظة</DialogTitle>
          <DialogContent>
            <Stack sx={{ mt: 2 }}>
              <TextField
                label="اكتب ملاحظتك"
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتب الملاحظة هنا..."
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={() => setOpen(false)} variant="outlined">
              إلغاء
            </Button>
            <Button onClick={handleAdd} variant="contained" color="primary" disabled={!content.trim()}>
              إضافة
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

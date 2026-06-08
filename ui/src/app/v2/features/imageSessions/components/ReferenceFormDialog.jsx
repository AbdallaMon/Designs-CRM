"use client";

// Create/edit modal for a SURFACE-1 admin reference type (space / material / style / color /
// page-info). MUI Dialog (the v2 image-sessions feature has no AppForm primitive; the existing
// public + admin screens use plain MUI dialogs — we stay consistent, no parallel form stack).
// Submits the LEGACY single-language text shape ({ titles, descriptions } keyed by the Arabic
// Language id — see REFERENCE_LANGUAGE_ID / buildReferenceText; CONFLICT documented there). The
// BE create body is free-form `passthrough`, so the SHAPE is the contract. Routes through the
// service + runImageSessionMutation (CODE→Arabic toast); on success the parent refetches.
//
// Props:
//   open, onClose
//   type     ADMIN_REFERENCE_TYPES entry — { key, label, model, ... }
//   initial  row?     — when editing (carries id + title[]/description[] relations).
//   onSaved  () => void
//   busy     bool

import { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, Typography,
} from "@mui/material";
import imageSessionsService from "../imageSessions.service.js";
import { runImageSessionMutation } from "../imageSessions.mutations.js";
import { buildReferenceText, readPickListLabel } from "../config/imageSessionsConstants.js";

// type key → { create(body), update(id, body) } service calls + whether it has a description.
const HANDLERS = {
  spaces: {
    create: (b) => imageSessionsService.createSpace(b),
    update: (id, b) => imageSessionsService.updateSpace(id, b),
    hasDescription: false,
  },
  materials: {
    create: (b) => imageSessionsService.createMaterial(b),
    update: (id, b) => imageSessionsService.updateMaterial(id, b),
    hasDescription: true,
  },
  styles: {
    create: (b) => imageSessionsService.createStyle(b),
    update: (id, b) => imageSessionsService.updateStyle(id, b),
    hasDescription: true,
  },
  colors: {
    create: (b) => imageSessionsService.createColor(b),
    update: (id, b) => imageSessionsService.updateColor(id, b),
    hasDescription: false,
    hasBackground: true,
  },
  pageInfo: {
    create: (b) => imageSessionsService.createPageInfo(b),
    update: (id, b) => imageSessionsService.updatePageInfo(id, b),
    hasDescription: true,
    hasType: true,
  },
};

export function ReferenceFormDialog({ open, type, initial, onClose, onSaved }) {
  const cfg = HANDLERS[type?.key];
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [background, setBackground] = useState("");
  const [pageType, setPageType] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial ? readPickListLabel(type?.model, initial) : "");
    setDescription(
      Array.isArray(initial?.description) ? (initial.description[0]?.text ?? "") : "",
    );
    setBackground(initial?.background ?? "");
    setPageType(initial?.type ?? "");
    setBusy(false);
  }, [open, initial, type]);

  if (!cfg) return null;

  function buildBody() {
    const body = { titles: buildReferenceText("titles", title.trim()) };
    if (cfg.hasDescription) body.descriptions = buildReferenceText("descriptions", description.trim());
    if (cfg.hasBackground && background.trim()) body.background = background.trim();
    if (cfg.hasType && pageType.trim()) body.type = pageType.trim();
    return body;
  }

  async function submit() {
    const body = buildBody();
    const res = await runImageSessionMutation(
      () => (isEdit ? cfg.update(initial.id, body) : cfg.create(body)),
      { loading: isEdit ? "جاري الحفظ..." : "جاري الإضافة...", setLoading: setBusy },
    );
    if (res) {
      onSaved?.();
      onClose?.();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>
        {isEdit ? `تعديل ${type.label}` : `إضافة ${type.label}`}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="الاسم"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            autoFocus
          />
          {cfg.hasDescription && (
            <TextField
              label="الوصف"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          )}
          {cfg.hasBackground && (
            <TextField
              label="لون الخلفية"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="#000000"
              fullWidth
            />
          )}
          {cfg.hasType && (
            <TextField
              label="نوع الصفحة"
              value={pageType}
              onChange={(e) => setPageType(e.target.value)}
              fullWidth
            />
          )}
          <Typography variant="caption" color="text.secondary">
            يتم الحفظ باللغة العربية.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="contained" onClick={submit} disabled={busy || !title.trim()}>
          {isEdit ? "حفظ" : "إضافة"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ReferenceFormDialog;

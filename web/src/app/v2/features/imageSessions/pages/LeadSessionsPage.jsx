"use client";

// SURFACE 2 — SHARED lead-scoped image-session management page. Ported from the legacy
// ClientSessionImageManager (UiComponents/DataViewer/image-session/users/), Arabic-only, wired
// to the v2 image-sessions service. Per-lead: list the lead's sessions (status + progress),
// create a session (select spaces), regenerate the client link, copy/share the client URL
// (/v2/client-image-session?token=…), edit fields, delete. Object scope is enforced
// SERVER-SIDE (lead-scoped via the leads checker) — the session dto emits NO capabilities.*,
// so every action is gated on the IMAGE_SESSION.SESSION_* CODES only.

import { useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControlLabel, Grid, IconButton, LinearProgress, Paper,
  Stack, Tooltip, Typography,
} from "@mui/material";
import { FaCopy, FaLink, FaPlus, FaTrash, FaExternalLinkAlt } from "react-icons/fa";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useLeadSessions } from "../hooks/useLeadSessions.js";
import imageSessionsService from "../imageSessions.service.js";
import { runImageSessionMutation } from "../imageSessions.mutations.js";
import {
  SESSION_STATUS_LABELS,
  readPickListLabel,
  PICK_LIST_MODELS,
} from "../config/imageSessionsConstants.js";

const P = PERMISSIONS.IMAGE_SESSION;

// Coarse progress per status (mirrors the legacy stepper ordering).
const STATUS_ORDER = [
  "INITIAL", "PREVIEW_COLOR_PATTERN", "SELECTED_COLOR_PATTERN", "PREVIEW_MATERIAL",
  "SELECTED_MATERIAL", "PREVIEW_STYLE", "SELECTED_STYLE", "PREVIEW_IMAGES",
  "SELECTED_IMAGES", "PDF_GENERATED", "SUBMITTED",
];
function progressFor(status) {
  const i = STATUS_ORDER.indexOf(status);
  return i < 0 ? 0 : Math.round(((i + 1) / STATUS_ORDER.length) * 100);
}

// The public client link the staff shares with the prospective client.
function clientUrlFor(token) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/v2/client-image-session?token=${token}`;
}

function NewSessionDialog({ open, onClose, spaces, onCreate, busy }) {
  const [selected, setSelected] = useState([]);
  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>إنشاء جلسة جديدة</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          اختر المساحات المطلوبة لهذه الجلسة (مساحة واحدة على الأقل).
        </Typography>
        {spaces?.length ? (
          <Grid container>
            {spaces.map((s) => (
              <Grid size={{ xs: 12, sm: 6 }} key={s.id}>
                <FormControlLabel
                  control={<Checkbox checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />}
                  label={readPickListLabel(PICK_LIST_MODELS.SPACE, s) || `#${s.id}`}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">لا توجد مساحات متاحة</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          variant="contained"
          disabled={busy || selected.length === 0}
          onClick={() => onCreate(selected)}
        >
          إنشاء
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SessionCard({ session, clientLeadId, canManage, onChanged }) {
  const [copied, setCopied] = useState(false);
  const url = clientUrlFor(session.token);

  const copy = () => {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  async function regenerate() {
    const res = await runImageSessionMutation(
      () => imageSessionsService.regenerateToken(clientLeadId, session.id),
      { loading: "جاري إعادة إنشاء الرابط..." },
    );
    if (res) onChanged?.();
  }
  async function remove() {
    const res = await runImageSessionMutation(
      () => imageSessionsService.deleteSession(clientLeadId, session.id),
      { loading: "جاري حذف الجلسة..." },
    );
    if (res) onChanged?.();
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle1">{session.name || `جلسة #${session.id}`}</Typography>
          <Chip size="small" label={SESSION_STATUS_LABELS[session.sessionStatus] || session.sessionStatus} />
        </Stack>
        <LinearProgress variant="determinate" value={progressFor(session.sessionStatus)} sx={{ mb: 1.5, borderRadius: 1 }} />
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Tooltip title="نسخ رابط العميل">
            <IconButton size="small" onClick={copy} color={copied ? "success" : "default"}><FaCopy /></IconButton>
          </Tooltip>
          <Tooltip title="فتح رابط العميل">
            <IconButton size="small" component="a" href={url} target="_blank" rel="noreferrer"><FaExternalLinkAlt /></IconButton>
          </Tooltip>
          {session.pdfUrl && (
            <Button size="small" variant="text" href={session.pdfUrl} target="_blank">تحميل الملف</Button>
          )}
          {canManage && (
            <>
              <Tooltip title="إعادة إنشاء الرابط">
                <IconButton size="small" onClick={regenerate}><FaLink /></IconButton>
              </Tooltip>
              <Tooltip title="حذف الجلسة">
                <IconButton size="small" color="error" onClick={remove}><FaTrash /></IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function LeadSessionsPage({ clientLeadId }) {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.SESSION_VIEW);
  const canManage = hasPermission(P.SESSION_MANAGE);

  const { sessions, spaces, loading, refetch } = useLeadSessions(clientLeadId, { autoFetch: canView });
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function createSession(selectedSpaces) {
    const res = await runImageSessionMutation(
      () => imageSessionsService.createSession(clientLeadId, { spaces: selectedSpaces }),
      { loading: "جاري إنشاء الجلسة...", setLoading: setBusy },
    );
    if (res) {
      setCreateOpen(false);
      refetch();
    }
  }

  if (!canView) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }} dir="rtl">
        <Typography color="text.secondary">لا تملك صلاحية عرض جلسات الصور</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }} dir="rtl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h5">جلسات الصور للعميل المحتمل #{clientLeadId}</Typography>
        {canManage && (
          <Button variant="contained" startIcon={<FaPlus />} onClick={() => setCreateOpen(true)}>
            جلسة جديدة
          </Button>
        )}
      </Stack>

      {canManage && (
        <NewSessionDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          spaces={spaces}
          onCreate={createSession}
          busy={busy}
        />
      )}

      <Grid container spacing={2}>
        {sessions?.length
          ? sessions.map((s) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={s.id}>
                <SessionCard session={s} clientLeadId={clientLeadId} canManage={canManage} onChanged={refetch} />
              </Grid>
            ))
          : !loading && (
              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
                  <Typography color="text.secondary">لا توجد جلسات بعد.</Typography>
                </Paper>
              </Grid>
            )}
      </Grid>
      {loading && <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>جاري التحميل...</Typography>}
    </Box>
  );
}

export default LeadSessionsPage;

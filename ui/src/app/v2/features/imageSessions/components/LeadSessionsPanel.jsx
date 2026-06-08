"use client";

// SURFACE 2 — SHARED lead-scoped image-session management, as a SELF-CONTAINED PANEL. Takes a
// `clientLeadId` prop; a later wave wires it into the lead-detail tabs (it is exported from the
// feature barrel for that). The thin route page /v2/image-sessions/lead/[leadId] just renders it.
//
// Per-lead: list the lead's sessions (status chip + progress stepper), create a session (pick
// spaces), regenerate the client token ("نسخ الرابط" copy affordance + an old-link-dies warning),
// edit name, delete. Object scope is enforced SERVER-SIDE (lead-scoped via the leads checker) —
// the session dto emits NO capabilities.*, so every action gates on the IMAGE_SESSION.SESSION_*
// CODES only. Single-language Arabic / RTL.

import { useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControlLabel, Grid, IconButton, Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import {
  MdAdd, MdContentCopy, MdOpenInNew, MdAutorenew, MdDelete, MdEdit, MdCheck,
} from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import {
  SectionCard, StatusChip, StageStepper, LoadingState, EmptyState, ErrorState,
} from "@/app/v2/shared/components";
import { useLeadSessions } from "../hooks/useLeadSessions.js";
import imageSessionsService from "../imageSessions.service.js";
import { runImageSessionMutation } from "../imageSessions.mutations.js";
import {
  SESSION_STATUS_LABELS, WIZARD_STEPS, wizardStepIndex, readPickListLabel, PICK_LIST_MODELS,
} from "../config/imageSessionsConstants.js";

const P = PERMISSIONS.IMAGE_SESSION;

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
        <Button onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="contained" disabled={busy || selected.length === 0} onClick={() => onCreate(selected)}>
          إنشاء
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EditNameDialog({ open, onClose, initialName, onSave, busy }) {
  const [name, setName] = useState(initialName ?? "");
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle>تعديل اسم الجلسة</DialogTitle>
      <DialogContent dividers>
        <TextField autoFocus fullWidth label="اسم الجلسة" value={name} onChange={(e) => setName(e.target.value)} sx={{ mt: 1 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="contained" onClick={() => onSave(name)} disabled={busy}>حفظ</Button>
      </DialogActions>
    </Dialog>
  );
}

function RegenerateDialog({ open, onClose, onConfirm, busy }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle>إعادة إنشاء الرابط</DialogTitle>
      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 1 }}>
          سيتوقف الرابط القديم عن العمل فورًا. أي رابط شاركته سابقًا مع العميل لن يعمل بعد الآن.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          هل تريد المتابعة وإنشاء رابط جديد؟
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="contained" color="warning" onClick={onConfirm} disabled={busy}>إعادة الإنشاء</Button>
      </DialogActions>
    </Dialog>
  );
}

function SessionCard({ session, clientLeadId, canManage, onChanged }) {
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const url = clientUrlFor(session.token);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  async function regenerate() {
    const res = await runImageSessionMutation(
      () => imageSessionsService.regenerateToken(clientLeadId, session.id),
      { loading: "جاري إعادة إنشاء الرابط...", setLoading: setBusy },
    );
    setRegenOpen(false);
    if (res) onChanged?.();
  }
  async function saveName(name) {
    const res = await runImageSessionMutation(
      () => imageSessionsService.editSession(clientLeadId, session.id, { name }),
      { loading: "جاري الحفظ...", setLoading: setBusy },
    );
    setEditOpen(false);
    if (res) onChanged?.();
  }
  async function remove() {
    const res = await runImageSessionMutation(
      () => imageSessionsService.deleteSession(clientLeadId, session.id),
      { loading: "جاري حذف الجلسة...", setLoading: setBusy },
    );
    if (res) onChanged?.();
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }} spacing={1}>
          <Typography variant="subtitle1" sx={{ minWidth: 0 }} noWrap>
            {session.name || `جلسة #${session.id}`}
          </Typography>
          <StatusChip
            domain="session"
            status={session.sessionStatus}
            label={SESSION_STATUS_LABELS[session.sessionStatus] || session.sessionStatus}
          />
        </Stack>

        <Box sx={{ mb: 1.5, overflowX: "auto" }}>
          <StageStepper stages={WIZARD_STEPS} current={wizardStepIndex(session.sessionStatus)} />
        </Box>

        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
          <Tooltip title={copied ? "تم النسخ" : "نسخ الرابط"}>
            <IconButton size="small" onClick={copy} color={copied ? "success" : "default"} aria-label="نسخ الرابط">
              {copied ? <MdCheck /> : <MdContentCopy />}
            </IconButton>
          </Tooltip>
          <Tooltip title="فتح رابط العميل">
            <IconButton size="small" component="a" href={url} target="_blank" rel="noreferrer" aria-label="فتح الرابط">
              <MdOpenInNew />
            </IconButton>
          </Tooltip>
          {session.pdfUrl && (
            <Button size="small" variant="text" href={session.pdfUrl} target="_blank">تحميل الملف</Button>
          )}
          {canManage && (
            <>
              <Tooltip title="تعديل الاسم">
                <IconButton size="small" onClick={() => setEditOpen(true)} disabled={busy} aria-label="تعديل">
                  <MdEdit />
                </IconButton>
              </Tooltip>
              <Tooltip title="إعادة إنشاء الرابط">
                <IconButton size="small" onClick={() => setRegenOpen(true)} disabled={busy} aria-label="إعادة إنشاء الرابط">
                  <MdAutorenew />
                </IconButton>
              </Tooltip>
              <Tooltip title="حذف الجلسة">
                <IconButton size="small" color="error" onClick={remove} disabled={busy} aria-label="حذف">
                  <MdDelete />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      </CardContent>

      {canManage && (
        <>
          <EditNameDialog open={editOpen} onClose={() => setEditOpen(false)} initialName={session.name} onSave={saveName} busy={busy} />
          <RegenerateDialog open={regenOpen} onClose={() => setRegenOpen(false)} onConfirm={regenerate} busy={busy} />
        </>
      )}
    </Card>
  );
}

export function LeadSessionsPanel({ clientLeadId }) {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.SESSION_VIEW);
  const canManage = hasPermission(P.SESSION_MANAGE);

  const { sessions, spaces, loading, error, refetch } = useLeadSessions(clientLeadId, { autoFetch: canView });
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
    return <Alert severity="info">لا تملك صلاحية عرض جلسات الصور.</Alert>;
  }

  return (
    <SectionCard
      title="جلسات الصور"
      subtitle="روابط اختيار التصاميم التي تشاركها مع العميل المحتمل."
      actions={
        canManage ? (
          <Button variant="contained" startIcon={<MdAdd />} onClick={() => setCreateOpen(true)}>
            جلسة جديدة
          </Button>
        ) : null
      }
    >
      {canManage && (
        <NewSessionDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          spaces={spaces}
          onCreate={createSession}
          busy={busy}
        />
      )}

      {loading ? (
        <LoadingState variant="cards" count={3} columns={3} height={200} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !sessions?.length ? (
        <EmptyState
          title="لا توجد جلسات بعد"
          description={
            canManage
              ? "أنشئ جلسة جديدة لمشاركة رابط اختيار التصاميم مع العميل."
              : "لم يتم إنشاء أي جلسة لهذا العميل بعد."
          }
          action={canManage ? { label: "جلسة جديدة", onClick: () => setCreateOpen(true) } : undefined}
        />
      ) : (
        <Grid container spacing={2}>
          {sessions.map((s) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={s.id}>
              <SessionCard session={s} clientLeadId={clientLeadId} canManage={canManage} onChanged={refetch} />
            </Grid>
          ))}
        </Grid>
      )}
    </SectionCard>
  );
}

export default LeadSessionsPanel;

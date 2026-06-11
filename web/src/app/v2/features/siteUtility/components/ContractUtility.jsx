"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  FiChevronDown,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiTrash2,
} from "react-icons/fi";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useContractUtility } from "../hooks/useContractUtility.js";
import { CONTRACT_LEVELS } from "../config/constant.js";

// Lightweight section wrapper (no external SectionCard dependency).
function SectionCard({ title, action, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1.5}
      >
        <Typography variant="h6">{title}</Typography>
        {action}
      </Stack>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Paper>
  );
}

// ── Obligations (ContractUtility singleton) ─────────────────────────────────────
function ObligationsSection({ obligations, canEdit, onSave }) {
  const [form, setForm] = useState({
    obligationsPartyOneAr: "",
    obligationsPartyOneEn: "",
    obligationsPartyTwoAr: "",
    obligationsPartyTwoEn: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      obligationsPartyOneAr: obligations?.obligationsPartyOneAr || "",
      obligationsPartyOneEn: obligations?.obligationsPartyOneEn || "",
      obligationsPartyTwoAr: obligations?.obligationsPartyTwoAr || "",
      obligationsPartyTwoEn: obligations?.obligationsPartyTwoEn || "",
    });
  }, [obligations]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <SectionCard
      title="التزامات الفريقين"
      action={
        canEdit && (
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <FiSave />}
            onClick={save}
            disabled={saving}
          >
            حفظ
          </Button>
        )
      }
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" mb={1}>
            الفريق الأول
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="عربي"
              fullWidth
              multiline
              minRows={4}
              value={form.obligationsPartyOneAr}
              onChange={set("obligationsPartyOneAr")}
              disabled={!canEdit}
            />
            <TextField
              label="English"
              fullWidth
              multiline
              minRows={4}
              value={form.obligationsPartyOneEn}
              onChange={set("obligationsPartyOneEn")}
              disabled={!canEdit}
            />
          </Stack>
        </Box>
        <Divider />
        <Box>
          <Typography variant="subtitle2" mb={1}>
            الفريق الثاني
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="عربي"
              fullWidth
              multiline
              minRows={4}
              value={form.obligationsPartyTwoAr}
              onChange={set("obligationsPartyTwoAr")}
              disabled={!canEdit}
            />
            <TextField
              label="English"
              fullWidth
              multiline
              minRows={4}
              value={form.obligationsPartyTwoEn}
              onChange={set("obligationsPartyTwoEn")}
              disabled={!canEdit}
            />
          </Stack>
        </Box>
      </Stack>
    </SectionCard>
  );
}

// ── Generic clause dialog (drives stage / special / level forms) ────────────────
function ClauseDialog({ open, kind, initial, onClose, onSubmit }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (kind === "stage") {
      setForm({
        headingAr: initial?.headingAr || "",
        headingEn: initial?.headingEn || "",
        titleAr: initial?.titleAr || "",
        titleEn: initial?.titleEn || "",
        descriptionAr: initial?.descriptionAr || "",
        descriptionEn: initial?.descriptionEn || "",
        order: initial?.order ?? 0,
      });
    } else if (kind === "special") {
      setForm({
        textAr: initial?.textAr || "",
        textEn: initial?.textEn || "",
        order: initial?.order ?? 0,
        isActive: initial?.isActive ?? true,
      });
    } else {
      setForm({
        level: initial?.level || CONTRACT_LEVELS[0],
        textAr: initial?.textAr || "",
        textEn: initial?.textEn || "",
        order: initial?.order ?? 0,
        isActive: initial?.isActive ?? true,
      });
    }
  }, [open, kind, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNum = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: Number(e.target.value) || 0 }));
  const setBool = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.checked }));

  const canSave = useMemo(() => {
    if (kind === "stage") return form.headingAr && form.headingEn;
    return Boolean(form.textAr);
  }, [kind, form]);

  const submit = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    // On edit, send the full edited payload; the backend update schema is a partial.
    const res = await onSubmit(form, isEdit ? initial.id : null);
    setSaving(false);
    if (res) onClose();
  };

  const titles = {
    stage: isEdit ? "تعديل بند مرحلة" : "إضافة بند مرحلة",
    special: isEdit ? "تعديل بند خاص" : "إضافة بند خاص",
    level: isEdit ? "تعديل بند مستوى" : "إضافة بند مستوى",
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{titles[kind]}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          {kind === "stage" && (
            <>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="العنوان (عربي)"
                  fullWidth
                  value={form.headingAr || ""}
                  onChange={set("headingAr")}
                />
                <TextField
                  label="Heading (EN)"
                  fullWidth
                  value={form.headingEn || ""}
                  onChange={set("headingEn")}
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="الاسم (عربي)"
                  fullWidth
                  value={form.titleAr || ""}
                  onChange={set("titleAr")}
                />
                <TextField
                  label="Title (EN)"
                  fullWidth
                  value={form.titleEn || ""}
                  onChange={set("titleEn")}
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="الوصف (عربي)"
                  fullWidth
                  multiline
                  minRows={3}
                  value={form.descriptionAr || ""}
                  onChange={set("descriptionAr")}
                />
                <TextField
                  label="Description (EN)"
                  fullWidth
                  multiline
                  minRows={3}
                  value={form.descriptionEn || ""}
                  onChange={set("descriptionEn")}
                />
              </Stack>
            </>
          )}

          {kind === "level" && (
            <FormControl fullWidth>
              <InputLabel id="level-label">المستوى</InputLabel>
              <Select
                labelId="level-label"
                label="المستوى"
                value={form.level || CONTRACT_LEVELS[0]}
                onChange={set("level")}
              >
                {CONTRACT_LEVELS.map((lvl) => (
                  <MenuItem key={lvl} value={lvl}>
                    {lvl}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {(kind === "special" || kind === "level") && (
            <>
              <TextField
                label="النص (عربي)"
                fullWidth
                multiline
                minRows={3}
                value={form.textAr || ""}
                onChange={set("textAr")}
              />
              <TextField
                label="Text (EN)"
                fullWidth
                multiline
                minRows={3}
                value={form.textEn || ""}
                onChange={set("textEn")}
              />
            </>
          )}

          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="الترتيب"
              type="number"
              sx={{ width: 140 }}
              value={form.order ?? 0}
              onChange={setNum("order")}
            />
            {(kind === "special" || kind === "level") && (
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(form.isActive)}
                    onChange={setBool("isActive")}
                  />
                }
                label="مُفعّل"
              />
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          إلغاء
        </Button>
        <Button
          onClick={submit}
          variant="contained"
          disabled={!canSave || saving}
        >
          {saving ? <CircularProgress size={18} /> : isEdit ? "حفظ" : "إنشاء"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteDialog({ open, label, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const confirm = async () => {
    setDeleting(true);
    const ok = await onConfirm();
    setDeleting(false);
    if (ok) onClose();
  };
  return (
    <Dialog open={open} onClose={deleting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>حذف البند</DialogTitle>
      <DialogContent>
        <DialogContentText>
          هل أنت متأكد من حذف &quot;{label}&quot;؟
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>
          إلغاء
        </Button>
        <Button onClick={confirm} color="error" variant="contained" disabled={deleting}>
          {deleting ? <CircularProgress size={18} /> : "حذف"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── A clause list section (stage / special / level) ─────────────────────────────
function ClauseSection({
  title,
  kind,
  clauses,
  canEdit,
  primary,
  secondary,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [dialog, setDialog] = useState({ open: false, initial: null });
  const [del, setDel] = useState(null);

  return (
    <SectionCard
      title={title}
      action={
        canEdit && (
          <Button
            variant="contained"
            startIcon={<FiPlus />}
            onClick={() => setDialog({ open: true, initial: null })}
          >
            جديد
          </Button>
        )
      }
    >
      {clauses?.length ? (
        clauses.map((c, i) => (
          <Accordion key={c.id}>
            <AccordionSummary expandIcon={<FiChevronDown />}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
                width="100%"
              >
                <Box>
                  <Typography variant="subtitle2">
                    {primary(c) || `#${i + 1}`}
                  </Typography>
                  {secondary && (
                    <Typography variant="caption" color="text.secondary">
                      {secondary(c)}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" variant="outlined" label={`ترتيب: ${c.order ?? 0}`} />
                  {"isActive" in c && (
                    <Chip
                      size="small"
                      color={c.isActive ? "success" : "default"}
                      label={c.isActive ? "مُفعّل" : "غير مُفعّل"}
                    />
                  )}
                </Stack>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1.5}>
                {kind === "stage" ? (
                  <>
                    <Typography variant="body2">{c.titleAr}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {c.descriptionAr}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2">{c.textAr}</Typography>
                )}
                {canEdit && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setDialog({ open: true, initial: c })}
                    >
                      تعديل
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<FiTrash2 />}
                      onClick={() => setDel(c)}
                    >
                      حذف
                    </Button>
                  </Stack>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Typography color="text.secondary">لا توجد بنود بعد.</Typography>
      )}

      <ClauseDialog
        open={dialog.open}
        kind={kind}
        initial={dialog.initial}
        onClose={() => setDialog({ open: false, initial: null })}
        onSubmit={(payload, id) => (id ? onUpdate(id, payload) : onCreate(payload))}
      />
      <DeleteDialog
        open={Boolean(del)}
        label={del ? primary(del) : ""}
        onClose={() => setDel(null)}
        onConfirm={() => onDelete(del.id)}
      />
    </SectionCard>
  );
}

/**
 * Contract utility editor (legacy "إعدادات عقد التصميم"). Four sections — obligations
 * (AR/EN), stage clauses, special clauses, level clauses — over the canonical
 * useContractUtility hook (→ siteUtilityService → /v2/site-utilities/contract-utility).
 * Read gated on CONTRACT_UTILITY_VIEW; write controls gated on CONTRACT_UTILITY_EDIT
 * AND the per-payload capabilities.canEdit the /details endpoint returns. Single-language
 * Arabic RTL.
 */
export default function ContractUtility() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.SITE_UTILITY.CONTRACT_UTILITY_VIEW);
  const canEditCode = hasPermission(PERMISSIONS.SITE_UTILITY.CONTRACT_UTILITY_EDIT);

  const cu = useContractUtility({ enabled: canView });
  const canEdit = canEditCode && cu.capabilities?.canEdit;

  if (!canView) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography color="text.secondary">
          لا تملك صلاحية عرض إعدادات عقد التصميم.
        </Typography>
      </Box>
    );
  }

  if (cu.loading && !cu.details) {
    return (
      <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 4 }}>
        <CircularProgress size={20} />
        <Typography>جاري التحميل...</Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">إعدادات عقد التصميم</Typography>
        <Button
          variant="outlined"
          startIcon={<FiRefreshCw />}
          onClick={cu.refetch}
          disabled={cu.loading}
        >
          تحديث
        </Button>
      </Stack>

      {!cu.obligations && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "warning.light" }}>
          <Typography variant="body2">
            لم يتم تهيئة إعدادات عقد التصميم بعد. احفظ الالتزامات أولاً لإنشاء السجل، ثم
            يمكنك إضافة البنود.
          </Typography>
        </Paper>
      )}

      <ObligationsSection
        obligations={cu.obligations}
        canEdit={canEdit}
        onSave={cu.saveObligations}
      />

      <ClauseSection
        title="بنود المراحل"
        kind="stage"
        clauses={cu.stageClauses}
        canEdit={canEdit}
        primary={(c) => c.headingAr}
        secondary={(c) => c.headingEn}
        onCreate={cu.createStageClause}
        onUpdate={cu.updateStageClause}
        onDelete={cu.deleteStageClause}
      />

      <ClauseSection
        title="البنود الخاصة"
        kind="special"
        clauses={cu.specialClauses}
        canEdit={canEdit}
        primary={(c) => c.textAr}
        onCreate={cu.createSpecialClause}
        onUpdate={cu.updateSpecialClause}
        onDelete={cu.deleteSpecialClause}
      />

      <ClauseSection
        title="بنود المستويات"
        kind="level"
        clauses={cu.levelClauses}
        canEdit={canEdit}
        primary={(c) => `${c.level} — ${c.textAr || ""}`}
        onCreate={cu.createLevelClause}
        onUpdate={cu.updateLevelClause}
        onDelete={cu.deleteLevelClause}
      />
    </Box>
  );
}

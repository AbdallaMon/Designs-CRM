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
import { useT } from "@/app/v2/lib/i18n";
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
  const { t } = useT();
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
      title={t("siteUtility.contract.obligations.title")}
      action={
        canEdit && (
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <FiSave />}
            onClick={save}
            disabled={saving}
          >
            {t("siteUtility.action.save")}
          </Button>
        )
      }
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" mb={1}>
            {t("siteUtility.contract.obligations.partyOne")}
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label={t("siteUtility.contract.field.ar")}
              fullWidth
              multiline
              minRows={4}
              value={form.obligationsPartyOneAr}
              onChange={set("obligationsPartyOneAr")}
              disabled={!canEdit}
            />
            <TextField
              label={t("siteUtility.contract.field.en")}
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
            {t("siteUtility.contract.obligations.partyTwo")}
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label={t("siteUtility.contract.field.ar")}
              fullWidth
              multiline
              minRows={4}
              value={form.obligationsPartyTwoAr}
              onChange={set("obligationsPartyTwoAr")}
              disabled={!canEdit}
            />
            <TextField
              label={t("siteUtility.contract.field.en")}
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
  const { t } = useT();
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
    stage: isEdit
      ? t("siteUtility.contract.dialog.stage.edit")
      : t("siteUtility.contract.dialog.stage.add"),
    special: isEdit
      ? t("siteUtility.contract.dialog.special.edit")
      : t("siteUtility.contract.dialog.special.add"),
    level: isEdit
      ? t("siteUtility.contract.dialog.level.edit")
      : t("siteUtility.contract.dialog.level.add"),
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
                  label={t("siteUtility.contract.field.headingAr")}
                  fullWidth
                  value={form.headingAr || ""}
                  onChange={set("headingAr")}
                />
                <TextField
                  label={t("siteUtility.contract.field.headingEn")}
                  fullWidth
                  value={form.headingEn || ""}
                  onChange={set("headingEn")}
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label={t("siteUtility.contract.field.titleAr")}
                  fullWidth
                  value={form.titleAr || ""}
                  onChange={set("titleAr")}
                />
                <TextField
                  label={t("siteUtility.contract.field.titleEn")}
                  fullWidth
                  value={form.titleEn || ""}
                  onChange={set("titleEn")}
                />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label={t("siteUtility.contract.field.descriptionAr")}
                  fullWidth
                  multiline
                  minRows={3}
                  value={form.descriptionAr || ""}
                  onChange={set("descriptionAr")}
                />
                <TextField
                  label={t("siteUtility.contract.field.descriptionEn")}
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
              <InputLabel id="level-label">
                {t("siteUtility.contract.field.level")}
              </InputLabel>
              <Select
                labelId="level-label"
                label={t("siteUtility.contract.field.level")}
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
                label={t("siteUtility.contract.field.textAr")}
                fullWidth
                multiline
                minRows={3}
                value={form.textAr || ""}
                onChange={set("textAr")}
              />
              <TextField
                label={t("siteUtility.contract.field.textEn")}
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
              label={t("siteUtility.contract.field.order")}
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
                label={t("siteUtility.contract.field.active")}
              />
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t("siteUtility.action.cancel")}
        </Button>
        <Button
          onClick={submit}
          variant="contained"
          disabled={!canSave || saving}
        >
          {saving ? (
            <CircularProgress size={18} />
          ) : isEdit ? (
            t("siteUtility.action.save")
          ) : (
            t("siteUtility.action.create")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteDialog({ open, label, onClose, onConfirm }) {
  const { t } = useT();
  const [deleting, setDeleting] = useState(false);
  const confirm = async () => {
    setDeleting(true);
    const ok = await onConfirm();
    setDeleting(false);
    if (ok) onClose();
  };
  return (
    <Dialog open={open} onClose={deleting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("siteUtility.contract.delete.title")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t("siteUtility.contract.delete.confirm").replace("{label}", label ?? "")}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>
          {t("siteUtility.action.cancel")}
        </Button>
        <Button onClick={confirm} color="error" variant="contained" disabled={deleting}>
          {deleting ? <CircularProgress size={18} /> : t("siteUtility.action.delete")}
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
  const { t } = useT();
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
            {t("siteUtility.action.new")}
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
                  <Chip
                    size="small"
                    variant="outlined"
                    label={t("siteUtility.contract.clause.order").replace(
                      "{order}",
                      String(c.order ?? 0),
                    )}
                  />
                  {"isActive" in c && (
                    <Chip
                      size="small"
                      color={c.isActive ? "success" : "default"}
                      label={
                        c.isActive
                          ? t("siteUtility.contract.clause.active")
                          : t("siteUtility.contract.clause.inactive")
                      }
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
                      {t("siteUtility.action.edit")}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<FiTrash2 />}
                      onClick={() => setDel(c)}
                    >
                      {t("siteUtility.action.delete")}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Typography color="text.secondary">
          {t("siteUtility.contract.clause.empty")}
        </Typography>
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
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.SITE_UTILITY.CONTRACT_UTILITY_VIEW);
  const canEditCode = hasPermission(PERMISSIONS.SITE_UTILITY.CONTRACT_UTILITY_EDIT);

  const cu = useContractUtility({ enabled: canView });
  const canEdit = canEditCode && cu.capabilities?.canEdit;

  if (!canView) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography color="text.secondary">
          {t("siteUtility.contract.denied")}
        </Typography>
      </Box>
    );
  }

  if (cu.loading && !cu.details) {
    return (
      <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 4 }}>
        <CircularProgress size={20} />
        <Typography>{t("siteUtility.state.loading")}</Typography>
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
        <Typography variant="h5">{t("siteUtility.contract.title")}</Typography>
        <Button
          variant="outlined"
          startIcon={<FiRefreshCw />}
          onClick={cu.refetch}
          disabled={cu.loading}
        >
          {t("siteUtility.action.refresh")}
        </Button>
      </Stack>

      {!cu.obligations && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "warning.light" }}>
          <Typography variant="body2">
            {t("siteUtility.contract.notInitialized")}
          </Typography>
        </Paper>
      )}

      <ObligationsSection
        obligations={cu.obligations}
        canEdit={canEdit}
        onSave={cu.saveObligations}
      />

      <ClauseSection
        title={t("siteUtility.contract.section.stages")}
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
        title={t("siteUtility.contract.section.special")}
        kind="special"
        clauses={cu.specialClauses}
        canEdit={canEdit}
        primary={(c) => c.textAr}
        onCreate={cu.createSpecialClause}
        onUpdate={cu.updateSpecialClause}
        onDelete={cu.deleteSpecialClause}
      />

      <ClauseSection
        title={t("siteUtility.contract.section.levels")}
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

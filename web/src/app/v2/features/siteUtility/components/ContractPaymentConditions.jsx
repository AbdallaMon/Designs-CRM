"use client";

import { useEffect, useMemo, useState } from "react";
import {
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
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { FiEdit2, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { useT } from "@/app/v2/lib/i18n";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useContractPaymentConditions } from "../hooks/useContractPaymentConditions.js";
import { CONDITION_TYPE_OPTIONS } from "../config/siteUtilityConstants.js";

// ── Create / edit dialog ───────────────────────────────────────────────────
function ConditionFormDialog({ open, onClose, initialData, onSubmit }) {
  const { t } = useT();
  const isEdit = !!initialData?.id;
  const [conditionType, setConditionType] = useState("");
  const [condition, setCondition] = useState("");
  const [labelAr, setLabelAr] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConditionType(initialData?.conditionType || "");
    setCondition(initialData?.condition || "");
    setLabelAr(initialData?.labelAr || "");
    setLabelEn(initialData?.labelEn || "");
  }, [open, initialData]);

  const conditionOptions = useMemo(
    () => (conditionType ? CONDITION_TYPE_OPTIONS[conditionType] || [] : []),
    [conditionType],
  );

  const canSave = useMemo(
    () =>
      conditionType?.trim() &&
      condition?.trim() &&
      labelAr?.trim() &&
      labelEn?.trim(),
    [conditionType, condition, labelAr, labelEn],
  );

  const submit = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const payload = {
      conditionType: conditionType.trim(),
      condition: condition.trim(),
      labelAr: labelAr.trim(),
      labelEn: labelEn.trim(),
    };
    const res = await onSubmit?.(payload, isEdit ? initialData.id : null);
    setSaving(false);
    if (res) onClose?.();
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit
          ? t("siteUtility.conditions.dialog.editTitle")
          : t("siteUtility.conditions.dialog.createTitle")}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="condition-type-label">
              {t("siteUtility.conditions.field.type")}
            </InputLabel>
            <Select
              labelId="condition-type-label"
              label={t("siteUtility.conditions.field.type")}
              value={conditionType}
              disabled={isEdit}
              onChange={(e) => {
                setConditionType(e.target.value);
                setCondition("");
              }}
            >
              {Object.keys(CONDITION_TYPE_OPTIONS).map((key) => (
                <MenuItem key={key} value={key}>
                  {key}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!conditionType || isEdit}>
            <InputLabel id="condition-label">
              {t("siteUtility.conditions.field.condition")}
            </InputLabel>
            <Select
              labelId="condition-label"
              label={t("siteUtility.conditions.field.condition")}
              value={condition}
              disabled={isEdit}
              onChange={(e) => setCondition(e.target.value)}
            >
              {conditionOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label={t("siteUtility.conditions.field.labelAr")}
            value={labelAr}
            onChange={(e) => setLabelAr(e.target.value)}
            fullWidth
          />
          <TextField
            label={t("siteUtility.conditions.field.labelEn")}
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
            fullWidth
          />

          <Typography variant="caption" color="text.secondary">
            {t("siteUtility.conditions.uniqueNote")}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t("siteUtility.action.cancel")}
        </Button>
        <Button onClick={submit} disabled={!canSave || saving} variant="contained">
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

// ── Delete confirm dialog ──────────────────────────────────────────────────
function DeleteConfirmDialog({ open, row, onClose, onConfirm }) {
  const { t } = useT();
  const [deleting, setDeleting] = useState(false);
  const confirm = async () => {
    setDeleting(true);
    const ok = await onConfirm?.(row?.id);
    setDeleting(false);
    if (ok) onClose?.();
  };
  return (
    <Dialog open={open} onClose={deleting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("siteUtility.conditions.delete.title")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t("siteUtility.conditions.delete.confirm").replace(
            "{label}",
            row?.labelAr ?? "",
          )}
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

/**
 * Contract payment conditions CRUD manager. List + create/edit/delete on the canonical
 * data layer (useContractPaymentConditions → siteUtilityService). Each action is gated on
 * the SITE_UTILITY permission codes (list/create/edit/delete). Row buttons additionally
 * respect the per-row capabilities the list endpoint returns (canEdit, canDelete, inUse):
 * a row that is in use shows a disabled delete with an "in use" hint instead of a button
 * that would 409. Single-language Arabic RTL.
 */
export default function ContractPaymentConditions() {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.SITE_UTILITY.PAYMENT_CONDITION_LIST);
  const canCreate = hasPermission(PERMISSIONS.SITE_UTILITY.PAYMENT_CONDITION_CREATE);
  const canEdit = hasPermission(PERMISSIONS.SITE_UTILITY.PAYMENT_CONDITION_EDIT);
  const canDelete = hasPermission(PERMISSIONS.SITE_UTILITY.PAYMENT_CONDITION_DELETE);

  const { rows, loading, refetch, createCondition, updateCondition, deleteCondition } =
    useContractPaymentConditions();

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);

  const onCreateClick = () => {
    setEditRow(null);
    setFormOpen(true);
  };
  const onEditClick = (row) => {
    setEditRow(row);
    setFormOpen(true);
  };

  const handleSubmit = (payload, id) =>
    id ? updateCondition(id, payload) : createCondition(payload);

  if (!canList) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography color="text.secondary">
          {t("siteUtility.conditions.denied")}
        </Typography>
      </Box>
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
        <Typography variant="h6">{t("siteUtility.conditions.title")}</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FiRefreshCw />}
            onClick={refetch}
            disabled={loading}
          >
            {t("siteUtility.action.refresh")}
          </Button>
          {canCreate && (
            <Button variant="contained" startIcon={<FiPlus />} onClick={onCreateClick}>
              {t("siteUtility.action.new")}
            </Button>
          )}
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={180}>{t("siteUtility.conditions.col.type")}</TableCell>
              <TableCell width={220}>{t("siteUtility.conditions.col.condition")}</TableCell>
              <TableCell>{t("siteUtility.conditions.col.labelAr")}</TableCell>
              <TableCell>{t("siteUtility.conditions.col.labelEn")}</TableCell>
              <TableCell width={120} align="right">
                {t("siteUtility.conditions.col.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CircularProgress size={18} />
                    <Typography>{t("siteUtility.state.loading")}</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : rows?.length ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Chip label={row.conditionType} />
                  </TableCell>
                  <TableCell>{row.condition}</TableCell>
                  <TableCell>{row.labelAr}</TableCell>
                  <TableCell>{row.labelEn}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {canEdit && row.capabilities?.canEdit && (
                        <Tooltip title={t("siteUtility.conditions.tooltip.edit")}>
                          <IconButton size="small" onClick={() => onEditClick(row)}>
                            <FiEdit2 />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete &&
                        (row.capabilities?.canDelete ? (
                          <Tooltip title={t("siteUtility.conditions.tooltip.delete")}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteRow(row)}
                            >
                              <FiTrash2 />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip
                            title={
                              row.capabilities?.inUse
                                ? t("siteUtility.conditions.tooltip.inUse")
                                : t("siteUtility.conditions.tooltip.cannotDelete")
                            }
                          >
                            <span>
                              <IconButton size="small" color="error" disabled>
                                <FiTrash2 />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ))}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">
                    {t("siteUtility.conditions.empty")}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <ConditionFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={editRow}
        onSubmit={handleSubmit}
      />
      <DeleteConfirmDialog
        open={Boolean(deleteRow)}
        row={deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={deleteCondition}
      />
    </Box>
  );
}

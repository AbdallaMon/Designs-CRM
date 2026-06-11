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
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useContractPaymentConditions } from "../hooks/useContractPaymentConditions.js";
import { CONDITION_TYPE_OPTIONS } from "../config/siteUtilityConstants.js";

// ── Create / edit dialog ───────────────────────────────────────────────────
function ConditionFormDialog({ open, onClose, initialData, onSubmit }) {
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
      <DialogTitle>{isEdit ? "تعديل شرط الدفع" : "إنشاء شرط دفع"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="condition-type-label">النوع</InputLabel>
            <Select
              labelId="condition-type-label"
              label="النوع"
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
            <InputLabel id="condition-label">الشرط</InputLabel>
            <Select
              labelId="condition-label"
              label="الشرط"
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
            label="الاسم (عربي)"
            value={labelAr}
            onChange={(e) => setLabelAr(e.target.value)}
            fullWidth
          />
          <TextField
            label="الاسم (إنجليزي)"
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
            fullWidth
          />

          <Typography variant="caption" color="text.secondary">
            ملاحظة: (النوع، الشرط، الاسم العربي، الاسم الإنجليزي) يجب أن تكون فريدة معًا.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          إلغاء
        </Button>
        <Button onClick={submit} disabled={!canSave || saving} variant="contained">
          {saving ? <CircularProgress size={18} /> : isEdit ? "حفظ" : "إنشاء"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Delete confirm dialog ──────────────────────────────────────────────────
function DeleteConfirmDialog({ open, row, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const confirm = async () => {
    setDeleting(true);
    const ok = await onConfirm?.(row?.id);
    setDeleting(false);
    if (ok) onClose?.();
  };
  return (
    <Dialog open={open} onClose={deleting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>حذف شرط الدفع</DialogTitle>
      <DialogContent>
        <DialogContentText>
          هل أنت متأكد من حذف &quot;{row?.labelAr}&quot;؟
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

/**
 * Contract payment conditions CRUD manager. List + create/edit/delete on the canonical
 * data layer (useContractPaymentConditions → siteUtilityService). Each action is gated on
 * the SITE_UTILITY permission codes (list/create/edit/delete). Row buttons additionally
 * respect the per-row capabilities the list endpoint returns (canEdit, canDelete, inUse):
 * a row that is in use shows a disabled delete with an "in use" hint instead of a button
 * that would 409. Single-language Arabic RTL.
 */
export default function ContractPaymentConditions() {
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
          لا تملك صلاحية عرض شروط دفع العقود.
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
        <Typography variant="h6">شروط دفع العقود</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FiRefreshCw />}
            onClick={refetch}
            disabled={loading}
          >
            تحديث
          </Button>
          {canCreate && (
            <Button variant="contained" startIcon={<FiPlus />} onClick={onCreateClick}>
              جديد
            </Button>
          )}
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={180}>النوع</TableCell>
              <TableCell width={220}>الشرط</TableCell>
              <TableCell>الاسم (عربي)</TableCell>
              <TableCell>الاسم (إنجليزي)</TableCell>
              <TableCell width={120} align="right">
                الإجراءات
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CircularProgress size={18} />
                    <Typography>جاري التحميل...</Typography>
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
                        <Tooltip title="تعديل">
                          <IconButton size="small" onClick={() => onEditClick(row)}>
                            <FiEdit2 />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete &&
                        (row.capabilities?.canDelete ? (
                          <Tooltip title="حذف">
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
                                ? "قيد الاستخدام — لا يمكن الحذف"
                                : "لا يمكن الحذف"
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
                    لا توجد شروط دفع بعد.
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

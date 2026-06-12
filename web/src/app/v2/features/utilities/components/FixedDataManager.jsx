"use client";

// Fixed Data CRUD manager — the studio's static/lookup-data admin. List + create + edit +
// delete on the canonical data layer (useFixedData → utilitiesService). The list read is
// gated on UTILITY.FIXED_DATA_LIST; the writes are a SEPARATE module/permission
// (ADMIN_RESIDUAL.FIXED_DATA_MANAGE → /v2/admin/fixed-data), so create/edit/delete buttons
// gate on that code. The backend returns no per-record capabilities for fixed-data, so row
// actions gate purely on the manage code (the server still enforces). Single-language
// Arabic RTL. Mirrors features/siteUtility/components/ContractPaymentConditions.jsx.

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
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
import { useFixedData } from "../hooks/useFixedData.js";
import { fixedDataColumns } from "../config/utilitiesColumns.js";

// ── Create / edit dialog ───────────────────────────────────────────────────
function FixedDataFormDialog({ open, onClose, initialData, onSubmit }) {
  const isEdit = !!initialData?.id;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initialData?.title || "");
    setDescription(initialData?.description || "");
  }, [open, initialData]);

  // create requires title; edit requires at least one changed/present field — title is the
  // primary identifier so we keep it required in the form for both modes.
  const canSave = useMemo(() => Boolean(title?.trim()), [title]);

  const submit = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const payload = {
      title: title.trim(),
      // send description even when emptied so an edit can clear it (server treats
      // description as nullish/optional).
      description: description.trim() === "" ? null : description.trim(),
    };
    const res = await onSubmit?.(payload, isEdit ? initialData.id : null);
    setSaving(false);
    if (res) onClose?.();
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "تعديل البيانات الثابتة" : "إضافة بيانات ثابتة"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="العنوان"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label="الوصف"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          إلغاء
        </Button>
        <Button onClick={submit} disabled={!canSave || saving} variant="contained">
          {saving ? <CircularProgress size={18} /> : isEdit ? "حفظ" : "إضافة"}
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
      <DialogTitle>حذف البيانات الثابتة</DialogTitle>
      <DialogContent>
        <DialogContentText>
          هل أنت متأكد من حذف &quot;{row?.title}&quot;؟
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
 * Fixed-data CRUD tab. Read is gated on UTILITY.FIXED_DATA_LIST; mutations on
 * ADMIN_RESIDUAL.FIXED_DATA_MANAGE. Loading / empty states included.
 */
export default function FixedDataManager() {
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.UTILITY.FIXED_DATA_LIST);
  const canManage = hasPermission(PERMISSIONS.ADMIN_RESIDUAL.FIXED_DATA_MANAGE);

  const { rows, loading, refetch, createFixedData, updateFixedData, deleteFixedData } =
    useFixedData({ enabled: canList });

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
    id ? updateFixedData(id, payload) : createFixedData(payload);

  if (!canList) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography color="text.secondary">
          لا تملك صلاحية عرض البيانات الثابتة.
        </Typography>
      </Box>
    );
  }

  const colCount = fixedDataColumns.length + 1; // + actions column

  return (
    <Box sx={{ py: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">البيانات الثابتة</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FiRefreshCw />}
            onClick={refetch}
            disabled={loading}
          >
            تحديث
          </Button>
          {canManage && (
            <Button variant="contained" startIcon={<FiPlus />} onClick={onCreateClick}>
              إضافة
            </Button>
          )}
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {fixedDataColumns.map((c) => (
                <TableCell key={c.field}>{c.headerName}</TableCell>
              ))}
              <TableCell width={120} align="right">
                الإجراءات
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colCount}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CircularProgress size={18} />
                    <Typography>جاري التحميل...</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : rows?.length ? (
              rows.map((row) => (
                <TableRow key={row.id} hover>
                  {fixedDataColumns.map((c) => (
                    <TableCell key={c.field}>{c.accessor(row)}</TableCell>
                  ))}
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {canManage && (
                        <>
                          <Tooltip title="تعديل">
                            <IconButton size="small" onClick={() => onEditClick(row)}>
                              <FiEdit2 />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="حذف">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteRow(row)}
                            >
                              <FiTrash2 />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={colCount}>
                  <Typography color="text.secondary">لا توجد بيانات ثابتة بعد.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <FixedDataFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={editRow}
        onSubmit={handleSubmit}
      />
      <DeleteConfirmDialog
        open={Boolean(deleteRow)}
        row={deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={deleteFixedData}
      />
    </Box>
  );
}

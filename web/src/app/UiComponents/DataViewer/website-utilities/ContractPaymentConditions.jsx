"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  Typography,
  Divider,
  Chip,
  CircularProgress,
} from "@mui/material";
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from "react-icons/fi";

import { PROJECT_STATUSES } from "@/app/helpers/constants";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import DeleteModal from "../../models/DeleteModal";
import DeleteModelButton from "../../common/DeleteModelButton";

function RowActions({ row, onEditClick, onDelete }) {
  return (
    <Stack direction="row" spacing={1}>
      <Tooltip title="Edit">
        <IconButton size="small" onClick={() => onEditClick(row)}>
          <FiEdit2 />
        </IconButton>
      </Tooltip>
      <DeleteModelButton
        item={row}
        model={"contractPaymentCondition"}
        contentKey="labelAr"
        onDelete={() => {
          onDelete();
        }}
      />
    </Stack>
  );
}

// -----------------------------------------------
// Create/Edit Dialog
// -----------------------------------------------
function ConditionFormDialog({
  open,
  onClose,
  initialData, // { id?, conditionType, condition, labelAr, labelEn }
  onSaved, // callback after successful create/update
  baseUrl = "shared/site-utilities/contract-payment-conditions",
}) {
  const isEdit = !!initialData?.id;

  const [conditionType, setConditionType] = useState(
    initialData?.conditionType || ""
  );
  const [condition, setCondition] = useState(initialData?.condition || "");
  const [labelAr, setLabelAr] = useState(initialData?.labelAr || "");
  const [labelEn, setLabelEn] = useState(initialData?.labelEn || "");

  const { loading: saving, setLoading: setSaving } = useToastContext();

  useEffect(() => {
    if (!open) return;
    setConditionType(initialData?.conditionType || "");
    setCondition(initialData?.condition || "");
    setLabelAr(initialData?.labelAr || "");
    setLabelEn(initialData?.labelEn || "");
  }, [open, initialData]);

  const conditionOptions = useMemo(() => {
    if (!conditionType) return [];
    return PROJECT_STATUSES[conditionType] || [];
  }, [conditionType]);

  const canSave = useMemo(() => {
    return (
      conditionType?.trim() &&
      condition?.trim() &&
      labelAr?.trim() &&
      labelEn?.trim()
    );
  }, [conditionType, condition, labelAr, labelEn]);

  const submit = async () => {
    if (!canSave) return;

    const payload = {
      conditionType: conditionType.trim(),
      condition: condition.trim(),
      labelAr: labelAr.trim(),
      labelEn: labelEn.trim(),
    };

    const url = isEdit ? `${baseUrl}/${initialData.id}` : baseUrl;
    const message = isEdit
      ? "Updating payment condition..."
      : "Creating payment condition...";

    const res = await handleRequestSubmit(
      payload,
      setSaving,
      url,
      false,
      message,
      false,
      isEdit ? "PUT" : "POST"
    );

    // Your routes return 200 on success (with {data, message})
    if (res?.status === 200) {
      onSaved?.();
      onClose?.();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {isEdit ? "Edit Payment Condition" : "Create Payment Condition"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="condition-type-label">Type</InputLabel>
            <Select
              labelId="condition-type-label"
              label="Type"
              value={conditionType}
              disabled={isEdit}
              onChange={(e) => {
                setConditionType(e.target.value);
                // reset condition when switching type
                setCondition("");
              }}
            >
              {Object.keys(PROJECT_STATUSES).map((key) => (
                <MenuItem key={key} value={key}>
                  {key}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!conditionType}>
            <InputLabel id="condition-label">Condition</InputLabel>
            <Select
              labelId="condition-label"
              label="Condition"
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
            label="Label (Arabic)"
            value={labelAr}
            onChange={(e) => setLabelAr(e.target.value)}
            fullWidth
          />
          <TextField
            label="Label (English)"
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
            fullWidth
          />

          <Typography variant="caption" color="text.secondary">
            Note: (Type, Condition, LabelAr, LabelEn) must be unique together.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={!canSave || saving}
          variant="contained"
        >
          {saving ? <CircularProgress size={18} /> : isEdit ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Main Manager (list + actions)
// -----------------------------------------------
export default function ContractPaymentConditionsManager({
  baseUrl = "shared/site-utilities/contract-payment-conditions",
  fetchUrl = "shared/site-utilities/contract-payment-conditions",
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoadingState] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  const fetchData = useCallback(async () => {
    await getDataAndSet({
      url: fetchUrl,
      setData: setRows,
      setLoading: setLoadingState,
    });
  }, [fetchUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onCreateClick = () => {
    setEditRow(null);
    setFormOpen(true);
  };

  const onEditClick = (row) => {
    setEditRow(row);
    setFormOpen(true);
  };

  const onSaved = () => {
    fetchData();
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Contract Payment Conditions</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FiRefreshCw />}
            onClick={fetchData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<FiPlus />}
            onClick={onCreateClick}
          >
            New
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={180}>Type</TableCell>
              <TableCell width={220}>Condition</TableCell>
              <TableCell>Label (AR)</TableCell>
              <TableCell>Label (EN)</TableCell>
              <TableCell width={120} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CircularProgress size={18} />
                    <Typography>Loading...</Typography>
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
                    <RowActions
                      row={row}
                      onEditClick={onEditClick}
                      onDelete={fetchData}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">
                    No payment conditions yet.
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
        onSaved={onSaved}
        baseUrl={baseUrl}
      />
    </Box>
  );
}

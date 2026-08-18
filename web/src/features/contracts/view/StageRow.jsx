"use client";

import { useState } from "react";
import {
  Stack,
  Card,
  CardHeader,
  CardContent,
  Divider,
  IconButton,
  TextField,
  useTheme,
  alpha,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { FaEdit, FaSave, FaTimes, FaTrash, FaWrench } from "react-icons/fa";
import { PERMISSIONS, WORK_STAGE_STATUSES } from "@dms/shared";
import { STAGE_STATUS } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { usePermission } from "@/app/hooks/usePermission.js";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import ConfirmDialog from "@/features/contracts/view/ConfirmDialog.jsx";
import {
  diffPayload,
  canEditStageDays,
  canDeleteStage,
} from "@/features/contracts/view/viewContractHelpers.js";

export default function StageRow({ stage, onReload, contractId }) {
  const theme = useTheme();
  const [edit, setEdit] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState(stage.stageStatus);
  const [overrideReason, setOverrideReason] = useState("");
  const [form, setForm] = useState({
    deliveryDays: stage.deliveryDays || 0,
    deptDeliveryDays: stage.deptDeliveryDays || 0,
  });
  const { setLoading } = useToastContext();
  const { hasPermission } = usePermission();

  const save = async () => {
    const payload = diffPayload(
      {
        deliveryDays: stage.deliveryDays,
        deptDeliveryDays: stage.deptDeliveryDays,
      },
      form
    );
    if (Object.keys(payload).length === 0) {
      setEdit(false);
      return;
    }
    const req = await handleRequestSubmit(
      payload,
      setLoading,
      `contracts/${contractId}/stages/${stage.id}`,
      false,
      "Updating",
      false,
      "PUT"
    );

    if (req.status === 200) {
      setEdit(false);
      await onReload();
    }
  };

  const remove = async () => {
    const req = await handleRequestSubmit(
      {},
      setLoading,
      `contracts/${contractId}/stages/${stage.id}`,
      false,
      "Updating",
      false,
      "DELETE"
    );

    if (req.status === 200) {
      await onReload();
    }
  };

  const submitOverride = async () => {
    const req = await handleRequestSubmit(
      { status: overrideStatus, reason: overrideReason.trim() },
      setLoading,
      `contracts/${contractId}/stages/${stage.id}/actions/override-status`,
      false,
      "Repairing stage workflow",
      false,
      "POST"
    );

    if (req.status === 200) {
      setOverrideOpen(false);
      setOverrideReason("");
      await onReload();
    }
  };

  const editable = canEditStageDays(stage.stageStatus);
  const deletable = canDeleteStage(stage.stageStatus);
  const canOverride = hasPermission(PERMISSIONS.CONTRACT.STAGE_OVERRIDE_STATUS);

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.08
          )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
          transition: "all 0.3s ease",
        }}
      >
        <CardHeader
          title={stage.title}
          subheader={`Status: ${
            STAGE_STATUS[stage.stageStatus] || stage.stageStatus
          }`}
          titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
          action={
            <Stack direction="row" spacing={0.5}>
              {edit ? (
                <>
                  <IconButton color="primary" onClick={save} size="small">
                    <FaSave />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => setEdit(false)}
                    size="small"
                  >
                    <FaTimes />
                  </IconButton>
                </>
              ) : (
                <IconButton
                  onClick={() => {
                    if (!editable) return;
                    setForm({
                      deliveryDays: stage.deliveryDays || 0,
                      deptDeliveryDays: stage.deptDeliveryDays || 0,
                    });
                    setEdit(true);
                  }}
                  disabled={!editable}
                  size="small"
                  title={editable ? "Edit" : "Locked when completed"}
                >
                  <FaEdit />
                </IconButton>
              )}
              <IconButton
                color="error"
                onClick={() => deletable && setConfirmOpen(true)}
                disabled={!deletable}
                size="small"
                title={deletable ? "Delete" : "Only deletable if not started"}
              >
                <FaTrash />
              </IconButton>
              {canOverride && (
                <IconButton
                  color="warning"
                  onClick={() => {
                    setOverrideStatus(stage.stageStatus);
                    setOverrideReason("");
                    setOverrideOpen(true);
                  }}
                  size="small"
                  title="Override stage status (audited admin repair)"
                >
                  <FaWrench />
                </IconButton>
              )}
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Delivery Days"
                type="number"
                value={edit ? form.deliveryDays : stage.deliveryDays || 0}
                onChange={(e) =>
                  setForm((o) => ({
                    ...o,
                    deliveryDays: Number(e.target.value),
                  }))
                }
                disabled={!edit}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Department Days"
                type="number"
                value={edit ? form.deptDeliveryDays : stage.deptDeliveryDays || 0}
                onChange={(e) =>
                  setForm((o) => ({
                    ...o,
                    deptDeliveryDays: Number(e.target.value),
                  }))
                }
                disabled={!edit}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await remove();
          setConfirmOpen(false);
        }}
        title="Delete Stage"
        content={`Delete stage "${stage.title}"? This action cannot be undone.`}
      />

      <Dialog open={overrideOpen} onClose={() => setOverrideOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Override stage workflow</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id={`override-stage-status-${stage.id}`}>Target status</InputLabel>
              <Select
                labelId={`override-stage-status-${stage.id}`}
                value={overrideStatus}
                label="Target status"
                onChange={(event) => setOverrideStatus(event.target.value)}
              >
                {Object.values(WORK_STAGE_STATUSES).map((value) => (
                  <MenuItem key={value} value={value}>
                    {STAGE_STATUS[value] || value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Repair reason"
              value={overrideReason}
              onChange={(event) => setOverrideReason(event.target.value)}
              helperText="Required for the audit trail (minimum 5 characters)."
              multiline
              minRows={3}
              inputProps={{ maxLength: 500 }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={submitOverride}
            disabled={overrideReason.trim().length < 5}
          >
            Apply audited override
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

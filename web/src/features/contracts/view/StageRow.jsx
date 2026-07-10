"use client";

import { useEffect, useState } from "react";
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
} from "@mui/material";
import { FaEdit, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import { STAGE_STATUS } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
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
  const [form, setForm] = useState({
    deliveryDays: stage.deliveryDays || 0,
    deptDeliveryDays: stage.deptDeliveryDays || 0,
  });
  const { setLoading } = useToastContext();

  useEffect(() => {
    setForm({
      deliveryDays: stage.deliveryDays || 0,
      deptDeliveryDays: stage.deptDeliveryDays || 0,
    });
  }, [stage.id, stage.deliveryDays, stage.deptDeliveryDays]);

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
      `shared/contracts/${contractId}/stages/${stage.id}`,
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
      `shared/contracts/${contractId}/stages/${stage.id}`,
      false,
      "Updating",
      false,
      "DELETE"
    );

    if (req.status === 200) {
      await onReload();
    }
  };

  const editable = canEditStageDays(stage.stageStatus);
  const deletable = canDeleteStage(stage.stageStatus);

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
                  onClick={() => editable && setEdit(true)}
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
                value={form.deliveryDays}
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
                value={form.deptDeliveryDays}
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
    </>
  );
}

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
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import ConfirmDialog from "@/features/contracts/view/ConfirmDialog.jsx";
import { diffPayload } from "@/features/contracts/view/viewContractHelpers.js";

export default function SpecialItemRow({ item, contractId, onReload }) {
  const theme = useTheme();
  const [edit, setEdit] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    labelAr: item.labelAr,
    labelEn: item.labelEn || "",
  });

  const { setLoading } = useToastContext();
  useEffect(() => {
    setForm({ labelAr: item.labelAr, labelEn: item.labelEn || "" });
  }, [item.id, item.labelAr, item.labelEn]);

  const save = async () => {
    const payload = diffPayload(
      { labelAr: item.labelAr, labelEn: item.labelEn || "" },
      form
    );
    if (Object.keys(payload).length === 0) return setEdit(false);
    const req = await handleRequestSubmit(
      payload,
      setLoading,
      `contracts/${contractId}/special-items/${item.id}`,
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
      `contracts/${contractId}/special-items/${item.id}`,
      false,
      "Updating",
      false,
      "DELETE"
    );

    if (req.status === 200) {
      await onReload();
    }
  };

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.warning.main,
            0.05
          )} 0%, ${alpha(theme.palette.warning.main, 0.01)} 100%)`,
          borderRadius: 2,
          "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
          transition: "all 0.3s ease",
        }}
      >
        <CardHeader
          title={item.labelAr}
          subheader={item.labelEn || "No English translation"}
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
                <IconButton onClick={() => setEdit(true)} size="small">
                  <FaEdit />
                </IconButton>
              )}
              <IconButton
                color="error"
                onClick={() => setConfirmOpen(true)}
                size="small"
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
                label="Item Name (Arabic)"
                value={form.labelAr}
                onChange={(e) =>
                  setForm((o) => ({ ...o, labelAr: e.target.value }))
                }
                disabled={!edit}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Item Name (English)"
                value={form.labelEn}
                onChange={(e) =>
                  setForm((o) => ({ ...o, labelEn: e.target.value }))
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
        title="Delete Special Item"
        content={`Delete special item "${item.labelAr}"? This action cannot be undone.`}
      />
    </>
  );
}

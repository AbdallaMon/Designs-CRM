"use client";

// <CommissionDialog /> — create OR edit a commission (RHF Controller dialog, mirrors
// CreateUserModal). CREATE builds the EXACT BE .strict() body { userId, leadId, amount,
// commissionReason }; EDIT sends only { amount } (the BE update schema). Submits via the SERVICE
// through runAdminResidualMutation (envelope CODE → Arabic toast). Gated at the CALL SITE on
// COMMISSION_MANAGE. The service `pick()`s the whitelist again as a second guard. Arabic / RTL.

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { adminResidualService } from "../adminResidual.service.js";
import { runAdminResidualMutation } from "../adminResidual.mutations.js";

const CREATE_DEFAULTS = { userId: "", leadId: "", amount: "", commissionReason: "" };

export function CommissionDialog({ open, mode = "create", userId, commission, onClose, onSaved }) {
  const isEdit = mode === "edit";
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, reset } = useForm({ defaultValues: CREATE_DEFAULTS });

  useEffect(() => {
    if (!open) return;
    if (isEdit && commission) {
      reset({
        userId: String(commission.userId ?? userId ?? ""),
        leadId: String(commission.leadId ?? ""),
        amount: String(commission.amount ?? ""),
        commissionReason: commission.commissionReason ?? commission.reason ?? "",
      });
    } else {
      reset({ ...CREATE_DEFAULTS, userId: String(userId ?? "") });
    }
  }, [open, isEdit, commission, userId, reset]);

  function close() {
    reset(CREATE_DEFAULTS);
    onClose?.();
  }

  async function onSubmit(values) {
    let fn;
    if (isEdit) {
      // EDIT: BE .strict() accepts only { amount }.
      fn = () => adminResidualService.updateCommission(commission.id, { amount: Number(values.amount) });
    } else {
      // CREATE: BE .strict() body { userId, leadId, amount, commissionReason }.
      fn = () =>
        adminResidualService.createCommission({
          userId: Number(values.userId),
          leadId: Number(values.leadId),
          amount: Number(values.amount),
          commissionReason: values.commissionReason.trim(),
        });
    }
    const res = await runAdminResidualMutation(fn, {
      loading: isEdit ? "جاري تحديث العمولة..." : "جاري إضافة العمولة...",
      setLoading: setSubmitting,
    });
    if (res) {
      close();
      onSaved?.(res.data);
    }
  }

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth dir="rtl">
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
        {isEdit ? "تعديل العمولة" : "إضافة عمولة"}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {!isEdit && (
              <>
                <Controller
                  name="userId"
                  control={control}
                  rules={{ required: "معرّف الموظف مطلوب" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="معرّف الموظف"
                      fullWidth
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="leadId"
                  control={control}
                  rules={{ required: "معرّف العميل المحتمل مطلوب" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="معرّف العميل المحتمل"
                      fullWidth
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="commissionReason"
                  control={control}
                  rules={{ required: "سبب العمولة مطلوب" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="سبب العمولة"
                      fullWidth
                      multiline
                      minRows={2}
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </>
            )}
            <Controller
              name="amount"
              control={control}
              rules={{
                required: "قيمة العمولة مطلوبة",
                validate: (v) => Number(v) > 0 || "قيمة العمولة غير صحيحة",
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  type="number"
                  label="القيمة"
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={close} variant="outlined" disabled={submitting}>
            إلغاء
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={submitting}>
            {isEdit ? "حفظ" : "إضافة"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CommissionDialog;

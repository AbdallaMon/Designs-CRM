"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useT } from "@/app/v2/lib/i18n";

export function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  isLoading = false,
  confirmButtonText,
  cancelButtonText,
  confirmButtonColor = "error",
}) {
  const { t } = useT();
  const confirmLabel = confirmButtonText ?? t("chat.confirm.delete", "حذف");
  const cancelLabel = cancelButtonText ?? t("chat.confirm.cancel", "إلغاء");
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth sx={{ zIndex: 1304 }}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button variant="contained" color={confirmButtonColor} onClick={onConfirm} disabled={isLoading}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

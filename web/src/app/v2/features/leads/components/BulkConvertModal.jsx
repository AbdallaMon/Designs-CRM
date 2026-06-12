"use client";

// Bulk-convert modal — admin-tier collection action (was DataViewer/Kanban/shared/
// BulkConvertLeadsModal). PUT /leads/bulk-convert body { ids:[...], userId }. Gated by
// PERMISSIONS.LEAD.ASSIGN_OTHER on the page (the only capability that authorizes it);
// the server re-enforces. userId is entered directly here (the legacy modal picked a
// sales user from a directory dropdown — the directory feature isn't migrated yet, so we
// accept the id; reported as a known simplification).

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { leadsService } from "../leads.service.js";
import { runLeadMutation } from "../leads.mutations.js";

export function BulkConvertModal({ open, onClose, selectedIds = [], onDone }) {
  const [userId, setUserId] = useState("");
  const { setLoading } = useToastContext();

  async function handleConvert() {
    if (!userId || selectedIds.length === 0) return;
    const res = await runLeadMutation(
      () => leadsService.bulkConvertLeads({ ids: selectedIds, userId: Number(userId) }),
      { setLoading, loading: "جاري التحويل الجماعي..." },
    );
    if (res) {
      setUserId("");
      onDone?.(res.data);
      onClose?.();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth dir="rtl">
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>تحويل جماعي</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            عدد العملاء المحددين: {selectedIds.length}
          </Typography>
          <TextField
            label="رقم الموظف المستلم"
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Button onClick={onClose} variant="outlined">
          إلغاء
        </Button>
        <Button
          onClick={handleConvert}
          variant="contained"
          disabled={!userId || selectedIds.length === 0}
        >
          تحويل
        </Button>
      </DialogActions>
    </Dialog>
  );
}

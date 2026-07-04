import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { apiRequest } from "@/app/helpers/functions/apiClient";
import { usePermission } from "@/app/hooks/usePermission";
import { USER_CODES } from "@/app/helpers/permissionCodes";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  alpha,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Radio,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { FiLayers } from "react-icons/fi";

// Admin manager for a user's DB-relational permission PROFILES: pick the assigned
// set + which is the active (current) one. Replaces role/sub-role juggling for the
// switchable-profile model. Gated by user.manage_roles (mirrors RoleManagerDialog).
export function ProfileManagerDialog({ userId, userProfiles = [], currentProfileId, setData }) {
  const [open, setOpen] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [current, setCurrent] = useState(currentProfileId ?? null);
  const { setLoading } = useToastContext();
  const { hasPermission } = usePermission();
  const admin = hasPermission(USER_CODES.MANAGE_ROLES);

  const heldIds = useMemo(
    () => userProfiles.map((up) => up.profileId ?? up.profile?.id).filter((x) => x != null),
    [userProfiles],
  );

  useEffect(() => {
    if (!open) return;
    setSelectedIds(heldIds);
    setCurrent(currentProfileId ?? heldIds[0] ?? null);
    (async () => {
      const res = await apiRequest("admin/users/assignable-profiles");
      if (res.ok) {
        const body = await res.json();
        setAllProfiles(body?.data?.items ?? body?.data ?? []);
      }
    })();
  }, [open, heldIds, currentProfileId]);

  function toggle(id) {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (!next.includes(current)) setCurrent(next[0] ?? null);
      return next;
    });
  }

  async function onSave() {
    if (selectedIds.length === 0) return;
    const req = await handleRequestSubmit(
      { profileIds: selectedIds, currentProfileId: current },
      setLoading,
      `admin/users/${userId}/profiles`,
      false,
      "جارٍ تحديث الملفات الوظيفية...",
      null,
      "PUT",
    );
    if (req.status === 200 || req?.success === true) {
      if (setData) setData((prev) => (Array.isArray(prev) ? [...prev] : prev));
      window.location.reload();
      setOpen(false);
    }
  }

  if (!admin) return null;
  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        variant="contained"
        fullWidth
        startIcon={<FiLayers />}
        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
      >
        اسناد دور
      </Button>
    );
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.25, fontWeight: 700 }}>
        <Box
          sx={{
            width: 36, height: 36, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center",
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12), color: "primary.main",
          }}
        >
          <FiLayers />
        </Box>
        اسناد الأدوار
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Typography variant="overline" fontWeight={700} color="text.secondary">
          اختر الأدوار المُسندة و الدور النشط
        </Typography>
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {allProfiles.map((p) => {
            const checked = selectedIds.includes(p.id);
            return (
              <Box
                key={p.id}
                sx={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  px: 1.5, py: 0.5, borderRadius: 2,
                  border: (t) => `1px solid ${checked ? alpha(t.palette.primary.main, 0.4) : t.palette.divider}`,
                  bgcolor: (t) => (checked ? alpha(t.palette.primary.main, 0.05) : "transparent"),
                }}
              >
                <FormControlLabel
                  control={<Checkbox checked={checked} onChange={() => toggle(p.id)} />}
                  label={<Typography fontWeight={600}>{p.label ?? p.key}</Typography>}
                />
                <FormControlLabel
                  control={
                    <Radio
                      checked={current === p.id}
                      disabled={!checked}
                      onChange={() => setCurrent(p.id)}
                    />
                  }
                  label={<Typography variant="caption" color="text.secondary">نشط</Typography>}
                  labelPlacement="start"
                />
              </Box>
            );
          })}
        </Stack>
        {selectedIds.length === 0 && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
            يجب إسناد دور واحد على الأقل.
          </Typography>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={() => setOpen(false)} color="inherit" sx={{ textTransform: "none" }}>
          إلغاء
        </Button>
        <Button
          onClick={onSave}
          color="primary"
          variant="contained"
          disabled={selectedIds.length === 0}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          حفظ
        </Button>
      </DialogActions>
    </Dialog>
  );
}

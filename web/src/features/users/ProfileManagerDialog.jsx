import { PROFILES } from "@dms/shared";
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
import { PROFILE_LABEL } from "@/features/users/pages/users/config.jsx";
import { applyProfilesToUserRows } from "@/features/users/user-management-state.js";

// The three hierarchical STAFF-sales profiles — a user may hold at most ONE of them
// (other families combine freely). Mirrored by the backend guard in user.usecase.
const SALES_TIER = [PROFILES.NORMAL_SALES, PROFILES.PRIMARY_SALES, PROFILES.SUPER_SALES];

function assignedProfileIds(userProfiles) {
  return userProfiles
    .map((up) => up.profileId ?? up.profile?.id)
    .filter((id) => id != null);
}

// Admin manager for a user's DB-relational permission PROFILES: pick the assigned
// set + which is the active (current) one. Replaces role/sub-role juggling for the
// switchable-profile model. Gated by user.manage_roles (mirrors RoleManagerDialog).
// `startOpen` opens it immediately (used right after creating a user); `hideTrigger`
// suppresses the "Assign profile" button; `onClose` fires when it closes.
export function ProfileManagerDialog({
  userId,
  userProfiles = [],
  currentProfileId,
  setData,
  startOpen = false,
  hideTrigger = false,
  onClose,
}) {
  const [open, setOpen] = useState(startOpen);
  const initialHeldIds = assignedProfileIds(userProfiles);
  const closeDialog = () => {
    setOpen(false);
    onClose?.();
  };
  const [allProfiles, setAllProfiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState(initialHeldIds);
  const [current, setCurrent] = useState(
    currentProfileId ?? initialHeldIds[0] ?? null,
  );
  const { setLoading } = useToastContext();
  const { hasPermission } = usePermission();
  const admin = hasPermission(USER_CODES.MANAGE_PROFILES);

  const heldIds = useMemo(
    () => assignedProfileIds(userProfiles),
    [userProfiles],
  );

  const openDialog = () => {
    setSelectedIds(heldIds);
    setCurrent(currentProfileId ?? heldIds[0] ?? null);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    (async () => {
      const res = await apiRequest("users/assignable-profiles");
      if (res.ok) {
        const body = await res.json();
        setAllProfiles(body?.data?.items ?? body?.data ?? []);
      }
    })();
  }, [open]);

  // Sales tier is mutually exclusive: at most one of Sales / Primary sales / Super sales.
  const keyById = useMemo(
    () => Object.fromEntries(allProfiles.map((p) => [p.id, p.key])),
    [allProfiles],
  );

  function toggle(id) {
    setSelectedIds((prev) => {
      let next;
      if (prev.includes(id)) {
        next = prev.filter((x) => x !== id);
      } else if (SALES_TIER.includes(keyById[id])) {
        // selecting a sales-tier profile drops any other sales-tier one already selected
        next = [...prev.filter((x) => !SALES_TIER.includes(keyById[x])), id];
      } else {
        next = [...prev, id];
      }
      if (!next.includes(current)) setCurrent(next[0] ?? null);
      return next;
    });
  }

  async function onSave() {
    if (selectedIds.length === 0) return;
    const req = await handleRequestSubmit(
      { profileIds: selectedIds, currentProfileId: current },
      setLoading,
      `users/${userId}/profiles`,
      false,
      "Updating profiles...",
      null,
      "PUT",
    );
    if (req.status === 200 || req?.success === true) {
      if (setData) {
        setData((prev) =>
          applyProfilesToUserRows(prev, {
            userId,
            profileIds: req.data?.profileIds ?? selectedIds,
            currentProfileId: req.data?.currentProfileId ?? current,
            availableProfiles: allProfiles,
          }),
        );
      }
      closeDialog();
    }
  }

  if (!admin) return null;
  if (!open) {
    if (hideTrigger) return null;
    return (
      <Button
        onClick={openDialog}
        variant="contained"
        fullWidth
        startIcon={<FiLayers />}
        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
      >
        Assign profile
      </Button>
    );
  }

  return (
    <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.25, fontWeight: 700 }}>
        <Box
          sx={{
            width: 36, height: 36, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center",
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12), color: "primary.main",
          }}
        >
          <FiLayers />
        </Box>
        Assign profiles
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Typography variant="overline" fontWeight={700} color="text.secondary">
          Select the assigned profiles and the active profile
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          Only one sales level (Sales, Primary sales, or Super sales) can be assigned; other
          profiles can be combined freely.
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
                  label={<Typography fontWeight={600}>{PROFILE_LABEL[p.key] ?? p.label ?? p.key}</Typography>}
                />
                <FormControlLabel
                  control={
                    <Radio
                      checked={current === p.id}
                      disabled={!checked}
                      onChange={() => setCurrent(p.id)}
                    />
                  }
                  label={<Typography variant="caption" color="text.secondary">Active</Typography>}
                  labelPlacement="start"
                />
              </Box>
            );
          })}
        </Stack>
        {selectedIds.length === 0 && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
            At least one profile must be assigned.
          </Typography>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={closeDialog} color="inherit" sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          onClick={onSave}
          color="primary"
          variant="contained"
          disabled={selectedIds.length === 0}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

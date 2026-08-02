"use client";

import { useEffect, useMemo, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Radio,
  Stack,
  Typography,
} from "@mui/material";
import { FiLayers } from "react-icons/fi";

import { apiRequest } from "@/app/helpers/functions/apiClient";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { usePermission } from "@/app/hooks/usePermission";
import { USER_CODES } from "@/app/helpers/permissionCodes";
import { PROFILE_LABEL } from "@/features/users/pages/users/config.jsx";

// At most one of the three STAFF-sales profiles; other families combine freely.
const SALES_TIER = ["NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES"];

// Inline (non-modal) editor for a user's DB-relational permission PROFILES: pick the
// assigned set + which one is active (current). Same endpoints as ProfileManagerDialog
// (GET admin/users/assignable-profiles, PUT admin/users/:id/profiles) but rendered inline
// on the user-detail page and REFETCHING on save (onSaved) instead of a full page reload.
// Gated by user.manage_roles (the parent also gates, this self-checks for safety).
export default function UserProfilesPanel({
  userId,
  userProfiles = [],
  currentProfileId,
  onSaved,
  onClose,
}) {
  const { hasPermission } = usePermission();
  const admin = hasPermission(USER_CODES.MANAGE_PROFILES);

  const [allProfiles, setAllProfiles] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  const heldIds = useMemo(
    () =>
      userProfiles
        .map((up) => up.profileId ?? up.profile?.id)
        .filter((x) => x != null),
    [userProfiles],
  );

  const [selectedIds, setSelectedIds] = useState(heldIds);
  const [current, setCurrent] = useState(currentProfileId ?? heldIds[0] ?? null);

  useEffect(() => {
    let active = true;
    (async () => {
      setFetching(true);
      const res = await apiRequest("users/assignable-profiles");
      if (active && res.ok) {
        const body = await res.json();
        setAllProfiles(body?.data?.items ?? body?.data ?? []);
      }
      if (active) setFetching(false);
    })();
    return () => {
      active = false;
    };
  }, []);

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
      setSaving,
      `users/${userId}/profiles`,
      false,
      "Updating profiles...",
      null,
      "PUT",
    );
    if (req.status === 200 || req?.success === true) {
      await onSaved?.();
      onClose?.();
    }
  }

  if (!admin) return null;

  return (
    <Box
      sx={{
        mt: 2,
        borderRadius: 2,
        border: (t) => `1px solid ${t.palette.divider}`,
        bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
        p: { xs: 1.5, md: 2 },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            color: "primary.main",
          }}
        >
          <FiLayers size={16} />
        </Box>
        <Typography variant="subtitle2" fontWeight={700}>
          Assign profiles
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        Select the profiles this user holds and mark the active one. Only one sales level
        (Sales, Primary sales, or Super sales) can be assigned; other profiles combine freely.
      </Typography>

      {fetching ? (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={22} />
        </Box>
      ) : (
        <Stack spacing={0.5} sx={{ mt: 1.5 }}>
          {allProfiles.map((p) => {
            const checked = selectedIds.includes(p.id);
            return (
              <Box
                key={p.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  border: (t) =>
                    `1px solid ${
                      checked
                        ? alpha(t.palette.primary.main, 0.4)
                        : t.palette.divider
                    }`,
                  bgcolor: (t) =>
                    checked ? alpha(t.palette.primary.main, 0.05) : "transparent",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={checked}
                      onChange={() => toggle(p.id)}
                      size="small"
                    />
                  }
                  label={
                    <Typography fontWeight={600}>
                      {PROFILE_LABEL[p.key] ?? p.label ?? p.key}
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Radio
                      checked={current === p.id}
                      disabled={!checked}
                      onChange={() => setCurrent(p.id)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="caption" color="text.secondary">
                      Active
                    </Typography>
                  }
                  labelPlacement="start"
                />
              </Box>
            );
          })}
        </Stack>
      )}

      {selectedIds.length === 0 && (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 1, display: "block" }}
        >
          At least one profile must be assigned.
        </Typography>
      )}

      <Divider sx={{ my: 1.5 }} />
      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button
          onClick={() => onClose?.()}
          color="inherit"
          sx={{ textTransform: "none" }}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={selectedIds.length === 0 || saving || fetching}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Save profiles
        </Button>
      </Stack>
    </Box>
  );
}

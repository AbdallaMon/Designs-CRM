"use client";
import { useState } from "react";
import { Box, CircularProgress, FormControl, MenuItem, Select } from "@mui/material";
import { useAuth } from "@/app/providers/AuthProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

// Header control that lets a multi-profile user switch their ACTIVE profile. On
// switch the backend re-mints the auth cookies; we then refetch /auth/me so the
// whole app (nav, buttons, capabilities) re-gates from the new profile. Hidden for
// users who hold a single profile.
export default function ProfileSwitcher() {
  const { profiles, currentProfileId, refetchMe } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!Array.isArray(profiles) || profiles.length <= 1) return null;

  async function onChange(event) {
    const profileId = Number(event.target.value);
    if (!profileId || profileId === currentProfileId) return;
    const res = await handleRequestSubmit(
      { profileId },
      setLoading,
      "auth/profile/switch",
      false,
      "Switching profile...",
      null,
      "POST",
    );
    if (res?.success === true || res?.status === 200) {
      await refetchMe();
    }
  }

  return (
    <FormControl
      size="small"
      sx={{ minWidth: 150, display: { xs: "none", sm: "inline-flex" } }}
    >
      <Select
        value={currentProfileId ?? ""}
        onChange={onChange}
        disabled={loading}
        aria-label="Active profile"
        renderValue={(val) => {
          const p = profiles.find((x) => x.id === val);
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {loading && <CircularProgress size={14} />}
              {p?.label ?? "Profile"}
            </Box>
          );
        }}
      >
        {profiles.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

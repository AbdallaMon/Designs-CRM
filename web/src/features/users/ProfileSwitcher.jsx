"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Chip, Menu, MenuItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import { MdCheck, MdKeyboardArrowDown } from "react-icons/md";
import { FaUserShield, FaUserTie, FaPalette, FaCalculator } from "react-icons/fa";

import { useAuth } from "@/app/providers/AuthProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { activeProfileLabel } from "@/app/helpers/profiles";
import colors from "@/app/helpers/colors";
import { resolveProfileLanding } from "@/features/users/profile-switch-navigation.js";

// Icon + color per profile FAMILY (from /auth/me profiles[].family). Caramel identity.
const familyConfig = {
  ADMIN: { icon: <FaUserShield />, color: colors.info },
  SALES: { icon: <FaUserTie />, color: colors.success },
  DESIGN: { icon: <FaPalette />, color: colors.secondary },
  FINANCE: { icon: <FaCalculator />, color: colors.primaryDark },
};
const fallbackConfig = { icon: <FaUserTie />, color: colors.textTertiary };

// The profile chip IS the switcher trigger. Driven purely by the profiles[] array from
// /auth/me (each { id, key, label, family, isAdminTier }) — zero legacy-column reads.
// Holds >1 profile → a clickable chip with a caret that opens a menu and performs a real
// server-side switch (POST auth/profile/switch → refetchMe). Holds exactly 1 → a static
// chip showing the active profile's label. Holds 0 (unmigrated) → legacy roleLabel fallback.
export default function ProfileSwitcher() {
  const { profiles = [], currentProfileId, refetchMe } = useAuth();
  const { setLoading } = useToastContext();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);

  const list = Array.isArray(profiles) ? profiles : [];
  const activeLabel = activeProfileLabel(list, currentProfileId);
  const active = list.find((p) => p.id === currentProfileId) || null;
  const activeFamilyConfig = (active && familyConfig[active.family]) || fallbackConfig;

  // 0 profiles (unmigrated): fall back to the legacy role label so nothing regresses.
  const label = activeLabel;
  if (!label) return null;

  const multi = list.length > 1;

  async function handleSelect(profileId) {
    setAnchorEl(null);
    if (profileId === currentProfileId) return;
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
      const selectedProfile = list.find((profile) => profile.id === profileId);
      const nextUser = await refetchMe();
      const destination = resolveProfileLanding({
        profileKey: nextUser?.profile ?? selectedProfile?.key,
        navigationTabs: nextUser?.navigationTabs ?? [],
      });
      router.replace(destination);
    }
  }

  return (
    <>
      <Chip
        size="small"
        icon={<Box sx={{ display: "flex", ml: 0.5 }}>{activeFamilyConfig.icon}</Box>}
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
            <span>{label}</span>
            {multi && <MdKeyboardArrowDown size={16} />}
          </Box>
        }
        onClick={multi ? (e) => setAnchorEl(e.currentTarget) : undefined}
        sx={{
          fontWeight: 600,
          color: colors.textPrimary,
          backgroundColor: colors.bgTertiary,
          cursor: multi ? "pointer" : "default",
          display: { xs: "none", sm: "inline-flex" },
          "& .MuiChip-icon": { color: activeFamilyConfig.color },
          ...(multi && { "&:hover": { backgroundColor: colors.bgQuaternary } }),
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 240,
              borderRadius: 2,
              border: `1px solid ${colors.border}`,
              boxShadow: `0 8px 24px ${colors.shadowDark}`,
            },
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{ px: 2, py: 1, display: "block", color: colors.textTertiary, fontWeight: 700, letterSpacing: 0.5 }}
        >
          SWITCH PROFILE
        </Typography>
        {list.map((profile) => {
          const cfg = familyConfig[profile.family] || fallbackConfig;
          const isCurrent = profile.id === currentProfileId;
          return (
            <MenuItem
              key={profile.id}
              selected={isCurrent}
              onClick={() => handleSelect(profile.id)}
              sx={{
                py: 1.25,
                "&.Mui-selected": { backgroundColor: colors.primaryAlt },
                "&.Mui-selected:hover": { backgroundColor: colors.highlight },
              }}
            >
              <ListItemIcon sx={{ color: cfg.color, minWidth: 36 }}>{cfg.icon}</ListItemIcon>
              <ListItemText primary={profile.label} primaryTypographyProps={{ fontWeight: isCurrent ? 700 : 500 }} />
              {isCurrent && <MdCheck size={18} color={colors.success} />}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

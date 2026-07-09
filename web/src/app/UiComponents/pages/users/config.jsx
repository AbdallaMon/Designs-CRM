import {
  alpha,
  Avatar,
  Box,
  Chip,
  lighten,
  Stack,
  Typography,
} from "@mui/material";

import { usersHexColors } from "@/app/helpers/constants";

// Mirrors `packages/shared/constants/access/profiles.js` PROFILE_META (web has no
// dependency on @dms/shared, so the { value, label } options are kept in sync here).
export const PROFILE_OPTIONS = [
  { value: "NORMAL_SALES", label: "Sales" },
  { value: "PRIMARY_SALES", label: "Primary sales" },
  { value: "SUPER_SALES", label: "Super sales" },
  { value: "SUPER_SALES_BASE", label: "Super sales (base)" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super admin" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "DESIGNER_3D", label: "3D Designer" },
  { value: "DESIGNER_2D", label: "2D Designer" },
  { value: "EXECUTOR_2D", label: "2D Executor" },
  { value: "CONTACT_INITIATOR", label: "Contact initiator" },
];

export const PROFILE_LABEL = Object.fromEntries(PROFILE_OPTIONS.map((p) => [p.value, p.label]));

// The user's assigned profiles (from admin/users MANAGEMENT_SELECT userProfiles).
export function assignedProfiles(item) {
  const ups = Array.isArray(item.userProfiles) ? item.userProfiles : [];
  return ups.map((up) => up.profile).filter(Boolean);
}

// The label of the user's ACTIVE profile (falls back to the legacy profile string).
export function currentProfileName(item) {
  const current = assignedProfiles(item).find((p) => p?.id === item.currentProfileId);
  if (current) return current.label || PROFILE_LABEL[current.key] || current.key;
  return PROFILE_LABEL[item.profile] || item.profile || "—";
}

// A stable color for a user row, keyed off the (legacy) base role which the backend
// keeps in sync with the current profile. No more isPrimary/isSuperSales branching.
export function userColor(item) {
  if (!item.isActive) return usersHexColors.banned;
  return usersHexColors[item.role] || usersHexColors.default || "#6b7280";
}

export const columns = [
  {
    name: "name",
    label: "User Name",
    type: "function",
    render: (item) => {
      const safeColor = userColor(item);
      return (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor: safeColor,
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {item.name ? item.name[0]?.toUpperCase() : "?"}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color="text.primary"
              sx={{ lineHeight: 1.3 }}
              noWrap
            >
              {item.name || "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {item.email || "—"}
            </Typography>
          </Box>
        </Stack>
      );
    },
  },
  {
    name: "telegramUsername",
    label: "Telegram user name",
    type: "function",
    render: (item) =>
      item.telegramUsername ? (
        <Chip
          size="small"
          label={item.telegramUsername}
          sx={{
            fontWeight: 600,
            borderRadius: 1.5,
            bgcolor: (theme) => alpha(theme.palette.info.main, 0.12),
            color: "info.main",
            border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
          }}
        />
      ) : (
        <Typography variant="caption" color="text.disabled">
          —
        </Typography>
      ),
  },

  {
    name: "profile",
    label: "Roles",
    type: "function",
    render: (item) => {
      const safeColor = userColor(item);
      const profiles = assignedProfiles(item);
      const currentLabel = currentProfileName(item);
      return (
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
          {/* the ACTIVE profile */}
          <Chip
            size="small"
            label={currentLabel}
            sx={{
              fontWeight: 700,
              borderRadius: 1.5,
              color: safeColor,
              bgcolor: lighten(safeColor, 0.85),
              border: `1px solid ${alpha(safeColor, 0.35)}`,
            }}
          />
          {/* other assigned profiles the user can switch to */}
          {profiles
            .filter((p) => p.id !== item.currentProfileId)
            .map((p) => (
              <Chip
                key={p.id}
                size="small"
                variant="outlined"
                label={p.label || PROFILE_LABEL[p.key] || p.key}
                sx={{ fontWeight: 600, borderRadius: 1.5, color: "text.secondary" }}
              />
            ))}
          {!item.isActive && (
            <Chip
              size="small"
              label="Banned"
              sx={{
                fontWeight: 700,
                borderRadius: 1.5,
                color: usersHexColors.banned,
                bgcolor: alpha(usersHexColors.banned, 0.12),
                border: `1px solid ${alpha(usersHexColors.banned, 0.3)}`,
              }}
            />
          )}
        </Stack>
      );
    },
  },
];

export const PASSWORD_RULE =
  "The password must contain an uppercase letter, a lowercase letter, a number, and be at least 8 characters long";

// The create/edit form is IDENTITY only — no role/profile field. Roles are assigned
// separately via the "اسناد دور" (profiles) dialog in the row actions.
export const inputs = [
  {
    data: { id: "name", type: "text", label: "User name", key: "name" },
    pattern: {
      required: { value: true, message: "Please enter a name" },
    },
  },
  {
    data: { id: "email", type: "email", label: "Email" },
    pattern: {
      required: { value: true, message: "Please enter an email address" },
      pattern: {
        value: /\w+@[a-z]+\.[a-z]{2,}/gi,
        message: "Please enter a valid email address",
      },
    },
  },
  {
    data: {
      id: "telegramUsername",
      type: "text",
      label: "Telegram username",
      key: "telegramUsername",
    },
  },
  {
    data: {
      id: "password",
      type: "password",
      label: "Password",
      helperText: PASSWORD_RULE,
    },
    pattern: {
      required: { value: true, message: "Please enter a password" },
      pattern: {
        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
        message: PASSWORD_RULE,
      },
    },
  },
];

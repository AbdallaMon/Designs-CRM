"use client";

// <RoleChip /> — the persistent "who am I" chip. Reads the current auth user and renders the
// provisional Arabic role label(s) (base activeRole + super-sales/primary flags). DISPLAY-only:
// derived from auth/me display fields, never a gate. Used by the TopBar identity cluster and
// optionally by <PageHeader> (UX plan §1.3 — persistent orientation). Single-language Arabic.
//
// Props:
//   user      object?  — pass an explicit user; otherwise reads from useAuth().
//   variant   "full" | "primary" — "primary" shows only the base role chip (compact spots).
//   size      "small" | "medium"

import { Stack, Chip } from "@mui/material";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { buildRoleChips } from "@/app/v2/features/shell/roleLabels";

export function RoleChip({ user: userProp, variant = "full", size = "small" }) {
  const auth = useAuth();
  const user = userProp ?? auth?.user;
  const chips = buildRoleChips(user);
  if (chips.length === 0) return null;

  const shown = variant === "primary" ? chips.slice(0, 1) : chips;

  return (
    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
      {shown.map((c) => (
        <Chip
          key={c.key}
          size={size}
          label={c.label}
          color={c.key === "role" ? "primary" : "default"}
          variant={c.key === "role" ? "filled" : "outlined"}
        />
      ))}
    </Stack>
  );
}

export default RoleChip;

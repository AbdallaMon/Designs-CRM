"use client";

// <StatusChip status domain /> — the ONE status indicator for the v2 UI. Reads the
// `theme.palette.status.*` token map (providers/statusTokens.js) to pick a semantic bucket
// for a domain enum value, and ALWAYS renders the Arabic label (statusLabels.js) — never
// color-only (a11y 1.4.1). Replaces the scattered legacy STATUS_COLORS / contractLevelColors
// usages. Single-language Arabic / RTL.
//
// Props:
//   status  string  — the Prisma enum VALUE (e.g. "OVERDUE", "CONVERTED").
//   domain  "lead" | "contract" | "payment" | "task" | "session" — selects the token + label map.
//   label   string? — override the resolved Arabic label (optional).
//   size    "small" | "medium" — MUI Chip size (default "small").
//   sx      object? — extra sx merged last.

import { Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { resolveStatusLabel } from "../config/statusLabels";

export function StatusChip({ status, domain, label, size = "small", sx }) {
  const theme = useTheme();
  const statusPalette = theme.palette.status;

  const semanticKey =
    statusPalette?.domains?.[domain]?.[status] ?? "neutral";
  const tokens =
    statusPalette?.semantic?.[semanticKey] ?? statusPalette?.semantic?.neutral;

  const text = label ?? resolveStatusLabel(domain, status);

  return (
    <Chip
      size={size}
      label={text}
      sx={{
        backgroundColor: tokens?.bg,
        color: tokens?.fg,
        fontWeight: 600,
        borderRadius: 1,
        // a dot-like accent via a start border keeps it legible even in monochrome print
        borderInlineStart: `3px solid ${tokens?.main}`,
        "& .MuiChip-label": { px: 1 },
        ...sx,
      }}
    />
  );
}

export default StatusChip;

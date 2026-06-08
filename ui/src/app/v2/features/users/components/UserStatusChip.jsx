"use client";

// <UserStatusChip /> — active/banned indicator for a managed user. The shared <StatusChip>
// primitive is intentionally locked to lead/contract/payment/task/session domains (no `user`
// domain, and the theme `status.*` token map is out of scope to edit), so this small local
// chip provides the same guarantees for the users surface: ALWAYS a text label (never
// color-only — a11y 1.4.1), semantic color from the account state. Single-language Arabic.
//
// Props: isActive (boolean), size ("small" | "medium").

import { Chip } from "@mui/material";
import { userStatusOf } from "../config/usersConstants.js";

export function UserStatusChip({ isActive, size = "small" }) {
  const status = userStatusOf(isActive);
  return (
    <Chip
      size={size}
      label={status.label}
      color={status.color}
      variant={isActive ? "filled" : "outlined"}
      sx={{ fontWeight: 600, borderRadius: 1 }}
    />
  );
}

export default UserStatusChip;

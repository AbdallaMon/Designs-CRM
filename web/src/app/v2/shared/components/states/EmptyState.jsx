"use client";

// <EmptyState /> — icon + plain-Arabic explanation + a SINGLE next-action CTA (UX plan §2).
// Copy is role-aware: pass `title`/`description` tuned to what THIS user can do. The CTA is
// optional — omit it (and gate it at the call site) when the role has no creating power, so an
// empty list never dangles an action the user can't perform. Single-language Arabic / RTL.
//
// Props:
//   icon        node?    — an illustrative icon (defaults to an inbox glyph).
//   title       string   — "لا توجد بيانات" style headline.
//   description string?  — one plain sentence explaining the emptiness / what to do.
//   action      { label, onClick?, href?, icon? }? — the single next-action CTA.

import { Box, Stack, Typography, Button } from "@mui/material";
import NextLink from "next/link";
import { MdInbox } from "react-icons/md";

export function EmptyState({ icon, title = "لا توجد بيانات", description, action }) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1.5}
      sx={{ textAlign: "center", py: 8, px: 3 }}
    >
      <Box sx={{ fontSize: 56, color: "text.disabled", lineHeight: 1, display: "flex" }}>
        {icon ?? <MdInbox />}
      </Box>
      <Typography variant="h6" component="p">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button
          variant="contained"
          color="primary"
          onClick={action.onClick}
          startIcon={action.icon}
          {...(action.href ? { component: NextLink, href: action.href } : {})}
          sx={{ mt: 1 }}
        >
          {action.label}
        </Button>
      )}
    </Stack>
  );
}

export default EmptyState;

"use client";

// <SuccessState /> — explicit confirmation + the NEXT step (UX plan §2). Used after a
// terminal flow completes (e.g. a public e-sign / image-session wizard, a bulk import) where
// a toast isn't enough — the user needs a clear "done + what now". Single-language Arabic /
// RTL; status role so AT announce the result (4.1.3).
//
// Props:
//   title       string?  — "تمت العملية بنجاح" style headline.
//   message     string?  — plain-Arabic confirmation detail.
//   primary     { label, onClick?, href?, icon? }? — the main next-step CTA.
//   secondary   { label, onClick?, href? }?        — an optional secondary action.

import { Stack, Typography, Button, Box } from "@mui/material";
import NextLink from "next/link";
import { MdCheckCircleOutline } from "react-icons/md";

export function SuccessState({
  title = "تمت العملية بنجاح",
  message,
  primary,
  secondary,
}) {
  return (
    <Stack
      role="status"
      aria-live="polite"
      alignItems="center"
      justifyContent="center"
      spacing={1.5}
      sx={{ textAlign: "center", py: 8, px: 3 }}
    >
      <Box sx={{ fontSize: 64, color: "success.main", lineHeight: 1, display: "flex" }}>
        <MdCheckCircleOutline />
      </Box>
      <Typography variant="h6" component="p">
        {title}
      </Typography>
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440 }}>
          {message}
        </Typography>
      )}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
        {primary && (
          <Button
            variant="contained"
            color="primary"
            onClick={primary.onClick}
            startIcon={primary.icon}
            {...(primary.href ? { component: NextLink, href: primary.href } : {})}
          >
            {primary.label}
          </Button>
        )}
        {secondary && (
          <Button
            variant="text"
            color="primary"
            onClick={secondary.onClick}
            {...(secondary.href ? { component: NextLink, href: secondary.href } : {})}
          >
            {secondary.label}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

export default SuccessState;

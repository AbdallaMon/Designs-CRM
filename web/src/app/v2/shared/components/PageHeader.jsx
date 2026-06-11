"use client";

// <PageHeader /> — the canonical screen header (UX plan §1.3 persistent orientation): page H1
// in plain Arabic + a role chip ("who am I") + ONE end-aligned primary CTA + optional
// breadcrumbs ("where am I"). RTL: the primary action sits at the inline-END (logical), so it
// renders on the LEFT in the RTL layout. Single-language Arabic.
//
// Props:
//   title         string                  — page H1 (already-resolved Arabic; no raw codes).
//   subtitle      string?                 — optional secondary line under the title.
//   roleChip      bool                    — show the current-user role chip (default true).
//   breadcrumbs   {label, href?}[]?       — group ‹ page ‹ record trail.
//   primaryAction { label, onClick?, href?, icon?, disabled?, reason? }? — the single CTA.
//                                            Pass nothing (or omit) to hide it — gate it at the
//                                            call site with usePermission + capabilities.
//   children      node?                   — extra header-end controls (filters, secondary btns).

import {
  Box,
  Stack,
  Typography,
  Button,
  Breadcrumbs,
  Link as MuiLink,
  Tooltip,
} from "@mui/material";
import NextLink from "next/link";
import { RoleChip } from "./RoleChip";
import { useT } from "@/app/v2/lib/i18n/I18nProvider";

export function PageHeader({
  title,
  subtitle,
  roleChip = true,
  breadcrumbs,
  primaryAction,
  children,
}) {
  const { t } = useT();
  return (
    <Box sx={{ mb: 3 }}>
      {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }} aria-label={t("shell.breadcrumb.aria", "مسار التنقل")}>
          {breadcrumbs.map((c, i) =>
            c.href ? (
              <MuiLink
                key={i}
                component={NextLink}
                href={c.href}
                underline="hover"
                color="text.secondary"
                variant="body2"
              >
                {c.label}
              </MuiLink>
            ) : (
              <Typography key={i} color="text.primary" variant="body2">
                {c.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {roleChip && <RoleChip variant="primary" />}
          </Stack>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent={{ xs: "flex-start", sm: "flex-end" }}
        >
          {children}
          {primaryAction && <PrimaryAction action={primaryAction} />}
        </Stack>
      </Stack>
    </Box>
  );
}

function PrimaryAction({ action }) {
  const { label, onClick, href, icon, disabled, reason } = action;
  const btn = (
    <Button
      variant="contained"
      color="primary"
      onClick={onClick}
      disabled={disabled}
      startIcon={icon}
      {...(href ? { component: NextLink, href } : {})}
      // ≥24px target (a11y 2.5.8) — MUI default size="medium" already exceeds this.
    >
      {label}
    </Button>
  );
  // When disabled WITH a reason, explain it on hover instead of hiding the CTA (UX plan §2 —
  // never a silent dead-end / never a 403). MUI disables hover on a disabled button, so wrap.
  if (disabled && reason) {
    return (
      <Tooltip title={reason}>
        <span>{btn}</span>
      </Tooltip>
    );
  }
  return btn;
}

export default PageHeader;

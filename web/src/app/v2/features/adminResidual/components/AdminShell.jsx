"use client";

// <AdminShell /> — the persistent frame for every /v2/admin/* surface. Renders the canonical
// PageHeader (H1 + role chip + breadcrumb) and a UrlTabs-style strip that links across the five
// admin sub-routes. The tab SET is filtered by the user's ADMIN_RESIDUAL.* codes (same predicate
// that gates each surface's page + actions) so the strip never offers a 403. Each surface is its
// OWN route (/v2/admin/<key>), so navigating a tab is a real <Link> route change — we mirror the
// nav.config.js sub-route IA rather than a single ?view= page. Single-language Arabic / RTL.
//
// Props:
//   active   string   — the current surface key (matches ADMIN_SURFACES[].key).
//   title    string   — page H1 for this surface (resolved Arabic).
//   subtitle string?  — optional secondary line under the title.
//   primaryAction object? — the single end-aligned CTA (already permission-gated by the caller).
//   children node     — the active surface content.

import { Container, Box, Tabs, Tab } from "@mui/material";
import NextLink from "next/link";
import { useT } from "@/app/v2/lib/i18n";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PageHeader, PartialPermissionState } from "@/app/v2/shared/components";
import {
  ADMIN_SURFACES,
  ADMIN_GROUP_LABEL_KEY,
  ADMIN_GROUP_LABEL_FALLBACK,
} from "../config/adminResidualConstants.js";

export function AdminShell({ active, title, subtitle, primaryAction, children }) {
  const { t } = useT();
  const { hasPermission } = usePermission();

  // The surfaces this user may see, in display order — same gate as the page + the side-nav.
  const surfaces = ADMIN_SURFACES.filter((s) => hasPermission(s.permission));

  // No admin surface at all → calm full-screen notice (never a crash / redirect).
  if (surfaces.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <PartialPermissionState
          denied
          title={t("adminResidual.shell.noAccess.title", "قسم الإدارة غير متاح لصلاحياتك")}
          message={t(
            "adminResidual.shell.noAccess.message",
            "لا تملك صلاحية الوصول إلى أي من أقسام الإدارة. تواصل مع المسؤول إن كنت تظن أنه ينبغي أن تصل إليها.",
          )}
        />
      </Container>
    );
  }

  // The active surface key, falling back to the first allowed one (deep-link safety).
  const activeKey = surfaces.some((s) => s.key === active) ? active : surfaces[0].key;
  const activeSurface = surfaces.find((s) => s.key === activeKey);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title={title ?? (activeSurface ? t(activeSurface.labelKey, activeSurface.labelFallback) : undefined)}
        subtitle={subtitle}
        breadcrumbs={[
          { label: t(ADMIN_GROUP_LABEL_KEY, ADMIN_GROUP_LABEL_FALLBACK) },
          { label: activeSurface ? t(activeSurface.labelKey, activeSurface.labelFallback) : undefined },
        ]}
        primaryAction={primaryAction}
      />

      <Tabs
        value={activeKey}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        {surfaces.map((s) => (
          <Tab
            key={s.key}
            value={s.key}
            label={t(s.labelKey, s.labelFallback)}
            component={NextLink}
            href={s.href}
            scroll={false}
          />
        ))}
      </Tabs>

      <Box>{children}</Box>
    </Container>
  );
}

export default AdminShell;

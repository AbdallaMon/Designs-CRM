"use client";

// admin-residual surface page — the REDESIGNED admin area (replaces the Option-A smoke-screen).
// One component drives all five /v2/admin/* sub-surfaces: the route shell passes a `surface` key,
// AdminShell renders the persistent frame (PageHeader + cross-surface tab strip, both filtered by
// the user's ADMIN_RESIDUAL.* codes), and this switch renders the active surface's content. Each
// surface is independently gated on its own code (the side-nav, the tab strip, AND the content
// share one usePermission predicate). Single-language Arabic / RTL.
//
// Surfaces (UX plan §3.10):
//   projects    → AdminProjectsView   (PROJECT_VIEW / PROJECT_GROUP_CREATE)
//   commissions → CommissionsView     (COMMISSION_VIEW / COMMISSION_MANAGE)
//   reports     → ReportsBuilder      (REPORT_GENERATE)  — frozen generators; blob download helper
//   leads       → AdminLeadsOps       (LEAD_* / CLIENT_EDIT / TELEGRAM_MANAGE)
//   fixed-data  → FixedDataView       (FIXED_DATA_MANAGE / MODEL_ARCHIVE)

import { useT } from "@/app/v2/lib/i18n";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PartialPermissionState } from "@/app/v2/shared/components";
import { Container } from "@mui/material";
import { AdminShell } from "../components/AdminShell.jsx";
import { AdminProjectsView } from "../components/AdminProjectsView.jsx";
import { CommissionsView } from "../components/CommissionsView.jsx";
import { ReportsBuilder } from "../components/ReportsBuilder.jsx";
import { AdminLeadsOps } from "../components/AdminLeadsOps.jsx";
import { FixedDataView } from "../components/FixedDataView.jsx";
import { ADMIN_SURFACES } from "../config/adminResidualConstants.js";

// surface → { titleKey, titleFallback, render }. The title is resolved with t() at render time.
const SURFACE_CONFIG = {
  projects: { titleKey: "adminResidual.surface.projects.title", titleFallback: "المشاريع (إدارة)", render: () => <AdminProjectsView /> },
  commissions: { titleKey: "adminResidual.surface.commissions.title", titleFallback: "العمولات", render: () => <CommissionsView /> },
  reports: { titleKey: "adminResidual.surface.reports.title", titleFallback: "التقارير", render: () => <ReportsBuilder /> },
  leads: { titleKey: "adminResidual.surface.leads.title", titleFallback: "عمليات العملاء المحتملين", render: () => <AdminLeadsOps /> },
  "fixed-data": { titleKey: "adminResidual.surface.fixedData.title", titleFallback: "البيانات الثابتة", render: () => <FixedDataView /> },
};

export function AdminResidualPage({ surface = "projects" }) {
  const { t } = useT();
  const { hasPermission } = usePermission();

  const def = ADMIN_SURFACES.find((s) => s.key === surface);
  const cfg = SURFACE_CONFIG[surface];

  // Unknown surface key (shouldn't happen via the route shells) or no per-surface code → block
  // this surface only; AdminShell still renders the allowed tabs for orientation.
  const allowed = def ? hasPermission(def.permission) : false;

  if (!def || !cfg) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <PartialPermissionState denied title={t("adminResidual.page.notFound.title", "هذا القسم غير موجود")} />
      </Container>
    );
  }

  return (
    <AdminShell active={surface} title={t(cfg.titleKey, cfg.titleFallback)}>
      {allowed ? (
        cfg.render()
      ) : (
        <PartialPermissionState
          denied
          title={t("adminResidual.page.denied.title", "هذا القسم غير متاح لصلاحياتك")}
          message={t(
            "adminResidual.page.denied.message",
            "لا تملك صلاحية الوصول إلى هذا القسم من الإدارة. تواصل مع المسؤول إن كنت تظن أنه ينبغي أن تصل إليه.",
          )}
        />
      )}
    </AdminShell>
  );
}

export default AdminResidualPage;

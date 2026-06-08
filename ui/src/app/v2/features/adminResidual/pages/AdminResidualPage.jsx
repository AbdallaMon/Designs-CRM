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

// surface → { permission, title, render }.
const SURFACE_CONFIG = {
  projects: { title: "المشاريع (إدارة)", render: () => <AdminProjectsView /> },
  commissions: { title: "العمولات", render: () => <CommissionsView /> },
  reports: { title: "التقارير", render: () => <ReportsBuilder /> },
  leads: { title: "عمليات العملاء المحتملين", render: () => <AdminLeadsOps /> },
  "fixed-data": { title: "البيانات الثابتة", render: () => <FixedDataView /> },
};

export function AdminResidualPage({ surface = "projects" }) {
  const { hasPermission } = usePermission();

  const def = ADMIN_SURFACES.find((s) => s.key === surface);
  const cfg = SURFACE_CONFIG[surface];

  // Unknown surface key (shouldn't happen via the route shells) or no per-surface code → block
  // this surface only; AdminShell still renders the allowed tabs for orientation.
  const allowed = def ? hasPermission(def.permission) : false;

  if (!def || !cfg) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <PartialPermissionState denied title="هذا القسم غير موجود" />
      </Container>
    );
  }

  return (
    <AdminShell active={surface} title={cfg.title}>
      {allowed ? (
        cfg.render()
      ) : (
        <PartialPermissionState
          denied
          title="هذا القسم غير متاح لصلاحياتك"
          message="لا تملك صلاحية الوصول إلى هذا القسم من الإدارة. تواصل مع المسؤول إن كنت تظن أنه ينبغي أن تصل إليه."
        />
      )}
    </AdminShell>
  );
}

export default AdminResidualPage;

"use client";

// Dashboard — the role-adaptive home, ACTION-QUEUE-FIRST (UX plan §3.1). Replaces the old
// JSON.stringify wiring smoke-screen with the real composition on the Phase 0 primitives. The
// data layer is FIXED (dashboard.service / the 9 reads / the BE contract are untouched); this
// page is PURELY presentational glue: PageHeader + filter bar + a prioritized action queue +
// KPI cards + leads-status + (production) designer board + a secondary charts tier — each widget
// self-fetching through useRequest with its own five states. Single-language Arabic / RTL.
//
// GATING: every read is server-gated on the SINGLE dashboard.view code; we gate the whole page
// on PERMISSIONS.DASHBOARD.VIEW (nav + page + reads share the one predicate). The BE self-scopes
// by token; admin-tier may re-scope via the filter staffId. There is no per-widget permission
// split — so role-adaptivity comes from (a) WHICH widgets we mount per persona, and (b) the
// data each read returns (thin-data roles fall through to meaningful empty states, never blanks).

import { Container } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { PageHeader, PartialPermissionState } from "@/app/v2/shared/components";
import { DASHBOARD_COPY } from "../config/dashboardConstants.js";
import { useDashboardScope } from "../hooks/useDashboardScope.js";
import { DashboardFilters } from "../components/DashboardFilters.jsx";
import { ActionQueue } from "../components/ActionQueue.jsx";
import { KpiCards } from "../components/KpiCards.jsx";
import { LeadsStatusBreakdown } from "../components/LeadsStatusBreakdown.jsx";
import { DesignerBoard } from "../components/DesignerBoard.jsx";
import { DashboardCharts } from "../components/DashboardCharts.jsx";

const P = PERMISSIONS.DASHBOARD;

// Personas whose home leads with the PRODUCTION board (designers / executors). Everyone else
// leads with the sales/leads view. Both still get the action queue + KPIs + charts — this only
// decides whether the designer board is surfaced and whether leads-status sits beside KPIs.
const PRODUCTION_ROLES = ["THREE_D_DESIGNER", "TWO_D_DESIGNER", "TWO_D_EXECUTOR"];

function roleView(user) {
  const role = user?.activeRole ?? user?.role;
  if (PRODUCTION_ROLES.includes(role)) return "production";
  return "sales";
}

export function DashboardPage() {
  const { hasPermission } = usePermission();
  const { user } = useAuth();
  const canView = hasPermission(P.VIEW);

  const scope = useDashboardScope();
  const view = roleView(user);
  const enabled = canView;

  if (!canView) {
    // Calm full-screen notice instead of a bare 403 (UX plan §2).
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <PartialPermissionState denied title={DASHBOARD_COPY.denied} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader title={DASHBOARD_COPY.title} subtitle={DASHBOARD_COPY.subtitle} />

      <DashboardFilters
        adminTier={scope.adminTier}
        draft={scope.draft}
        setField={scope.setField}
        apply={scope.apply}
        reset={scope.reset}
        isDirty={scope.isDirty}
        hasFilters={scope.hasFilters}
      />

      {/* 1) PRIMARY — the action queue ("يحتاج انتباهك") sits at the very top. */}
      <ActionQueue query={scope.query} enabled={enabled} />

      {/* 2) KPI cards. */}
      <KpiCards query={scope.query} enabled={enabled} />

      {/* 3) Production board — surfaced for production personas (designers/executors); it
             degrades to a role-aware empty when the scoped projects data is thin. */}
      {view === "production" && (
        <div style={{ marginBottom: 0 }}>
          <DesignerBoard query={scope.query} enabled={enabled} />
        </div>
      )}

      {/* 4) Leads-status breakdown (full width). */}
      <div style={{ marginBottom: 24 }}>
        <LeadsStatusBreakdown query={scope.query} enabled={enabled} />
      </div>

      {/* 5) SECONDARY — charts tier, always BELOW the queue + KPIs. */}
      <DashboardCharts query={scope.query} enabled={enabled} />
    </Container>
  );
}

export default DashboardPage;

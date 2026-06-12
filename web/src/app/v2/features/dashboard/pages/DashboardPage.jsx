"use client";

// Dashboard — the role-AWARE widget board (UX plan §3.1 / §5). One data layer, TWO compositions
// chosen by persona; each widget still self-fetches through useRequest with its own five states
// (WidgetBoundary), so a single failed aggregation never blanks the page. The data layer is FIXED
// (dashboard.service / the 9 reads / the BE contract are untouched); this page is PURELY
// presentational glue + per-persona ORDERING. Single-language Arabic / RTL.
//
// PERSONA → ORDERING:
//   • SALES / SUPER-SALES / ADMIN (view "sales"): the pipeline-first board.
//       row 1  ActionQueue (يحتاج انتباهك, full width)
//       row 2  KpiCards (4-up modern stat cards)
//       row 3  LeadsStatusBreakdown + EmiratesAnalytics (side by side)
//       row 4  DashboardCharts (monthly performance + leads monthly overview + week)
//       row 5  LatestLeads (compact roster, each row → the lead hub /v2/leads/{id})
//   • PRODUCTION (3D/2D designer, executor — view "production"): the work-first board.
//       row 1  DesignerBoard (designer-metrics) — PRIMARY
//       row 2  ActionQueue (their tasks/updates)
//       row 3  KpiCards — DE-EMPHASIZED (below the work)
//       row 4  DashboardCharts — analytics tier last
//
// GATING: every read is server-gated on the SINGLE dashboard.view code; we gate the whole page on
// PERMISSIONS.DASHBOARD.VIEW (nav + page + reads share the one predicate). The BE self-scopes by
// token; admin-tier may re-scope via the filter staffId. Role-adaptivity comes from (a) WHICH
// widgets we mount + in WHAT ORDER per persona, and (b) the data each read returns (thin-data
// roles fall through to meaningful empty states, never blanks).

import { Container, Stack, Grid, Box } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { PageHeader, PartialPermissionState } from "@/app/v2/shared/components";
import { useT } from "@/app/v2/lib/i18n";
import { DASHBOARD_COPY_KEYS } from "../config/dashboardConstants.js";
import { useDashboardScope } from "../hooks/useDashboardScope.js";
import { DashboardFilters } from "../components/DashboardFilters.jsx";
import { ActionQueue } from "../components/ActionQueue.jsx";
import { KpiCards } from "../components/KpiCards.jsx";
import { LeadsStatusBreakdown } from "../components/LeadsStatusBreakdown.jsx";
import { EmiratesAnalytics } from "../components/EmiratesAnalytics.jsx";
import { LatestLeads } from "../components/LatestLeads.jsx";
import { DesignerBoard } from "../components/DesignerBoard.jsx";
import { DashboardCharts } from "../components/DashboardCharts.jsx";
import { FixedDataCard } from "../components/FixedDataCard.jsx";

const P = PERMISSIONS.DASHBOARD;

// Personas whose home leads with the PRODUCTION board (designers / executors). Everyone else gets
// the sales/pipeline board. The role comes from auth/me — never a query param.
const PRODUCTION_ROLES = ["THREE_D_DESIGNER", "TWO_D_DESIGNER", "TWO_D_EXECUTOR"];

function roleView(user) {
  const role = user?.activeRole ?? user?.role;
  if (PRODUCTION_ROLES.includes(role)) return "production";
  return "sales";
}

export function DashboardPage() {
  const { hasPermission } = usePermission();
  const { user } = useAuth();
  const { t } = useT();
  const canView = hasPermission(P.VIEW);

  const scope = useDashboardScope();
  const view = roleView(user);
  const enabled = canView;
  // Read-only fixed-data reference card — gated on the SAME code the BE enforces (the card
  // self-fetches GET /v2/utilities/fixed-data). Visible to employees on either board.
  const canViewFixedData = hasPermission(PERMISSIONS.UTILITY.FIXED_DATA_LIST);

  if (!canView) {
    // Calm full-screen notice instead of a bare 403 (UX plan §2).
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <PartialPermissionState denied title={t(DASHBOARD_COPY_KEYS.denied)} />
      </Container>
    );
  }

  const widgetProps = { query: scope.query, enabled, showFixedData: canViewFixedData };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader title={t(DASHBOARD_COPY_KEYS.title)} subtitle={t(DASHBOARD_COPY_KEYS.subtitle)} />

      <DashboardFilters
        adminTier={scope.adminTier}
        draft={scope.draft}
        setField={scope.setField}
        apply={scope.apply}
        reset={scope.reset}
        isDirty={scope.isDirty}
        hasFilters={scope.hasFilters}
      />

      <Stack spacing={3}>
        {view === "production" ? (
          <ProductionBoard {...widgetProps} />
        ) : (
          <SalesBoard {...widgetProps} />
        )}
      </Stack>
    </Container>
  );
}

// ── SALES / SUPER-SALES / ADMIN — the pipeline-first board ───────────────────────────────────
function SalesBoard({ query, enabled, showFixedData }) {
  return (
    <>
      {/* row 1 — the action queue ("يحتاج انتباهك"), full width, first. */}
      <ActionQueue query={query} enabled={enabled} />

      {/* row 2 — KPI stat cards. */}
      <KpiCards query={query} enabled={enabled} />

      {/* row 3 — leads-status breakdown + emirates analytics, side by side. */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <LeadsStatusBreakdown query={query} enabled={enabled} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <EmiratesAnalytics query={query} enabled={enabled} />
        </Grid>
      </Grid>

      {/* row 4 — the charts tier (always below the queue + KPIs). */}
      <DashboardCharts query={query} enabled={enabled} />

      {/* row 5 — latest leads (each row → the lead hub). */}
      <LatestLeads query={query} enabled={enabled} />

      {/* row 6 — read-only fixed-data reference card (gated on utility.fixed_data.list). */}
      {showFixedData && <FixedDataCard enabled={enabled} />}
    </>
  );
}

// ── PRODUCTION (designers / executors) — the work-first board ────────────────────────────────
function ProductionBoard({ query, enabled, showFixedData }) {
  return (
    <>
      {/* row 1 — the production board is PRIMARY. */}
      <DesignerBoard query={query} enabled={enabled} />

      {/* row 2 — their action queue (tasks / updates needing attention). */}
      <ActionQueue query={query} enabled={enabled} />

      {/* row 3 — KPIs, de-emphasized below the work. */}
      <Box>
        <KpiCards query={query} enabled={enabled} />
      </Box>

      {/* row 4 — analytics tier last. */}
      <DashboardCharts query={query} enabled={enabled} />

      {/* row 5 — read-only fixed-data reference card (gated on utility.fixed_data.list). */}
      {showFixedData && <FixedDataCard enabled={enabled} />}
    </>
  );
}

export default DashboardPage;

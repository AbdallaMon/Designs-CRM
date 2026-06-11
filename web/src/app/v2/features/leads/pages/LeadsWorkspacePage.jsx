"use client";

// Leads Workspace — the salesperson's daily cockpit (UX replan). Restores the legacy
// dashboard/leads landing (upcoming calls + meetings + new client leads + on-hold deals) as ONE
// modern, RTL, permission-gated screen. Each of the 4 sections SELF-FETCHES through the leads
// service in an isolated request (mirrors the dashboard WidgetBoundary pattern) so one failing
// read never blanks the cockpit. Endpoints (all already wired in leads.service.js):
//   • المكالمات القادمة → listCalls()                      GET /v2/leads/calls
//   • الاجتماعات القادمة → listMeetings()                  GET /v2/leads/meetings
//   • العملاء الجدد       → listLeads({ extra:{ isNew:true } })          GET /v2/leads?isNew=1
//   • صفقات معلّقة        → listLeads({ extra:{ assignedOverdue:true } }) GET /v2/leads (ON_HOLD)
//
// Gating: the whole page + every section is gated on PERMISSIONS.LEAD.LIST; per-row actions are
// gated on their own permission (CALL_MANAGE / MEETING_MANAGE) and/or the record's capabilities.*
// (claim/convert via the shared LeadAssignActions). The server independently enforces all of it.
// Single-language Arabic / RTL.

import { useCallback, useMemo } from "react";
import { Container, Grid, Stack, Box, Card, Typography } from "@mui/material";
import { MdCall, MdEventNote, MdPersonAddAlt, MdPauseCircleOutline } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useT } from "@/app/v2/lib/i18n";
import { PageHeader, PartialPermissionState } from "@/app/v2/shared/components";
import { leadsService } from "../leads.service.js";
import { useWorkspaceSection, PREVIEW_LIMIT } from "../hooks/useWorkspaceSection.js";
import { WorkspaceSectionCard } from "../components/WorkspaceSectionCard.jsx";
import { ReminderRow } from "../components/ReminderRow.jsx";
import { WorkspaceLeadRow } from "../components/WorkspaceLeadRow.jsx";

export function LeadsWorkspacePage() {
  const { hasPermission } = usePermission();
  const { t } = useT();
  const canList = hasPermission(PERMISSIONS.LEAD.LIST);
  const canManageCalls = hasPermission(PERMISSIONS.LEAD.CALL_MANAGE);
  const canManageMeetings = hasPermission(PERMISSIONS.LEAD.MEETING_MANAGE);

  // ── per-section isolated fetchers (bound to the service helpers) ────────────────
  const callsFetcher = useCallback(
    () => leadsService.listCalls({ page: 1, limit: PREVIEW_LIMIT }),
    [],
  );
  const meetingsFetcher = useCallback(
    () => leadsService.listMeetings({ page: 1, limit: PREVIEW_LIMIT }),
    [],
  );
  const newLeadsFetcher = useCallback(
    () => leadsService.listLeads({ page: 1, limit: PREVIEW_LIMIT, extra: { isNew: true } }),
    [],
  );
  const onHoldFetcher = useCallback(
    () => leadsService.listLeads({ page: 1, limit: PREVIEW_LIMIT, extra: { assignedOverdue: true } }),
    [],
  );

  const calls = useWorkspaceSection({ fetcher: callsFetcher, enabled: canList });
  const meetings = useWorkspaceSection({ fetcher: meetingsFetcher, enabled: canList });
  const newLeads = useWorkspaceSection({ fetcher: newLeadsFetcher, enabled: canList });
  const onHold = useWorkspaceSection({ fetcher: onHoldFetcher, enabled: canList });

  const summaryCards = useMemo(
    () => [
      { key: "calls", label: t("leads.workspace.summary.calls"), value: calls.total, icon: <MdCall />, loading: calls.isLoading },
      { key: "meetings", label: t("leads.workspace.summary.meetings"), value: meetings.total, icon: <MdEventNote />, loading: meetings.isLoading },
      { key: "newLeads", label: t("leads.workspace.summary.newLeads"), value: newLeads.total, icon: <MdPersonAddAlt />, loading: newLeads.isLoading },
    ],
    [t, calls.total, calls.isLoading, meetings.total, meetings.isLoading, newLeads.total, newLeads.isLoading],
  );

  if (!canList) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <PartialPermissionState
          denied
          title={t("leads.workspace.denied.title")}
          message={t("leads.workspace.denied.message")}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title={t("leads.workspace.title")}
        subtitle={t("leads.workspace.subtitle")}
      />

      {/* ── count strip ────────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((c) => (
          <Grid key={c.key} size={{ xs: 12, sm: 4 }}>
            <SummaryCard label={c.label} value={c.value} icon={c.icon} loading={c.loading} />
          </Grid>
        ))}
      </Grid>

      {/* ── two columns: A (md 8) calls + meetings · B (md 4) new + on-hold ─── */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            {/* No section-level "view all": there is no dedicated calls-list route, and
                /v2/leads lands on the leads pool (not a calls view) — that would be a dead/
                misleading link. Each ReminderRow already deep-links to its lead hub. */}
            <WorkspaceSectionCard
              title={t("leads.workspace.calls.title")}
              count={calls.total}
              loading={calls.isLoading}
              error={calls.error}
              forbidden={calls.forbidden}
              onRetry={calls.refetch}
              isEmpty={calls.items.length === 0}
              empty={{ title: t("leads.workspace.calls.empty.title"), description: t("leads.workspace.calls.empty.description") }}
            >
              {calls.items.map((r) => (
                <ReminderRow
                  key={r.id}
                  reminder={r}
                  kind="call"
                  canManage={canManageCalls}
                  onChanged={calls.refetch}
                />
              ))}
            </WorkspaceSectionCard>

            {/* No section-level "view all": no dedicated meetings-list route exists; rows
                deep-link to their lead hub instead. */}
            <WorkspaceSectionCard
              title={t("leads.workspace.meetings.title")}
              count={meetings.total}
              loading={meetings.isLoading}
              error={meetings.error}
              forbidden={meetings.forbidden}
              onRetry={meetings.refetch}
              isEmpty={meetings.items.length === 0}
              empty={{ title: t("leads.workspace.meetings.empty.title"), description: t("leads.workspace.meetings.empty.description") }}
            >
              {meetings.items.map((r) => (
                <ReminderRow
                  key={r.id}
                  reminder={r}
                  kind="meeting"
                  canManage={canManageMeetings}
                  onChanged={meetings.refetch}
                />
              ))}
            </WorkspaceSectionCard>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            <WorkspaceSectionCard
              title={t("leads.workspace.newLeads.title")}
              count={newLeads.total}
              viewAll={{ label: t("leads.workspace.newLeads.viewAll"), href: "/v2/leads" }}
              loading={newLeads.isLoading}
              error={newLeads.error}
              forbidden={newLeads.forbidden}
              onRetry={newLeads.refetch}
              isEmpty={newLeads.items.length === 0}
              empty={{ title: t("leads.workspace.newLeads.empty.title"), description: t("leads.workspace.newLeads.empty.description") }}
            >
              {newLeads.items.map((lead) => (
                <WorkspaceLeadRow key={lead.id} lead={lead} onChanged={newLeads.refetch} />
              ))}
            </WorkspaceSectionCard>

            <WorkspaceSectionCard
              title={t("leads.workspace.onHold.title")}
              count={onHold.total}
              viewAll={{ label: t("leads.workspace.onHold.viewAll"), href: "/v2/leads" }}
              loading={onHold.isLoading}
              error={onHold.error}
              forbidden={onHold.forbidden}
              onRetry={onHold.refetch}
              isEmpty={onHold.items.length === 0}
              empty={{ title: t("leads.workspace.onHold.empty.title"), description: t("leads.workspace.onHold.empty.description") }}
            >
              {onHold.items.map((lead) => (
                <WorkspaceLeadRow key={lead.id} lead={lead} onChanged={onHold.refetch} />
              ))}
            </WorkspaceSectionCard>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}

// ── compact count card ────────────────────────────────────────────────────────────
function SummaryCard({ label, value, icon, loading }) {
  return (
    <Card sx={{ borderRadius: 3, p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          fontSize: 24,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" component="div" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          {loading ? "…" : value}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {label}
        </Typography>
      </Box>
    </Card>
  );
}

export default LeadsWorkspacePage;

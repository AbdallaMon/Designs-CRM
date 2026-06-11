"use client";

// Lead detail HUB (approved UX replan). Replaces the flat ~11-tab strip with:
//   1) LeadHubHeader  — identity band (name + #id, status + payment chips, contact line,
//      owner, sales-stage strip, capability-gated actions).
//   2) LeadRelatedRail — compact count-cards (projects/contracts/sessions/payments/calls/
//      meetings) that deep-link to the owning group/sub.
//   3) Five GROUP tabs (نظرة عامة · السجل · الأعمال · المالية · أدوات المبيعات), each with an
//      inner sub-tab strip. Group AND sub-section live in the URL (?tab=<group>&sub=<section>)
//      so the rail/header can deep-link a specific section.
//
// Authorization is UNCHANGED: the same caps.* × hasPermission(...) predicates that gated the
// legacy flat tabs now compose into per-section gates (buildSectionGates); a GROUP shows iff
// ≥1 of its sub-sections is visible. The server still enforces every action.
//
// STILL DEFERRED (reported): Tasks/Modifications, Lead updates, Chats — other not-yet-migrated
// FE modules, out of scope.

import { useCallback, useMemo } from "react";
import { Box, Container, Tab, Tabs } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import {
  LoadingState,
  ErrorState,
  PartialPermissionState,
  SectionCard,
} from "@/app/v2/shared/components";
import { useLeadDetail } from "../hooks/useLeadDetail.js";
import { LEAD_HUB_GROUPS, GATE } from "../config/leadHubTabs.js";
import { resolveLeadEntry } from "../config/resolveLeadEntry.js";
import { LeadOrientationBand } from "../components/LeadOrientationBand.jsx";
import { LeadHubHeader } from "../components/LeadHubHeader.jsx";
import { LeadRelatedRail } from "../components/LeadRelatedRail.jsx";
import { OverviewTab } from "../components/tabs/OverviewTab.jsx";
import { CallsTab } from "../components/tabs/CallsTab.jsx";
import { MeetingsTab } from "../components/tabs/MeetingsTab.jsx";
import { NotesTab } from "../components/tabs/NotesTab.jsx";
import { FilesTab } from "../components/tabs/FilesTab.jsx";
import { PriceOffersTab } from "../components/tabs/PriceOffersTab.jsx";
import { PaymentsTab } from "../components/tabs/PaymentsTab.jsx";
import { LeadContractsPage } from "@/app/v2/features/contracts";
import { SalesStagePanel } from "@/app/v2/features/salesStages";
import { SpinPanel, VersaPanel } from "@/app/v2/features/questions";
import { LeadSessionsPanel } from "@/app/v2/features/imageSessions";
import { LeadProjects } from "@/app/v2/features/projects/components/LeadProjects.jsx";

const PRIVILEGED_ROLES = ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"];

export function LeadDetailsPage({ leadId }) {
  const { hasPermission } = usePermission();
  const { user } = useAuth();
  const canView = hasPermission(PERMISSIONS.LEAD.VIEW);

  // Cross-feature lead-tool gates (CODES only — these lead-scoped dtos emit NO capabilities.*;
  // the BE enforces the lead object-scope per record).
  const canViewStage = hasPermission(PERMISSIONS.SALES_STAGE.VIEW);
  const canViewSpin =
    hasPermission(PERMISSIONS.QUESTION.CONFIG_VIEW) ||
    hasPermission(PERMISSIONS.QUESTION.SESSION_VIEW);
  const canViewVersa = hasPermission(PERMISSIONS.QUESTION.SESSION_VIEW);
  const canViewSessions = hasPermission(PERMISSIONS.IMAGE_SESSION.SESSION_VIEW);
  const canViewProjects = hasPermission(PERMISSIONS.PROJECT.LIST);
  const canViewContracts = hasPermission(PERMISSIONS.CONTRACT.LIST);

  const { lead, isLoading, error, refetch } = useLeadDetail(leadId, { autoFetch: canView });

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Beginner status set (mirrors the legacy KanbanBeginerLeadsStatus branch). Server enforces.
  const beginner = useMemo(() => {
    const privileged = PRIVILEGED_ROLES.includes(user?.role) || user?.isSuperSales;
    return user?.role === "STAFF" && !user?.isPrimary && !privileged;
  }, [user]);

  // ── Section gates: resolve each leadHubTabs GATE key to a runtime boolean. This is the ONE
  // place caps.* × permission codes are composed — identical predicates to the legacy flat tabs.
  const caps = lead?.capabilities ?? {};
  const gates = useMemo(
    () => ({
      [GATE.ALWAYS]: true,
      [GATE.PRICE_OFFER]: Boolean(caps.canAddPriceOffer),
      [GATE.PAYMENT]: Boolean(caps.canAddPayment || caps.canSendReminder),
      [GATE.CONTRACTS]: canViewContracts,
      [GATE.PROJECTS]: canViewProjects,
      [GATE.SESSIONS]: canViewSessions,
      [GATE.STAGE]: canViewStage,
      [GATE.SPIN]: canViewSpin,
      [GATE.VERSA]: canViewVersa,
    }),
    [
      caps.canAddPriceOffer,
      caps.canAddPayment,
      caps.canSendReminder,
      canViewContracts,
      canViewProjects,
      canViewSessions,
      canViewStage,
      canViewSpin,
      canViewVersa,
    ],
  );

  // Visible groups = groups with ≥1 visible sub-section; each carries its visible sub list.
  const visibleGroups = useMemo(() => {
    return LEAD_HUB_GROUPS.map((group) => ({
      ...group,
      visibleSub: group.sub.filter((s) => gates[s.gateKey]),
    })).filter((group) => group.visibleSub.length > 0);
  }, [gates]);

  // ── Role/status-adaptive DEFAULT landing — applied ONLY when the URL carries no ?tab/?sub
  // (deep links + the rail must still win). Always validated against gates/visibleGroups inside
  // the resolver, so a user can never be defaulted onto a tab they cannot see.
  const entry = useMemo(
    () => resolveLeadEntry(user, lead, gates, visibleGroups),
    [user, lead, gates, visibleGroups],
  );

  // ── URL state: ?tab=<group>&sub=<section>, both validated against the visible set.
  const activeGroup = useMemo(() => {
    const t = sp.get("tab");
    if (visibleGroups.some((g) => g.key === t)) return t;
    return entry.defaultGroup ?? visibleGroups[0]?.key;
  }, [sp, visibleGroups, entry]);

  const currentGroup = useMemo(
    () => visibleGroups.find((g) => g.key === activeGroup),
    [visibleGroups, activeGroup],
  );

  const activeSub = useMemo(() => {
    const s = sp.get("sub");
    const subs = currentGroup?.visibleSub ?? [];
    if (subs.some((x) => x.key === s)) return s;
    // Use the role-adaptive default sub only when it belongs to the active group; else first sub.
    if (entry.defaultGroup === activeGroup && subs.some((x) => x.key === entry.defaultSub)) {
      return entry.defaultSub;
    }
    return subs[0]?.key;
  }, [sp, currentGroup, entry, activeGroup]);

  const navigate = useCallback(
    (groupKey, subKey) => {
      const params = new URLSearchParams(sp.toString());
      params.set("tab", groupKey);
      if (subKey) params.set("sub", subKey);
      else params.delete("sub");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [sp, pathname, router],
  );

  const onGroupChange = useCallback(
    (_e, groupKey) => {
      const group = visibleGroups.find((g) => g.key === groupKey);
      navigate(groupKey, group?.visibleSub[0]?.key);
    },
    [visibleGroups, navigate],
  );

  // ── 5 screen states ─────────────────────────────────────────────────────────────
  // No-access-to-lead.
  if (!canView) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PartialPermissionState
          denied
          title="لا تملك صلاحية الوصول إلى هذا العميل"
          message="لا تملك صلاحية الوصول إلى بيانات هذا العميل المحتمل. إن كنت تظن أنه ينبغي أن تصل إليها، تواصل مع المسؤول."
        />
      </Container>
    );
  }

  // Error (with retry).
  if (error && !isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState error={error} onRetry={refetch} />
      </Container>
    );
  }

  // Loading → skeleton hub header + skeleton rail cards.
  if (isLoading && !lead) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <SectionCard sx={{ mb: 2 }}>
          <LoadingState variant="detail" />
        </SectionCard>
        <LoadingState variant="cards" count={6} columns={6} height={96} />
      </Container>
    );
  }

  if (!lead) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <LeadOrientationBand
        lead={lead}
        canChangeStatus={caps.canChangeStatus}
        beginner={beginner}
        gates={gates}
        user={user}
        onNavigate={navigate}
        onChanged={refetch}
      />

      <LeadHubHeader
        lead={lead}
        leadId={leadId}
        canChangeStatus={caps.canChangeStatus}
        beginner={beginner}
        canViewStage={canViewStage}
        onChanged={refetch}
      />

      <LeadRelatedRail lead={lead} gates={gates} onNavigate={navigate} />

      {/* Group tabs */}
      <Tabs value={activeGroup} onChange={onGroupChange} variant="scrollable" scrollButtons="auto" sx={{ mb: 1 }}>
        {visibleGroups.map((g) => (
          <Tab key={g.key} value={g.key} label={g.label} />
        ))}
      </Tabs>

      {/* Inner sub-tab strip (only when the group has >1 visible section) */}
      {currentGroup && currentGroup.visibleSub.length > 1 && (
        <Tabs
          value={activeSub}
          onChange={(_e, subKey) => navigate(activeGroup, subKey)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="secondary"
          indicatorColor="secondary"
          sx={{ mb: 2, minHeight: 40, "& .MuiTab-root": { minHeight: 40 } }}
        >
          {currentGroup.visibleSub.map((s) => (
            <Tab key={s.key} value={s.key} label={s.label} />
          ))}
        </Tabs>
      )}

      <Box sx={{ minHeight: 320, mt: currentGroup?.visibleSub.length > 1 ? 0 : 2 }}>
        {renderSection(activeSub, lead, refetch)}
      </Box>
    </Container>
  );
}

// Render the active sub-section's existing CONTENT component (unchanged — just remounted under
// the new grouping). The section keys are the leadHubTabs sub keys.
function renderSection(sub, lead, refetch) {
  switch (sub) {
    case "overview":
      return <OverviewTab lead={lead} />;
    case "calls":
      return <CallsTab lead={lead} onChanged={refetch} />;
    case "meetings":
      return <MeetingsTab lead={lead} onChanged={refetch} />;
    case "notes":
      return <NotesTab lead={lead} onChanged={refetch} />;
    case "files":
      return <FilesTab lead={lead} onChanged={refetch} />;
    case "projects":
      // Self-loads grouped projects via GET /v2/projects?clientLeadId=.
      return <LeadProjects clientLeadId={lead.id} />;
    case "sessions":
      return <LeadSessionsPanel clientLeadId={lead.id} />;
    case "contracts":
      return <LeadContractsPage leadId={lead.id} lead={lead} />;
    case "payments":
      return <PaymentsTab lead={lead} onChanged={refetch} />;
    case "priceOffers":
      return <PriceOffersTab lead={lead} onChanged={refetch} />;
    case "salesStage":
      return <SalesStagePanel leadId={lead.id} variant="panel" onChanged={refetch} />;
    case "spin":
      return <SpinPanel clientLeadId={lead.id} />;
    case "versa":
      return <VersaPanel clientLeadId={lead.id} />;
    default:
      return null;
  }
}

export default LeadDetailsPage;

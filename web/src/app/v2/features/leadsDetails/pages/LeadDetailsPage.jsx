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

import { useCallback, useEffect, useMemo } from "react";
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
import { pushRecentLead } from "@/app/v2/features/shell/hooks/useRecentLeads.js";
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
import { UpdatesList } from "@/app/v2/features/projects";
import { LeadChatLauncher } from "../components/LeadChatLauncher.jsx";

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
  const canViewChat = hasPermission(PERMISSIONS.CHAT.ROOM_LIST);
  const canViewUpdates = hasPermission(PERMISSIONS.UPDATE.LIST);

  const { lead, isLoading, error, refetch } = useLeadDetail(leadId, { autoFetch: canView });

  // Record this lead as recently-viewed (the recent-leads store; previously surfaced by the
  // retired workspace panel — retained for any future "recently viewed" surface).
  useEffect(() => {
    if (lead?.id != null) pushRecentLead({ id: lead.id, name: lead.client?.name });
  }, [lead?.id, lead?.client?.name]);

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
      [GATE.CHAT]: canViewChat,
      [GATE.UPDATES]: canViewUpdates,
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
      canViewChat,
      canViewUpdates,
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

  // navigate(group, sub, action?) — action is the optional one-click flag (?action=add) the
  // record/finance sub-tabs read on mount to auto-open their existing dialog (item 4). When
  // omitted we strip any stale action so it never re-triggers on a plain tab switch.
  const navigate = useCallback(
    (groupKey, subKey, action) => {
      const params = new URLSearchParams(sp.toString());
      params.set("tab", groupKey);
      if (subKey) params.set("sub", subKey);
      else params.delete("sub");
      if (action) params.set("action", action);
      else params.delete("action");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [sp, pathname, router],
  );

  // The pending one-click action from the URL (?action=add), and a consumer that clears it once
  // the target dialog has opened — so a refresh / back-forward won't reopen the dialog.
  const pendingAction = sp.get("action");
  const consumeAction = useCallback(() => {
    const params = new URLSearchParams(sp.toString());
    if (!params.has("action")) return;
    params.delete("action");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [sp, pathname, router]);

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
        onNavigate={navigate}
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

      {/*
        key={activeSub} forces React to UNMOUNT the previous sub-tab's tree and MOUNT the next one
        fresh, instead of reconciling two structurally different panels in the same position. Several
        panels render Portal/Transition children (MUI Tooltip/Menu/Dialog, tables); morphing one such
        tree into another in place is the classic trigger of "Failed to execute 'removeChild' on
        'Node'" — which is exactly what the المحادثات (chats) tab hit. A stable per-tab key makes
        every tab swap a clean remount.
      */}
      <Box
        key={activeSub}
        sx={{ minHeight: 320, mt: currentGroup?.visibleSub.length > 1 ? 0 : 2 }}
      >
        {renderSection(activeSub, lead, refetch, {
          user,
          autoOpenAction: pendingAction,
          onAutoOpenConsumed: consumeAction,
        })}
      </Box>
    </Container>
  );
}

// Render the active sub-section's existing CONTENT component (unchanged — just remounted under
// the new grouping). The section keys are the leadHubTabs sub keys.
function renderSection(sub, lead, refetch, extras = {}) {
  const { user, autoOpenAction, onAutoOpenConsumed } = extras;
  // The one-click auto-open flag is only meaningful for the sub-tab named in the URL — pass it
  // through only to that tab so a different tab never consumes another's action.
  const autoProps = {
    autoOpenAction,
    onAutoOpenConsumed,
  };
  switch (sub) {
    case "overview":
      return <OverviewTab lead={lead} />;
    case "calls":
      return <CallsTab lead={lead} onChanged={refetch} {...autoProps} />;
    case "meetings":
      return <MeetingsTab lead={lead} onChanged={refetch} />;
    case "notes":
      return <NotesTab lead={lead} onChanged={refetch} {...autoProps} />;
    case "files":
      return <FilesTab lead={lead} onChanged={refetch} />;
    case "projects":
      // Self-loads grouped projects via GET /v2/projects?clientLeadId=.
      return <LeadProjects clientLeadId={lead.id} />;
    case "sessions":
      return <LeadSessionsPanel clientLeadId={lead.id} />;
    case "updates":
      // Lead-scoped updates feed (item 6). Self-loads GET /v2/updates/:clientLeadId and self-gates
      // on PERMISSIONS.UPDATE.LIST; the department hint mirrors the projects usage (role → dept,
      // else STAFF — the BE narrows by role regardless).
      return <UpdatesList clientLeadId={lead.id} currentUserDepartment={departmentHint(user)} />;
    case "contracts":
      return <LeadContractsPage leadId={lead.id} lead={lead} />;
    case "payments":
      return <PaymentsTab lead={lead} onChanged={refetch} {...autoProps} />;
    case "priceOffers":
      return <PriceOffersTab lead={lead} onChanged={refetch} />;
    case "salesStage":
      return <SalesStagePanel leadId={lead.id} variant="panel" onChanged={refetch} />;
    case "spin":
      return <SpinPanel clientLeadId={lead.id} />;
    case "versa":
      return <VersaPanel clientLeadId={lead.id} />;
    case "chats":
      // Lead-scoped chat (item 6). The page-mode ChatContainer can't be embedded cleanly here
      // (it owns the ?roomId URL param and a full-height two-pane layout that collides with the
      // hub's ?tab/?sub state), so we mount a compact launcher that lists THIS lead's rooms
      // (useChatRooms({ clientLeadId })) and opens the real chat page focused on the chosen room.
      return <LeadChatLauncher leadId={lead.id} lead={lead} />;
    default:
      return null;
  }
}

// Best-effort department label for the updates feed. The DEPARTMENTS values are project-board
// departments; staff/sales/admin roles have no 1:1 mapping, so we fall back to "STAFF" (the
// UpdatesList default) — the backend narrows the rows by the authed user's role regardless.
const DEPARTMENT_BY_ROLE = {
  THREE_D_DESIGNER: "3D_Designer",
  TWO_D_DESIGNER: "2D_Study",
  TWO_D_EXECUTOR: "2D_Final_Plans",
};
function departmentHint(user) {
  return DEPARTMENT_BY_ROLE[user?.role] ?? "STAFF";
}

export default LeadDetailsPage;

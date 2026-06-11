"use client";

// Lead detail page — collapses the legacy PreviewLeadDialog / deals/[id] detail into one
// permission-gated, URL-tabbed feature. Tab state lives in ?tab=; the tab SET is filtered
// by the record's capabilities.* (e.g. price-offers/payments tabs only when the user can
// act on them) — the same predicate gates the tab's action buttons. Header actions
// (change-status, claim, convert) are each capability-gated (§5c).
//
// INTEGRATED cross-feature lead tools: the sales-stage stepper now lives in the header (always
// visible — "what's my next step"); SPIN + VERSA (questions feature) and the image-sessions
// session panel are mounted as capability/permission-gated tabs below.
// STILL DEFERRED (reported): Projects, Tasks/Modifications, Lead updates, Chats — they belong to
// OTHER not-yet-migrated FE modules (/v2/projects, /v2/tasks, /v2/chat) and are out of scope here.

import { useMemo } from "react";
import { Box, Container, Stack, Tab, Tabs, Typography } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import LoadingOverlay from "@/app/v2/shared/components/feedback/LoadingOverlay.jsx";
import { useLeadDetail } from "../hooks/useLeadDetail.js";
import { OverviewTab } from "../components/tabs/OverviewTab.jsx";
import { CallsTab } from "../components/tabs/CallsTab.jsx";
import { MeetingsTab } from "../components/tabs/MeetingsTab.jsx";
import { NotesTab } from "../components/tabs/NotesTab.jsx";
import { PriceOffersTab } from "../components/tabs/PriceOffersTab.jsx";
import { FilesTab } from "../components/tabs/FilesTab.jsx";
import { PaymentsTab } from "../components/tabs/PaymentsTab.jsx";
import { LeadStatusMenu } from "../components/LeadStatusMenu.jsx";
import { LeadAssignActions } from "@/app/v2/features/leads/components/LeadAssignActions.jsx";
import { statusLabel } from "@/app/v2/features/leads/config/leadsConstants.js";
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

  const { lead, isLoading, refetch } = useLeadDetail(leadId, { autoFetch: canView });

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // The status menu offers the beginner set for a non-primary, non-privileged staff user
  // (mirrors the legacy KanbanBeginerLeadsStatus branch). The server still enforces.
  const beginner = useMemo(() => {
    const privileged = PRIVILEGED_ROLES.includes(user?.role) || user?.isSuperSales;
    return user?.role === "STAFF" && !user?.isPrimary && !privileged;
  }, [user]);

  // Capability-gated tab set. Overview/calls/meetings/notes/files always available to a
  // viewer; price-offers + payments only when the user can act on them (capability hint).
  const caps = lead?.capabilities ?? {};
  const sections = useMemo(() => {
    const s = [
      { key: "overview", label: "التفاصيل" },
      { key: "calls", label: "المكالمات" },
      { key: "meetings", label: "الاجتماعات" },
      { key: "notes", label: "الملاحظات" },
      { key: "files", label: "المرفقات" },
    ];
    if (caps.canAddPriceOffer) s.push({ key: "priceOffers", label: "عروض الأسعار" });
    if (caps.canAddPayment || caps.canSendReminder) s.push({ key: "payments", label: "الدفعات" });
    // Cross-feature lead tools (permission-gated; lead-scope enforced server-side).
    if (canViewProjects) s.push({ key: "projects", label: "المشاريع" });
    if (canViewSpin) s.push({ key: "spin", label: "أسئلة SPIN" });
    if (canViewVersa) s.push({ key: "versa", label: "معالجة الاعتراضات" });
    if (canViewSessions) s.push({ key: "sessions", label: "جلسات الصور" });
    return s;
  }, [
    caps.canAddPriceOffer,
    caps.canAddPayment,
    caps.canSendReminder,
    canViewProjects,
    canViewSpin,
    canViewVersa,
    canViewSessions,
  ]);

  const active = useMemo(() => {
    const t = sp.get("tab");
    return sections.some((x) => x.key === t) ? t : "overview";
  }, [sp, sections]);

  function onChange(_e, key) {
    const params = new URLSearchParams(sp.toString());
    params.set("tab", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  if (!canView) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="textSecondary">لا تملك صلاحية الوصول إلى هذا العميل</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ position: "relative", py: 4 }}>
      <LoadingOverlay isLoading={isLoading} />

      {lead && (
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ md: "center" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h5">
              {lead?.client?.name ?? "—"} · #{String(lead.id).padStart(7, "0")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              الحالة: {statusLabel(lead.status)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <LeadAssignActions lead={lead} size="medium" onChanged={refetch} />
            <LeadStatusMenu
              lead={lead}
              canChangeStatus={caps.canChangeStatus}
              beginner={beginner}
              onChanged={refetch}
            />
          </Stack>
        </Stack>
      )}

      {/* Sales-stage stepper strip — always visible in the header so the next step is obvious. */}
      {lead && canViewStage && (
        <Box sx={{ mb: 2 }}>
          <SalesStagePanel leadId={leadId} variant="strip" onChanged={refetch} />
        </Box>
      )}

      <Tabs value={active} onChange={onChange} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
        {sections.map((tab) => (
          <Tab key={tab.key} value={tab.key} label={tab.label} />
        ))}
      </Tabs>

      <Box sx={{ minHeight: 320 }}>
        {lead && active === "overview" && <OverviewTab lead={lead} />}
        {lead && active === "calls" && <CallsTab lead={lead} onChanged={refetch} />}
        {lead && active === "meetings" && <MeetingsTab lead={lead} onChanged={refetch} />}
        {lead && active === "notes" && <NotesTab lead={lead} onChanged={refetch} />}
        {lead && active === "files" && <FilesTab lead={lead} onChanged={refetch} />}
        {lead && active === "priceOffers" && <PriceOffersTab lead={lead} onChanged={refetch} />}
        {lead && active === "payments" && <PaymentsTab lead={lead} onChanged={refetch} />}
        {/* Self-loads grouped projects via GET /v2/projects?clientLeadId=; only mounts on this tab. */}
        {lead && active === "projects" && <LeadProjects clientLeadId={lead.id} />}
        {lead && active === "spin" && <SpinPanel clientLeadId={lead.id} />}
        {lead && active === "versa" && <VersaPanel clientLeadId={lead.id} />}
        {lead && active === "sessions" && <LeadSessionsPanel clientLeadId={lead.id} />}
      </Box>
    </Container>
  );
}

export default LeadDetailsPage;

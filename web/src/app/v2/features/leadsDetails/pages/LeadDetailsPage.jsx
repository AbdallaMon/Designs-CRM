"use client";

// Lead detail — FLAT tab strip (reverted from the "hub" replan). A simple header band
// (client name + #id, status + payment chips, contact line, assign/status/delete actions)
// followed by ONE flat row of tabs (overview · calls · meetings · notes · files · price-offers
// · payments · contracts · projects · sessions · sales-stage · SPIN · VERSA · chats · updates).
// Tab state lives in the URL (?tab=). Each tab is gated on the SAME caps.* × permission-code
// predicates as before; only the hub shell (LeadHubHeader / LeadRelatedRail / LeadOrientationBand
// / leadHubTabs grouping) was removed. The sub-resource panels themselves are unchanged.
//
// Authorization is UNCHANGED: the same predicates gate the same tabs; the server still enforces
// every action. Single language? No — bilingual ar/en via useT() (this branch keeps i18n).

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdCategory,
  MdPerson,
  MdDeleteForever,
} from "react-icons/md";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useT } from "@/app/v2/lib/i18n";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import {
  LoadingState,
  ErrorState,
  PartialPermissionState,
  SectionCard,
} from "@/app/v2/shared/components";
import { StatusChip } from "@/app/v2/shared/components/StatusChip.jsx";
import { useLeadDetail } from "../hooks/useLeadDetail.js";
import { pushRecentLead } from "@/app/v2/features/shell/hooks/useRecentLeads.js";
import { LeadStatusMenu } from "../components/LeadStatusMenu.jsx";
import { OverviewTab } from "../components/tabs/OverviewTab.jsx";
import { CallsTab } from "../components/tabs/CallsTab.jsx";
import { MeetingsTab } from "../components/tabs/MeetingsTab.jsx";
import { NotesTab } from "../components/tabs/NotesTab.jsx";
import { FilesTab } from "../components/tabs/FilesTab.jsx";
import { PriceOffersTab } from "../components/tabs/PriceOffersTab.jsx";
import { PaymentsTab } from "../components/tabs/PaymentsTab.jsx";
import { LeadAssignActions } from "@/app/v2/features/leads/components/LeadAssignActions.jsx";
import { LeadAdminAssignAction } from "@/app/v2/features/leads/components/LeadAdminAssignAction.jsx";
import {
  paymentStatusLabel,
  categoryLabel,
} from "@/app/v2/features/leads/config/leadsConstants.js";
import { leadsService } from "@/app/v2/features/leads/leads.service.js";
import { runLeadMutation } from "@/app/v2/features/leads/leads.mutations.js";
import { adminResidualService } from "@/app/v2/features/adminResidual/adminResidual.service.js";
import { runAdminResidualMutation } from "@/app/v2/features/adminResidual/adminResidual.mutations.js";
import { LeadContractsPage } from "@/app/v2/features/contracts";
import { SalesStagePanel } from "@/app/v2/features/salesStages";
import { SpinPanel, VersaPanel } from "@/app/v2/features/questions";
import { LeadSessionsPanel } from "@/app/v2/features/imageSessions";
import { LeadProjects } from "@/app/v2/features/projects/components/LeadProjects.jsx";
import { UpdatesList } from "@/app/v2/features/projects";
import { LeadChatLauncher } from "../components/LeadChatLauncher.jsx";

const PRIVILEGED_ROLES = ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"];

// Best-effort department label for the updates feed (mirrors the projects usage; the BE narrows
// by the authed user's role regardless of this hint).
const DEPARTMENT_BY_ROLE = {
  THREE_D_DESIGNER: "3D_Designer",
  TWO_D_DESIGNER: "2D_Study",
  TWO_D_EXECUTOR: "2D_Final_Plans",
};
function departmentHint(user) {
  return DEPARTMENT_BY_ROLE[user?.role] ?? "STAFF";
}

// One contact chip: icon + value. Renders nothing when the value is absent.
function ContactItem({ icon, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary" }}>
      <Box sx={{ display: "flex", fontSize: 18, color: "text.disabled" }}>{icon}</Box>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function LeadDetailsPage({ leadId }) {
  const { hasPermission } = usePermission();
  const { t } = useT();
  const { user } = useAuth();
  const { setLoading } = useToastContext();
  const canView = hasPermission(PERMISSIONS.LEAD.VIEW);

  // Cross-feature lead-tool gates (CODES only — these lead-scoped dtos emit NO capabilities.*).
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
  // Destructive admin delete — base-role ADMIN-only on the BE; we DO NOT widen the FE gate.
  const canDelete = hasPermission(PERMISSIONS.ADMIN_RESIDUAL.LEAD_DELETE);

  const { lead, isLoading, error, refetch } = useLeadDetail(leadId, { autoFetch: canView });

  // Record this lead as recently-viewed (the recent-leads store).
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

  const caps = lead?.capabilities ?? {};

  // ── Flat tab set. Each entry is gated by a runtime boolean built from the SAME caps.* ×
  // permission-code predicates as the removed hub. Filtered to the visible set; order = display
  // order. `always` tabs (overview/calls/meetings/notes/files) are visible to any lead viewer.
  const tabs = useMemo(() => {
    const all = [
      { key: "overview", labelKey: "leadsDetails.sub.overview", show: true },
      { key: "calls", labelKey: "leadsDetails.sub.calls", show: true },
      { key: "meetings", labelKey: "leadsDetails.sub.meetings", show: true },
      { key: "notes", labelKey: "leadsDetails.sub.notes", show: true },
      { key: "files", labelKey: "leadsDetails.sub.files", show: true },
      { key: "priceOffers", labelKey: "leadsDetails.sub.priceOffers", show: Boolean(caps.canAddPriceOffer) },
      { key: "payments", labelKey: "leadsDetails.sub.payments", show: Boolean(caps.canAddPayment || caps.canSendReminder) },
      { key: "contracts", labelKey: "leadsDetails.sub.contracts", show: canViewContracts },
      { key: "projects", labelKey: "leadsDetails.sub.projects", show: canViewProjects },
      { key: "sessions", labelKey: "leadsDetails.sub.sessions", show: canViewSessions },
      { key: "salesStage", labelKey: "leadsDetails.sub.salesStage", show: canViewStage },
      { key: "spin", labelKey: "leadsDetails.sub.spin", show: canViewSpin },
      { key: "versa", labelKey: "leadsDetails.sub.versa", show: canViewVersa },
      { key: "chats", labelKey: "leadsDetails.sub.chats", show: canViewChat },
      { key: "updates", labelKey: "leadsDetails.sub.updates", show: canViewUpdates },
    ];
    return all.filter((tab) => tab.show);
  }, [
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
  ]);

  // ── URL state: ?tab=<key>, validated against the visible set (default → first visible tab).
  const activeTab = useMemo(() => {
    const requested = sp.get("tab");
    if (tabs.some((tab) => tab.key === requested)) return requested;
    return tabs[0]?.key;
  }, [sp, tabs]);

  const onTabChange = useCallback(
    (_e, key) => {
      const params = new URLSearchParams(sp.toString());
      params.set("tab", key);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [sp, pathname, router],
  );

  // ── delete lead (confirm dialog → DELETE /v2/admin/client-leads/:id) ──────────────
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const clientName = lead?.client?.name ?? `#${lead?.id ?? ""}`;

  async function handleDelete() {
    const res = await runAdminResidualMutation(
      () => adminResidualService.deleteLead(lead.id),
      { setLoading, loading: t("leadsDetails.delete.loading") },
    );
    setDeleting(false);
    setConfirmDelete(false);
    // On success leave the now-deleted detail for the leads pool.
    if (res) router.push("/v2/leads");
  }

  // ── 5 screen states ─────────────────────────────────────────────────────────────
  if (!canView) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PartialPermissionState
          denied
          title={t("leadsDetails.denied.title")}
          message={t("leadsDetails.denied.message")}
        />
      </Container>
    );
  }

  if (error && !isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState error={error} onRetry={refetch} />
      </Container>
    );
  }

  if (isLoading && !lead) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <SectionCard sx={{ mb: 2 }}>
          <LoadingState variant="detail" />
        </SectionCard>
      </Container>
    );
  }

  if (!lead) return null;

  const owner = lead.assignedTo;
  const ownerName = owner?.name;
  const emirate = lead.country || lead.emirate;
  const category = lead.selectedCategory ? categoryLabel(lead.selectedCategory) : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ── header band ──────────────────────────────────────────────────────────── */}
      <SectionCard sx={{ mb: 2 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ md: "flex-start" }}
            spacing={2}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {lead.client?.name ?? "—"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
                >
                  #{String(lead.id).padStart(7, "0")}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 1 }}>
                <StatusChip status={lead.status} domain="lead" />
                {lead.paymentStatus && (
                  <StatusChip
                    status={lead.paymentStatus}
                    domain="payment"
                    label={paymentStatusLabel(lead.paymentStatus)}
                  />
                )}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <LeadAssignActions lead={lead} size="medium" onChanged={refetch} />
              <LeadAdminAssignAction lead={lead} size="medium" onChanged={refetch} />
              <LeadStatusMenu
                lead={lead}
                canChangeStatus={caps.canChangeStatus}
                beginner={beginner}
                onChanged={refetch}
              />
              {canDelete && (
                <Button
                  variant="outlined"
                  color="error"
                  size="medium"
                  startIcon={<MdDeleteForever />}
                  onClick={() => setConfirmDelete(true)}
                >
                  {t("leadsDetails.delete.button")}
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Contact line */}
          <Stack direction="row" spacing={2.5} flexWrap="wrap" rowGap={1} alignItems="center">
            <ContactItem icon={<MdPhone />} value={lead.client?.phone} />
            <ContactItem icon={<MdEmail />} value={lead.client?.email} />
            <ContactItem icon={<MdLocationOn />} value={emirate} />
            <ContactItem icon={<MdCategory />} value={category} />
          </Stack>

          {/* Owner / assigned-to */}
          {ownerName && (
            <>
              <Divider />
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.main", fontSize: 14 }}>
                  {ownerName.trim().charAt(0) || <MdPerson />}
                </Avatar>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {t("leadsDetails.header.assignedTo")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {ownerName}
                </Typography>
              </Stack>
            </>
          )}
        </Stack>
      </SectionCard>

      {/* ── flat tab strip ───────────────────────────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onChange={onTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.key} value={tab.key} label={t(tab.labelKey)} />
        ))}
      </Tabs>

      {/*
        key={activeTab} forces a clean remount per tab (several panels render Portal/Transition
        children — MUI Tooltip/Menu/Dialog, tables — and morphing one such tree into another in
        place is the classic "Failed to execute 'removeChild' on 'Node'" trigger).
      */}
      <Box key={activeTab} sx={{ minHeight: 320 }}>
        {renderTab(activeTab, lead, refetch, user)}
      </Box>

      {/* ── delete confirm dialog ────────────────────────────────────────────────── */}
      <Dialog
        open={confirmDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
          {t("leadsDetails.delete.confirmTitle")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mt: 2 }}>
            {t("leadsDetails.delete.confirmBody").replace("{name}", clientName)}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={() => setConfirmDelete(false)} variant="outlined" disabled={deleting}>
            {t("leadsDetails.delete.cancel")}
          </Button>
          <Button
            onClick={() => {
              setDeleting(true);
              handleDelete();
            }}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            {t("leadsDetails.delete.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// Render the active tab's existing CONTENT component (unchanged — the sub-resource panels are
// shared). The tab keys match the flat tab set above.
function renderTab(tab, lead, refetch, user) {
  switch (tab) {
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
    case "priceOffers":
      return <PriceOffersTab lead={lead} onChanged={refetch} />;
    case "payments":
      return <PaymentsTab lead={lead} onChanged={refetch} />;
    case "contracts":
      return <LeadContractsPage leadId={lead.id} lead={lead} />;
    case "projects":
      return <LeadProjects clientLeadId={lead.id} />;
    case "sessions":
      return <LeadSessionsPanel clientLeadId={lead.id} />;
    case "salesStage":
      return <SalesStagePanel leadId={lead.id} variant="panel" onChanged={refetch} />;
    case "spin":
      return <SpinPanel clientLeadId={lead.id} />;
    case "versa":
      return <VersaPanel clientLeadId={lead.id} />;
    case "chats":
      return <LeadChatLauncher leadId={lead.id} lead={lead} />;
    case "updates":
      return <UpdatesList clientLeadId={lead.id} currentUserDepartment={departmentHint(user)} />;
    default:
      return null;
  }
}

export default LeadDetailsPage;

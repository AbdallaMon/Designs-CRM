"use client";

// <LeadHubHeader> — the hub header that replaces the bare title Stack on the lead detail.
// A SectionCard-styled identity band: client name + #leadId, the lead StatusChip (domain="lead")
// + a payment-status chip, a contact line (phone · email · emirate · category — missing parts
// omitted), the owner/assigned-to (name + avatar) when present, the sales-stage strip (when the
// lead carries stage data + the user can view it), and the primary actions on the inline-END.
//
// Authorization is NOT re-derived here: the page passes its already-computed gates
// (canChangeStatus from caps, beginner) and the action components self-gate on
// lead.capabilities.* — this component only LAYS OUT what the page allows. Single Arabic / RTL.

import { Avatar, Box, Button, Divider, Stack, Typography } from "@mui/material";
import {
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdCategory,
  MdPerson,
  MdAdd,
} from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n";
import { SectionCard } from "@/app/v2/shared/components/SectionCard.jsx";
import { StatusChip } from "@/app/v2/shared/components/StatusChip.jsx";
import { LeadStatusMenu } from "./LeadStatusMenu.jsx";
import { LeadDeleteAction } from "./LeadDeleteAction.jsx";
import { LeadAssignActions } from "@/app/v2/features/leads/components/LeadAssignActions.jsx";
import { LeadAdminAssignAction } from "@/app/v2/features/leads/components/LeadAdminAssignAction.jsx";
import {
  paymentStatusLabel,
  categoryLabel,
} from "@/app/v2/features/leads/config/leadsConstants.js";
import { SalesStagePanel } from "@/app/v2/features/salesStages";

// The compact one-click "daily verbs" row (H2 / item 4). Each verb is capability-gated via
// lead.capabilities.* and, instead of duplicating the dialog here, deep-links to the sub-tab that
// already owns it with an ?action=add flag the tab reads on mount to auto-open its dialog once.
function QuickActions({ caps, onNavigate }) {
  const { t } = useT();
  if (!onNavigate) return null;
  const verbs = [
    caps.canAddCall && { label: t("leadsDetails.header.quick.logCall"), group: "record", sub: "calls" },
    caps.canAddNote && { label: t("leadsDetails.header.quick.note"), group: "record", sub: "notes" },
    caps.canAddPayment && { label: t("leadsDetails.header.quick.payment"), group: "finance", sub: "payments" },
  ].filter(Boolean);

  if (verbs.length === 0) return null;

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
      {verbs.map((v) => (
        <Button
          key={v.sub}
          size="small"
          variant="outlined"
          startIcon={<MdAdd />}
          onClick={() => onNavigate(v.group, v.sub, "add")}
        >
          {v.label}
        </Button>
      ))}
    </Stack>
  );
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

export function LeadHubHeader({
  lead,
  leadId,
  canChangeStatus,
  beginner,
  canViewStage,
  onChanged,
  onNavigate,
}) {
  const { t } = useT();
  if (!lead) return null;

  const caps = lead.capabilities ?? {};
  const owner = lead.assignedTo;
  const ownerName = owner?.name;
  const emirate = lead.country || lead.emirate;
  const category = lead.selectedCategory ? categoryLabel(lead.selectedCategory) : null;

  return (
    <SectionCard sx={{ mb: 2 }}>
      <Stack spacing={2}>
        {/* Identity + actions row */}
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
              <Typography variant="body2" sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
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
            <LeadAssignActions lead={lead} size="medium" onChanged={onChanged} />
            <LeadAdminAssignAction lead={lead} size="medium" onChanged={onChanged} />
            <LeadStatusMenu
              lead={lead}
              canChangeStatus={canChangeStatus}
              beginner={beginner}
              onChanged={onChanged}
            />
            {/* Destructive delete — self-gates on ADMIN_RESIDUAL.LEAD_DELETE; replaces the old
                standalone delete-by-id page. Navigates back to the leads list on success. */}
            <LeadDeleteAction lead={lead} size="medium" />
          </Stack>
        </Stack>

        {/* Contact line */}
        <Stack direction="row" spacing={2.5} flexWrap="wrap" rowGap={1} alignItems="center">
          <ContactItem icon={<MdPhone />} value={lead.client?.phone} />
          <ContactItem icon={<MdEmail />} value={lead.client?.email} />
          <ContactItem icon={<MdLocationOn />} value={emirate} />
          <ContactItem icon={<MdCategory />} value={category} />
        </Stack>

        {/* One-click daily verbs (H2) — compact, capability-gated, deep-link + auto-open. */}
        <QuickActions caps={caps} onNavigate={onNavigate} />

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

        {/* Sales-stage stepper strip — visible when the user can view it (panel self-loads its
            own stage data and shows its own empty state). Mirrors the legacy always-on strip. */}
        {canViewStage && (
          <>
            <Divider />
            <SalesStagePanel leadId={leadId} variant="strip" onChanged={onChanged} />
          </>
        )}
      </Stack>
    </SectionCard>
  );
}

export default LeadHubHeader;

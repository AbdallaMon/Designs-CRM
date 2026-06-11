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

import { Avatar, Box, Divider, Stack, Typography } from "@mui/material";
import {
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdCategory,
  MdPerson,
} from "react-icons/md";
import { SectionCard } from "@/app/v2/shared/components/SectionCard.jsx";
import { StatusChip } from "@/app/v2/shared/components/StatusChip.jsx";
import { LeadStatusMenu } from "./LeadStatusMenu.jsx";
import { LeadAssignActions } from "@/app/v2/features/leads/components/LeadAssignActions.jsx";
import {
  paymentStatusLabel,
  categoryLabel,
} from "@/app/v2/features/leads/config/leadsConstants.js";
import { SalesStagePanel } from "@/app/v2/features/salesStages";

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
}) {
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
            <LeadStatusMenu
              lead={lead}
              canChangeStatus={canChangeStatus}
              beginner={beginner}
              onChanged={onChanged}
            />
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
                مُسند إلى
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

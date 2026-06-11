"use client";

// <WorkspaceLeadRow> — a single client-lead row in the "new leads" / "on-hold deals" sections.
// The list items are ClientLead rows carrying backend-computed `capabilities.*` (§5c), so the
// primary action (claim / convert) is delegated to the SHARED <LeadAssignActions>, which gates
// each button on lead.capabilities.canAssignSelf / canConvert. When no capability applies the
// row renders without an action — still a link to the lead hub (no invented endpoints).
// Single-language Arabic / RTL.
//
// Props:
//   lead       ClientLead row (with capabilities.*).
//   onChanged  () => void — refetch the section after a claim/convert.

import dayjs from "dayjs";
import { StatusChip } from "@/app/v2/shared/components";
import { categoryLabel } from "../config/leadsConstants.js";
import { LeadAssignActions } from "./LeadAssignActions.jsx";
import { WorkspaceRow } from "./WorkspaceRow.jsx";

export function WorkspaceLeadRow({ lead, onChanged }) {
  const name = lead?.client?.name ?? `#${String(lead?.id ?? "").padStart(7, "0")}`;
  const created = lead?.createdAt ? dayjs(lead.createdAt) : null;
  const metaParts = [];
  if (lead?.selectedCategory) metaParts.push(categoryLabel(lead.selectedCategory));
  if (created?.isValid?.()) metaParts.push(created.format("YYYY-MM-DD"));

  return (
    <WorkspaceRow
      href={`/v2/leads/${lead?.id}`}
      primary={name}
      secondary={metaParts.length ? metaParts.join(" · ") : null}
      chip={lead?.status ? <StatusChip status={lead.status} domain="lead" /> : null}
      action={<LeadAssignActions lead={lead} onChanged={onChanged} />}
    />
  );
}

export default WorkspaceLeadRow;

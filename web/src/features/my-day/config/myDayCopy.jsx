"use client";
// My Day copy — extends the cockpit signal map with the queue-only signal types and the
// team-lens exception copy. Language-neutral types/params in, English strings out.
import { MdTimeline } from "react-icons/md";
import { getActionConfig } from "@/features/leads/cockpit/config/cockpitActions.jsx";

// Work-stage queue signals (designer tier) — not in the cockpit map.
const MY_DAY_ONLY_CONFIG = {
  DELIVERY_OVERDUE: {
    icon: <MdTimeline />,
    severity: "critical",
    title: () => "Delivery overdue",
    description: (p = {}) =>
      `${p.projectType ?? "Stage"} delivery was due ${p.overdueDays ?? 0}d ago — finish or flag it now.`,
    ctaLabel: "Open work stage",
  },
  STAGE_DUE_SOON: {
    icon: <MdTimeline />,
    severity: "warning",
    title: () => "Delivery due soon",
    description: (p = {}) =>
      `${p.projectType ?? "Stage"} delivery in ${p.hoursLeft ?? 0}h.`,
    ctaLabel: "Open work stage",
  },
  WORK_STAGE_ASSIGNED_TO_YOU: {
    icon: <MdTimeline />,
    severity: "warning",
    title: () => "Stage in progress",
    description: (p = {}) => `Your ${p.projectType ?? ""} stage is in progress.`,
    ctaLabel: "Open work stage",
  },
};

export function getMyDaySignalConfig(type) {
  return getActionConfig(type) || MY_DAY_ONLY_CONFIG[type] || null;
}

// Team-lens exception copy (params in, one English line out).
export const TEAM_EXCEPTION_COPY = {
  LEAD_STALE_TEAM: (p = {}) => `${p.userName ?? "A rep"} has ${p.count ?? 0} stale lead(s) — no activity in 5+ days`,
  LEAD_UNCLAIMED_AGING: (p = {}) => `${p.count ?? 0} new lead(s) unclaimed for 2+ days`,
  CALL_OVERDUE_TEAM: (p = {}) => `${p.userName ?? "A rep"} has ${p.count ?? 0} overdue call(s)`,
  CONTRACT_SIGNING_STALLED: (p = {}) => `Contract for ${p.clientName ?? "a client"} awaiting signature for ${p.sinceDays ?? 0}+ days`,
  DELIVERY_OVERDUE_TEAM: (p = {}) => `${p.projectType ?? "A stage"} delivery overdue (${(p.designers ?? []).map((d) => d.name).join(", ") || "unassigned"})`,
  DELIVERY_DUE_SOON_TEAM: (p = {}) => `${p.projectType ?? "A stage"} delivery due within 48h (${(p.designers ?? []).map((d) => d.name).join(", ") || "unassigned"})`,
  REP_OVER_CAPACITY: (p = {}) => `${p.userName ?? "A rep"} is over capacity: ${p.activeCount ?? 0}/${p.maxCount ?? 0} active leads`,
};

export function resolveExceptionCopy(type, params) {
  const fn = TEAM_EXCEPTION_COPY[type];
  return fn ? fn(params) : type;
}

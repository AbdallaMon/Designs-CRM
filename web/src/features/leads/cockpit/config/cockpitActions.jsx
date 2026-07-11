"use client";
// Config-driven copy for the Sales Deal Cockpit.
//
// The backend cockpit endpoint (`GET /v2/leads/:id/cockpit`) returns LANGUAGE-NEUTRAL
// signals only — an action `type`, a `severity`, a `params` object, and a `cta`. ALL the
// human-facing English copy for those signals is resolved HERE, exactly like the
// message-code → English pattern used elsewhere in the app. Nothing in the backend is
// prose; this file is the single place a signal type becomes words a salesperson reads.
//
// Each entry: { icon, severity, title(params), description(params), ctaLabel }.
//   • `severity` mirrors the backend severity (critical | warning | info) and drives color.
//   • `title` / `description` are functions of the action's `params` (see the plan/spec
//     for the params carried by each type).
import { FaMoneyBillWave } from "react-icons/fa";
import { IoMdCall, IoMdContract } from "react-icons/io";
import { PiCurrencyDollarSimpleLight } from "react-icons/pi";
import {
  MdAnalytics,
  MdCheckCircle,
  MdOutlineQuestionAnswer,
  MdSchedule,
  MdTimeline,
} from "react-icons/md";
import { RiAlarmLine } from "react-icons/ri";
import { salesStageEnum } from "@/app/helpers/constants";

// SalesStageType enum key → human label (reuses the existing dictionary; the handful of
// Arabic stage labels `master` keeps are intentional — see CLAUDE.md §1/§5).
const STAGE_LABEL = salesStageEnum.reduce((acc, s) => {
  acc[s.key] = s.label;
  return acc;
}, {});

export function stageLabel(key) {
  if (!key) return "—";
  return STAGE_LABEL[key] || key;
}

// A backend `cta.tabKey` → the workspace section KEY it should switch to (leadSections.jsx).
// Some cockpit tabKeys (payments, contracts) have no dedicated section — they map to the
// closest existing commercial section so the nav still lands somewhere meaningful.
export const GOTO_SECTION = {
  calls: "calls",
  meetings: "meetings",
  priceOffers: "priceOffers",
  analysis: "analysis",
  payments: "extraServices",
  contracts: "priceOffers",
};

// The nine language-neutral action types → English copy. `params` shapes:
//   CALL_OVERDUE / MEETING_OVERDUE → { count, mostOverdueAt, overdueDays }
//   DISCOVERY_INCOMPLETE           → { unansweredCount }
//   OBJECTION_UNHANDLED            → { count }
//   ADVANCE_STAGE                  → { currentStage, nextStage }
//   others                         → {}
export const COCKPIT_ACTION_CONFIG = {
  CALL_OVERDUE: {
    icon: <IoMdCall />,
    severity: "critical",
    title: () => "Overdue call",
    description: (p = {}) =>
      `${p.count || 0} call(s), most overdue ${p.overdueDays ?? 0}d ago`,
    ctaLabel: "Schedule a call",
  },
  MEETING_OVERDUE: {
    icon: <MdSchedule />,
    severity: "critical",
    title: () => "Overdue meeting",
    description: (p = {}) =>
      `${p.count || 0} meeting(s), most overdue ${p.overdueDays ?? 0}d ago`,
    ctaLabel: "Schedule a meeting",
  },
  PAYMENT_OVERDUE: {
    icon: <FaMoneyBillWave />,
    severity: "critical",
    title: () => "Payment overdue",
    description: () => "A payment on this deal is overdue.",
    ctaLabel: "Add payments",
  },
  DISCOVERY_INCOMPLETE: {
    icon: <MdAnalytics />,
    severity: "warning",
    title: () => "Discovery incomplete",
    description: (p = {}) =>
      `${p.unansweredCount || 0} SPIN question(s) still unanswered`,
    ctaLabel: "Open client analysis",
  },
  OBJECTION_UNHANDLED: {
    icon: <MdOutlineQuestionAnswer />,
    severity: "warning",
    title: () => "Unhandled objection",
    description: (p = {}) => `${p.count || 0} objection(s) without a response`,
    ctaLabel: "Open client analysis",
  },
  NO_PRICE_OFFER: {
    icon: <PiCurrencyDollarSimpleLight />,
    severity: "warning",
    title: () => "No price offer sent",
    description: () => "This deal has no price offer yet.",
    ctaLabel: "Add price offer",
  },
  NO_UPCOMING_TOUCH: {
    icon: <RiAlarmLine />,
    severity: "warning",
    title: () => "No upcoming touchpoint",
    description: () => "No future call or meeting is scheduled.",
    ctaLabel: "Schedule a call",
  },
  ADVANCE_STAGE: {
    icon: <MdTimeline />,
    severity: "info",
    title: () => "Ready to advance",
    description: (p = {}) =>
      `Stage "${stageLabel(p.currentStage)}" is complete — move to "${stageLabel(
        p.nextStage,
      )}"`,
    ctaLabel: "Change status",
  },
  SIGNING_AWAITED: {
    icon: <IoMdContract />,
    severity: "warning",
    title: () => "Awaiting signature",
    description: () => "The contract is out for signing — follow it up.",
    ctaLabel: "View contract",
  },
  CONTRACT_STAGE_IN_PROGRESS: {
    icon: <MdTimeline />,
    severity: "info",
    title: () => "Contract in production",
    description: (p = {}) =>
      `Stage ${p.level || "—"} (${p.levelsDone ?? 0}/${p.levelsTotal ?? 0}) in progress`,
    ctaLabel: "View contract",
  },
  AFTER_SALES_DUE: {
    icon: <RiAlarmLine />,
    severity: "info",
    title: () => "After-sales follow-up due",
    description: () => "Delivery is complete — do the after-sales follow-up.",
    ctaLabel: "Change status",
  },
  CONTRACT_COMPLETED: {
    icon: <MdCheckCircle />,
    severity: "info",
    title: () => "Delivery complete",
    description: () => "This contract is fully delivered.",
    ctaLabel: "View contract",
  },
  DOWNPAYMENT_DUE: {
    icon: <FaMoneyBillWave />,
    severity: "critical",
    title: () => "Down-payment due",
    description: () => "The signature/down-payment hasn't been recorded yet.",
    ctaLabel: "Record payment",
  },
  PAYMENT_DUE: {
    icon: <PiCurrencyDollarSimpleLight />,
    severity: "warning",
    title: () => "Payment due",
    description: (p = {}) => `${p.count || 0} payment(s) awaiting collection`,
    ctaLabel: "Record payment",
  },
};

// Severity → theme palette key (color of the accent rail, icon tile, and CTA).
export const SEVERITY_PALETTE = {
  critical: "error",
  warning: "warning",
  info: "info",
};

export function getActionConfig(type) {
  return COCKPIT_ACTION_CONFIG[type] || null;
}

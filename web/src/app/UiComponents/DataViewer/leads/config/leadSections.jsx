"use client";
// Config-driven section registry for the lead / deal detail.
//
// This replaces the old fragile system where each tab lived at a HARD-CODED numeric
// index and the panels did brittle index math (`index={payments?.length > 0 ? 9 : 8}`)
// that drifted whenever a tab's visibility changed. Here every section is a keyed entry:
//   { key, label, group, icon, tabKey?, visible(ctx), count(ctx), render(ctx) }
// The shell renders them grouped, the URL stores the section KEY (stable + shareable),
// and `tabKey` links a section to its per-tab cache (LeadDetailsProvider) for live badges.
import { Stack } from "@mui/material";
import { BsFileText, BsInfoCircle, BsTelephone } from "react-icons/bs";
import { GoPaperclip } from "react-icons/go";
import { PiCurrencyDollarSimpleLight } from "react-icons/pi";
import { FaServicestack } from "react-icons/fa";
import {
  MdAnalytics,
  MdChat,
  MdModeEdit,
  MdSchedule,
  MdTimeline,
  MdUpdate,
  MdWork,
} from "react-icons/md";

import { LEAD_CODES } from "@/app/helpers/permissionCodes";
import { LeadInfo } from "../panels/LeadInfo";
import { LeadContactInfo } from "../panels/LeadContactInfo";
import LeadStripeInfo from "../panels/StipieData";
import { BookingLeadDetailsCard } from "@/app/UiComponents/booking-lead";
import SalesStageComponent from "../tabs/SalesStage";
import { CallReminders } from "../tabs/CallReminders";
import { SalesToolsTabs } from "../tabs/SalesToolsTabs";
import { MeetingReminders } from "../tabs/MeetingReminders";
import { LeadNotes } from "../tabs/LeadsNotes";
import { PriceOffersList } from "../tabs/PriceOffers";
import { FileList } from "../tabs/Files";
import { ExtraServicesList } from "../tabs/ExtraTabs";
import { TasksList } from "../../tasks/TasksList";
import LeadProjects from "../../work-stages/projects/LeadProjects";
import UpdatesList from "../leadUpdates/UpdatesList";
import ChatsTab from "../tabs/ChatsTab";

// The Details ("overview") body — the always-present shared lead data.
function LeadOverview({ lead, admin, setLead, setleads }) {
  return (
    <Stack spacing={3}>
      <LeadInfo lead={lead} setLead={setLead} setleads={setleads} />
      <LeadContactInfo lead={lead} setLead={setLead} setleads={setleads} />
      <BookingLeadDetailsCard lead={lead} />
      <LeadStripeInfo lead={lead} />
    </Stack>
  );
}

// Section groups (rendered as labelled clusters in the left rail, in this order).
export const LEAD_SECTION_GROUPS = [
  { key: "overview", label: "Overview" },
  { key: "activity", label: "Activity" },
  { key: "commercial", label: "Commercial & files" },
  { key: "delivery", label: "Delivery" },
  { key: "communication", label: "Communication" },
];

// The single source of truth for what sections exist, when they show, and how they render.
export const LEAD_SECTIONS = [
  {
    key: "details",
    label: "Details",
    group: "overview",
    icon: <BsInfoCircle size={18} />,
    visible: () => true,
    render: (ctx) => (
      <LeadOverview
        lead={ctx.lead}
        admin={ctx.admin}
        setLead={ctx.setLead}
        setleads={ctx.setleads}
      />
    ),
  },
  {
    key: "salesStage",
    label: "Sales stage",
    group: "overview",
    icon: <MdTimeline size={18} />,
    visible: () => true,
    render: (ctx) => <SalesStageComponent clientLeadId={ctx.lead.id} />,
  },
  {
    key: "analysis",
    label: "Client analysis",
    group: "overview",
    icon: <MdAnalytics size={18} />,
    // Parity: master shows this to admin || any STAFF; lead.analysis.view is granted to all
    // sales profiles + admin (isSuperSales ⟹ STAFF invariant makes this exact).
    visible: (ctx) => ctx.perms.hasPermission(LEAD_CODES.ANALYSIS_VIEW),
    render: (ctx) => (
      <SalesToolsTabs
        lead={ctx.lead}
        setleads={ctx.setleads}
        setLead={ctx.setLead}
      />
    ),
  },
  {
    key: "calls",
    label: "Calls",
    group: "activity",
    icon: <BsTelephone size={18} />,
    tabKey: "calls",
    count: (ctx) => ctx.lead.callReminders?.length,
    visible: () => true,
    render: (ctx) => (
      <CallReminders
        admin={ctx.admin}
        lead={ctx.lead}
        setleads={ctx.setleads}
        notUser={ctx.notUser}
      />
    ),
  },
  {
    key: "meetings",
    label: "Meetings",
    group: "activity",
    icon: <MdSchedule size={18} />,
    tabKey: "meetings",
    count: (ctx) => ctx.lead.meetingReminders?.length,
    visible: () => true,
    render: (ctx) => (
      <MeetingReminders
        admin={ctx.admin}
        lead={ctx.lead}
        setleads={ctx.setleads}
        notUser={ctx.notUser}
      />
    ),
  },
  {
    key: "notes",
    label: "Notes",
    group: "activity",
    icon: <BsFileText size={18} />,
    tabKey: "notes",
    count: (ctx) => ctx.lead.notes?.length,
    visible: () => true,
    render: (ctx) => (
      <LeadNotes admin={ctx.admin} lead={ctx.lead} notUser={ctx.notUser} />
    ),
  },
  {
    key: "priceOffers",
    label: "Price offers",
    group: "commercial",
    icon: <PiCurrencyDollarSimpleLight size={18} />,
    tabKey: "priceOffers",
    count: (ctx) => ctx.lead.priceOffers?.length,
    visible: (ctx) => ctx.perms.hasPermission(LEAD_CODES.PRICE_OFFER_VIEW),
    render: (ctx) => (
      <PriceOffersList admin={ctx.admin} lead={ctx.lead} notUser={ctx.notUser} />
    ),
  },
  {
    key: "files",
    label: "Attachments",
    group: "commercial",
    icon: <GoPaperclip size={18} />,
    tabKey: "files",
    count: (ctx) => ctx.lead.files?.length,
    visible: () => true,
    render: (ctx) => (
      <FileList admin={ctx.admin} lead={ctx.lead} notUser={ctx.notUser} />
    ),
  },
  {
    key: "extraServices",
    label: "Another services",
    group: "commercial",
    icon: <FaServicestack size={18} />,
    count: (ctx) => ctx.payments?.length,
    visible: (ctx) => ctx.payments?.length > 0,
    render: (ctx) => (
      <ExtraServicesList
        admin={ctx.admin}
        lead={ctx.lead}
        notUser={ctx.notUser}
        setPayments={ctx.setPayments}
      />
    ),
  },
  {
    key: "projects",
    label: "Projects",
    group: "delivery",
    icon: <MdWork size={18} />,
    // The old role restriction (ADMIN/SUPER_ADMIN/STAFF) is redundant with the code under
    // the isSuperSales⟹STAFF invariant, so the code alone preserves visibility.
    visible: (ctx) => ctx.perms.hasPermission(LEAD_CODES.PROJECTS_VIEW),
    render: (ctx) => <LeadProjects clientLeadId={ctx.lead.id} framed={false} />,
  },
  {
    key: "modifications",
    label: "Modifications",
    group: "delivery",
    icon: <MdModeEdit size={18} />,
    visible: (ctx) => ctx.perms.hasPermission(LEAD_CODES.MODIFICATIONS_VIEW),
    render: (ctx) => (
      <TasksList name="Modification" type="MODIFICATION" clientLeadId={ctx.lead.id} />
    ),
  },
  {
    key: "updates",
    label: "Updates",
    group: "delivery",
    icon: <MdUpdate size={18} />,
    visible: (ctx) =>
      ctx.lead.status === "FINALIZED" && ctx.perms.hasPermission(LEAD_CODES.UPDATES_VIEW),
    render: (ctx) => <UpdatesList clientLeadId={ctx.lead.id} />,
  },
  {
    key: "chats",
    label: "Chats",
    group: "communication",
    icon: <MdChat size={18} />,
    visible: () => true,
    render: (ctx) => <ChatsTab clientLeadId={ctx.lead.id} />,
  },
];

// Visible sections for the current context, in registry order.
export function getVisibleLeadSections(ctx) {
  return LEAD_SECTIONS.filter((s) => s.visible(ctx));
}

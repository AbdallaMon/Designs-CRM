"use client";

// <ActionQueue> — "يحتاج انتباهك": the PRIMARY value of the dashboard (UX plan §3.1,
// ACTION-QUEUE-FIRST). It composes two reads into ONE prioritized, deep-linkable list:
//   • getLatestLeads()      — newest unassigned NEW leads waiting for first contact (the shared
//                             new-lead pool; the BE returns it to every authed role).
//   • getRecentActivities() — the caller's latest notifications, each carrying a `link` to its
//                             source record.
// New-lead rows are prioritized ABOVE activity rows (a waiting client > a passive notification).
// Each row is a deep link to its NEXT action; the section never just lists — it routes.
//
// Both reads are isolated (own WidgetBoundary) so one failing doesn't blank the queue. When BOTH
// return nothing, the section shows the role-aware "كل شيء على ما يرام" all-good empty state.
// Single-language Arabic / RTL; logical spacing; ≥24px targets via list-item rows.

import NextLink from "next/link";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Stack,
} from "@mui/material";
import { MdPersonAddAlt1, MdNotificationsActive, MdChevronLeft } from "react-icons/md";
import { SectionCard, StatusChip } from "@/app/v2/shared/components";
import { WidgetBoundary } from "./WidgetBoundary.jsx";
import { useDashboardWidget } from "../hooks/useDashboardWidget.js";
import { LATEST_LEADS_URL, RECENT_ACTIVITIES_URL } from "../config/constant.js";
import { DASHBOARD_SECTIONS, DASHBOARD_COPY, QUEUE_COPY } from "../config/dashboardConstants.js";

function formatWhen(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("ar-AE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export function ActionQueue({ query, enabled }) {
  const leads = useDashboardWidget({ base: LATEST_LEADS_URL, query, enabled, scoped: false });
  const activities = useDashboardWidget({ base: RECENT_ACTIVITIES_URL, query, enabled });

  const leadRows = Array.isArray(leads.data) ? leads.data : [];
  const activityRows = Array.isArray(activities.data) ? activities.data : [];

  const loading = leads.isLoading || activities.isLoading;
  // Surface an error only when BOTH halves fail — a partial queue is still useful.
  const error = leads.error && activities.error ? leads.error : null;
  const onRetry = () => {
    if (leads.error) leads.refetch();
    if (activities.error) activities.refetch();
  };
  const isEmpty = leadRows.length === 0 && activityRows.length === 0;

  return (
    <SectionCard title={DASHBOARD_SECTIONS.actionQueue} noPadding sx={{ mb: 3 }}>
      <Box sx={{ px: 1, py: isEmpty || loading || error ? 1 : 0 }}>
        <WidgetBoundary
          loading={loading}
          error={error}
          onRetry={onRetry}
          isEmpty={isEmpty}
          empty={{
            title: DASHBOARD_COPY.queueAllGoodTitle,
            description: DASHBOARD_COPY.queueAllGoodDescription,
          }}
        >
          <List disablePadding>
            {leadRows.length > 0 && (
              <GroupLabel text={QUEUE_COPY.latestLeads.groupTitle} />
            )}
            {leadRows.map((lead) => (
              <QueueRow
                key={`lead-${lead.id}`}
                href={`/v2/leads/${lead.id}`}
                icon={<MdPersonAddAlt1 />}
                primary={lead?.client?.name || `عميل #${lead.id}`}
                when={formatWhen(lead.createdAt)}
                actionLabel={QUEUE_COPY.latestLeads.actionLabel}
                chip={lead.status ? <StatusChip status={lead.status} domain="lead" /> : null}
              />
            ))}

            {leadRows.length > 0 && activityRows.length > 0 && <Divider component="li" />}

            {activityRows.length > 0 && (
              <GroupLabel text={QUEUE_COPY.recentActivities.groupTitle} />
            )}
            {activityRows.map((act) => (
              <QueueRow
                key={`act-${act.id}`}
                href={act.link || undefined}
                icon={<MdNotificationsActive />}
                primary={<ActivityContent act={act} />}
                primaryIsNode
                when={formatWhen(act.createdAt)}
                actionLabel={act.link ? QUEUE_COPY.recentActivities.actionLabel : undefined}
              />
            ))}
          </List>
        </WidgetBoundary>
      </Box>
    </SectionCard>
  );
}

function GroupLabel({ text }) {
  return (
    <Typography
      component="li"
      variant="overline"
      color="text.secondary"
      sx={{ display: "block", px: 2, pt: 1.5, pb: 0.5 }}
    >
      {text}
    </Typography>
  );
}

// Renders a notification's `content`. When it's HTML (contentType === "HTML" or it contains a
// "<" tag), inject it safely via a div so the embedded markup/links render instead of showing
// escaped tags; otherwise render the plain text. (Same safe-HTML render as the notification bell.)
function ActivityContent({ act }) {
  const content = act?.content ?? "";
  const isHtml = act?.contentType === "HTML" || /</.test(content);
  if (isHtml) {
    return (
      <Typography
        component="div"
        variant="body2"
        sx={{ textAlign: "start", "& a": { color: "primary.main" } }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return (
    <Typography component="div" variant="body2" noWrap sx={{ textAlign: "start" }}>
      {content || "نشاط"}
    </Typography>
  );
}

function QueueRow({ href, icon, primary, primaryIsNode, when, actionLabel, chip }) {
  const interactive = Boolean(href);
  return (
    <ListItemButton
      {...(interactive ? { component: NextLink, href, scroll: false } : { disableRipple: true })}
      sx={{ borderRadius: 2, py: 1, alignItems: "center", minHeight: 48 }}
    >
      <ListItemIcon sx={{ minWidth: 40, color: "primary.main", fontSize: 22 }}>{icon}</ListItemIcon>
      <ListItemText
        primary={primary}
        secondary={when}
        primaryTypographyProps={
          primaryIsNode ? { component: "div" } : { noWrap: true, sx: { textAlign: "start" } }
        }
        secondaryTypographyProps={{ sx: { textAlign: "start" } }}
      />
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
        {chip}
        {actionLabel && (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "primary.main" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {actionLabel}
            </Typography>
            <Box component={MdChevronLeft} sx={{ fontSize: 20 }} />
          </Stack>
        )}
      </Stack>
    </ListItemButton>
  );
}

export default ActionQueue;

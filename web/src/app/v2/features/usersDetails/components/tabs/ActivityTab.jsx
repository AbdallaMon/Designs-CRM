"use client";

// Activity tab — the §5c admin-on-behalf reads, EACH block gated on its OWN code:
//   • Logs       → GET /:userId/logs       (today's notifications)   [user.view_logs]
//   • Last-seen  → GET /:userId/last-seen   (monthly activity)        [user.view_last_seen]
// Both are lazy reads with the five states. The payload shapes route to legacy services, so we
// render DEFENSIVELY (array of records → list; object → key/value). No capability needed (the
// codes gate; §3.8 notes these are code-gated reads). Single-language Arabic / RTL.

import {
  Box,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import {
  SectionCard,
  LoadingState,
  ErrorState,
  EmptyState,
  PartialPermissionState,
} from "@/app/v2/shared/components";
import { usersService } from "@/app/v2/features/users/users.service.js";
import { usersMessages } from "@/app/v2/features/users/config/usersMessages.js";
import { useLazyResource } from "../../hooks/useLazyResource.js";

const P = PERMISSIONS.USER;

export function ActivityTab({ userId }) {
  const { hasPermission } = usePermission();
  const canLogs = hasPermission(P.VIEW_LOGS);
  const canLastSeen = hasPermission(P.VIEW_LAST_SEEN);

  if (!canLogs && !canLastSeen) {
    return (
      <PartialPermissionState
        denied
        title="سجل النشاط غير متاح لصلاحياتك"
        message="لا تملك صلاحية عرض سجلّات هذا المستخدم."
      />
    );
  }

  return (
    <Stack spacing={2}>
      {canLogs && (
        <LazyBlock
          title="سجلّات اليوم"
          fetcher={() => usersService.getUserLogs(userId)}
          userId={userId}
          emptyTitle="لا توجد سجلّات اليوم"
        />
      )}
      {canLastSeen && (
        <LazyBlock
          title="آخر نشاط (شهري)"
          fetcher={() => usersService.getUserLastSeen(userId)}
          userId={userId}
          emptyTitle="لا يوجد نشاط مسجّل"
        />
      )}
    </Stack>
  );
}

function LazyBlock({ title, fetcher, userId, emptyTitle }) {
  const { data, isLoading, error, refetch } = useLazyResource(fetcher, { deps: [userId] });

  let body;
  if (error) {
    body = <ErrorState error={error} onRetry={refetch} resolver={usersMessages} />;
  } else if (isLoading) {
    body = <LoadingState variant="table" rows={4} columns={2} />;
  } else if (Array.isArray(data)) {
    body =
      data.length === 0 ? (
        <EmptyState title={emptyTitle} />
      ) : (
        <List dense>
          {data.map((entry, i) => (
            <ListItem key={i} divider>
              <ListItemText
                primary={entry?.title ?? entry?.message ?? entry?.content ?? `سجل #${i + 1}`}
                secondary={entry?.createdAt ?? entry?.date ?? undefined}
              />
            </ListItem>
          ))}
        </List>
      );
  } else if (data && typeof data === "object") {
    const entries = Object.entries(data);
    body =
      entries.length === 0 ? (
        <EmptyState title={emptyTitle} />
      ) : (
        <Box>
          {entries.map(([k, v]) => (
            <Stack key={k} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {k}
              </Typography>
              <Typography variant="body2">{String(v)}</Typography>
            </Stack>
          ))}
        </Box>
      );
  } else {
    body = <EmptyState title={emptyTitle} />;
  }

  return <SectionCard title={title}>{body}</SectionCard>;
}

export default ActivityTab;

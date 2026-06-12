"use client";

// Notifications screen — the real, working UI on top of the v2 data layer. Permission-gated on
// notification.list; the "mark all read" header action is gated on notification.mark_read. All
// I/O goes through notifications.service (the SOLE API caller, pointed at /v2/notifications) via
// the useNotifications paginated hook; writes go through runNotificationsMutation (CODE→Arabic
// toast). Single-language Arabic, RTL. Mirrors the features/leads house style (config-driven
// rows, usePermission gating, *.mutations runner) + features/dashboard html-content rendering.
//
// ── BACKEND REALITY (server/src/modules/notifications) ──────────────────────────────────────
// The notification surface exposes exactly ONE write action: POST /actions/mark-read. Its usecase
// (markRead) calls repo.markAllReadForUser → updateMany({ where:{ isRead:false, userId } }), i.e.
// it marks ALL of the caller's unread notifications read. There is NO per-item mark-read endpoint
// and NO separate "mark-all" endpoint — the single action IS the bulk mark-all. So:
//   • "تحديد الكل كمقروء" calls that action directly.
//   • A per-item row click marks THAT row read OPTIMISTICALLY in the UI for immediate feedback,
//     then navigates to its link. We do NOT invent a per-item endpoint; the server-side read state
//     is reconciled by the bulk action / next refetch. (Reported to the user.)

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Container,
  IconButton,
  List,
  Paper,
  Stack,
  TablePagination,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdDoneAll, MdRefresh, MdNotificationsNone } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { notificationsService } from "../notifications.service.js";
import { runNotificationsMutation } from "../notifications.mutations.js";
import { useNotifications } from "../hooks/useNotifications.js";
import { NotificationItem } from "../components/NotificationItem.jsx";

const P = PERMISSIONS.NOTIFICATION;

export function NotificationsPage() {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const canList = hasPermission(P.LIST);
  const canMarkRead = hasPermission(P.MARK_READ);

  const [marking, setMarking] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Primary paginated read (§5c shape { items, total, page, pageSize }).
  const listFn = useCallback((params) => notificationsService.list(params), []);
  const {
    items,
    setItems,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    isLoading,
    error,
    refetch,
  } = useNotifications(listFn, { autoFetch: canList });

  // Unread badge — a tiny self-scoped read (limit:1) just for the count, via the unread endpoint.
  const refreshUnreadCount = useCallback(async () => {
    if (!canList) return;
    try {
      const res = await notificationsService.listUnread({ page: 1, limit: 1 });
      setUnreadCount(Number(res?.data?.total) || 0);
    } catch {
      // a failed badge read is non-fatal; leave the previous count
    }
  }, [canList]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount, page]);

  // Mark ALL the caller's unread notifications read (the single bulk action), then refresh.
  async function handleMarkAllRead() {
    const res = await runNotificationsMutation(() => notificationsService.markRead(), {
      loading: "جارٍ تعليم الإشعارات كمقروءة...",
      setLoading: setMarking,
    });
    if (res) {
      // optimistic local sweep so the list updates instantly, then reconcile with the server
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      refetch();
    }
  }

  // Row click: mark THIS row read optimistically (no per-item endpoint exists), then navigate.
  function handleActivate(notification) {
    if (!notification?.isRead) {
      setItems((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    const link = notification?.link;
    if (link) {
      if (/^https?:\/\//i.test(link)) {
        window.open(link, "_blank", "noopener,noreferrer");
      } else {
        router.push(link);
      }
    }
  }

  function handleRefresh() {
    refetch();
    refreshUnreadCount();
  }

  if (!canList) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="text.secondary">لا تملك صلاحية عرض الإشعارات</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1.5}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <Typography variant="h5">الإشعارات</Typography>
          </Badge>
        </Stack>

        <Stack direction="row" alignItems="center" gap={1}>
          {canMarkRead && (
            <Button
              variant="outlined"
              startIcon={<MdDoneAll />}
              onClick={handleMarkAllRead}
              disabled={marking || unreadCount === 0}
            >
              تحديد الكل كمقروء
            </Button>
          )}
          <Tooltip title="تحديث">
            <span>
              <IconButton onClick={handleRefresh} disabled={isLoading}>
                <MdRefresh />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Paper variant="outlined">
        {isLoading && (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">جاري التحميل...</Typography>
          </Box>
        )}

        {!isLoading && error && (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography color="error" sx={{ mb: 1 }}>
              تعذّر جلب الإشعارات
            </Typography>
            <Button size="small" variant="text" onClick={handleRefresh}>
              إعادة المحاولة
            </Button>
          </Box>
        )}

        {!isLoading && !error && items.length === 0 && (
          <Box sx={{ p: 5, textAlign: "center", color: "text.secondary" }}>
            <MdNotificationsNone size={48} />
            <Typography sx={{ mt: 1 }}>لا توجد إشعارات</Typography>
          </Box>
        )}

        {!isLoading && !error && items.length > 0 && (
          <>
            <List disablePadding>
              {items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onActivate={handleActivate}
                />
              ))}
            </List>
            <TablePagination
              component="div"
              count={total}
              page={page - 1}
              onPageChange={(_e, p) => setPage(p + 1)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(1);
              }}
              rowsPerPageOptions={[9, 25, 50]}
              labelRowsPerPage="عدد الصفوف"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
            />
          </>
        )}
      </Paper>
    </Container>
  );
}

export default NotificationsPage;

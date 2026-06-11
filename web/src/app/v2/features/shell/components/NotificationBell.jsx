"use client";

// <NotificationBell /> — TopBar bell with a live unread COUNT, wired to the notifications
// service (the single data-access layer; never fetch/apiFetch directly). Gated on
// notification.list — renders nothing if the user can't list notifications. Phase 0 wires the
// count + a link to the notifications page; the rich dropdown panel lands with the
// Notifications feature (Phase 1). Single-language Arabic / RTL.

import { useEffect, useState, useCallback } from "react";
import { IconButton, Badge, Tooltip } from "@mui/material";
import NextLink from "next/link";
import { MdNotifications } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { notificationsService } from "@/app/v2/features/notifications/notifications.service";

// Poll interval for the unread badge (ms). Conservative — the socket layer can supersede later.
const POLL_MS = 60_000;

export function NotificationBell() {
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.NOTIFICATION.LIST);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await notificationsService.listUnread({ page: 1, limit: 1 });
      // list shape: { items, total, page, pageSize } (§5c). `total` is the unread count.
      const total = res?.data?.total ?? res?.data?.items?.length ?? 0;
      setUnread(Number(total) || 0);
    } catch {
      // Soft-fail: a transient error must not break the shell — keep the last known count.
    }
  }, []);

  useEffect(() => {
    if (!canList) return undefined;
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [canList, refresh]);

  if (!canList) return null;

  return (
    <Tooltip title="الإشعارات">
      <IconButton component={NextLink} href="/v2/notifications" size="large" aria-label="الإشعارات">
        <Badge badgeContent={unread} color="error" max={99}>
          <MdNotifications />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}

export default NotificationBell;

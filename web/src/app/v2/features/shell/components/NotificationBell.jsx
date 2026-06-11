"use client";

// <NotificationBell /> — TopBar bell with a live unread COUNT plus an inline dropdown. Clicking
// the bell opens a MUI <Popover> anchored to it and LAZILY fetches the latest ~6 notifications
// (no navigation). Each row renders the notification content safely (it may be HTML) and links to
// its source on click; a footer button routes to the full notifications page. All data goes
// through the notifications service (the single data-access layer; never fetch/apiFetch directly).
// Gated on notification.list — renders nothing if the user can't list notifications.
// Single-language Arabic / RTL.

import { useEffect, useState, useCallback, useRef } from "react";
import {
  IconButton,
  Badge,
  Tooltip,
  Popover,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Button,
  Divider,
  CircularProgress,
} from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { MdNotifications } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useLoading } from "@/app/v2/hooks/useLoading";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { notificationsService } from "@/app/v2/features/notifications/notifications.service";
import {
  notificationTargetHref,
  normalizeToRelativePath,
} from "@/app/v2/features/notifications/config/notificationTarget";

// Poll interval for the unread badge (ms). Conservative — the socket layer can supersede later.
const POLL_MS = 60_000;
// How many rows the inline dropdown shows.
const PANEL_LIMIT = 6;

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

export function NotificationBell() {
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.NOTIFICATION.LIST);
  const [unread, setUnread] = useState(0);

  const [anchorEl, setAnchorEl] = useState(null);
  const [items, setItems] = useState([]);
  const { isLoading, startLoading, stopLoading } = useLoading(false);
  const loadedRef = useRef(false);

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

  // Lazy: only fetch the panel list when the popover is opened (first open or on each open to
  // keep it fresh — kept cheap with a small limit).
  const loadPanel = useCallback(async () => {
    startLoading();
    try {
      const res = await notificationsService.list({ page: 1, limit: PANEL_LIMIT });
      const list = res?.data?.items ?? [];
      setItems(Array.isArray(list) ? list : []);
      loadedRef.current = true;
    } catch {
      if (!loadedRef.current) setItems([]);
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  const openPanel = useCallback(
    (e) => {
      setAnchorEl(e.currentTarget);
      loadPanel();
    },
    [loadPanel],
  );
  const closePanel = useCallback(() => setAnchorEl(null), []);

  if (!canList) return null;

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="الإشعارات">
        <IconButton
          onClick={openPanel}
          size="large"
          aria-label="الإشعارات"
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
        >
          <Badge badgeContent={unread} color="error" max={99}>
            <MdNotifications />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={closePanel}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { dir: "rtl", sx: { width: 360, maxWidth: "90vw" } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: "start" }}>
            الإشعارات
          </Typography>
        </Box>
        <Divider />

        <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : items.length === 0 ? (
            <Box sx={{ px: 2, py: 4 }}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                لا توجد إشعارات
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {items.map((n) => (
                <NotificationRow key={n.id} notification={n} onNavigate={closePanel} />
              ))}
            </List>
          )}
        </Box>

        <Divider />
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            component={NextLink}
            href="/v2/notifications"
            onClick={closePanel}
            sx={{ fontWeight: 600 }}
          >
            عرض كل الإشعارات
          </Button>
        </Box>
      </Popover>
    </>
  );
}

// One dropdown row. Content may be HTML (contentType === "HTML" or contains "<") — render it
// safely via a div; otherwise render plain text. The WHOLE row is a link to the notification's
// target: we derive ONE relative path (prefer notification.link; else the first <a href> inside
// the HTML), so absolute legacy URLs (http://localhost:3000/dashboard/deals/48) navigate via
// Next to /dashboard/deals/48 → the redirect shell forwards to /v2/leads/48. Inner HTML anchors
// would otherwise do a dead/hard nav, so we intercept their clicks and route through Next too.
function NotificationRow({ notification, onNavigate }) {
  const router = useRouter();
  const content = notification?.content ?? "";
  const isHtml = notification?.contentType === "HTML" || /</.test(content);
  const targetHref = notificationTargetHref(notification);

  const primary = isHtml ? (
    <Typography
      component="div"
      variant="body2"
      sx={{ textAlign: "start", "& a": { color: "primary.main" } }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  ) : (
    <Typography component="div" variant="body2" sx={{ textAlign: "start" }}>
      {content || "إشعار"}
    </Typography>
  );

  // Clicks on an inner <a> inside the HTML content must not do a raw browser navigation (it's
  // swallowed by the button / blocked). Intercept them, normalize the anchor's href to a
  // relative path, close the panel, and push via the Next router.
  const handleClick = (e) => {
    const anchor = e.target?.closest?.("a");
    if (anchor && anchor.getAttribute("href")) {
      const rel = normalizeToRelativePath(anchor.getAttribute("href"));
      if (rel) {
        e.preventDefault();
        e.stopPropagation();
        onNavigate?.();
        router.push(rel);
        return;
      }
    }
    // Plain row click — the outer NextLink (when present) handles navigation; just close.
    if (targetHref) onNavigate?.();
  };

  const interactive = Boolean(targetHref);
  return (
    <ListItemButton
      onClick={handleClick}
      {...(interactive
        ? { component: NextLink, href: targetHref, scroll: false }
        : { disableRipple: true })}
      sx={{ alignItems: "flex-start", py: 1 }}
    >
      <ListItemText
        primary={primary}
        secondary={formatWhen(notification?.createdAt)}
        primaryTypographyProps={{ component: "div" }}
        secondaryTypographyProps={{ sx: { textAlign: "start" } }}
      />
    </ListItemButton>
  );
}

export default NotificationBell;

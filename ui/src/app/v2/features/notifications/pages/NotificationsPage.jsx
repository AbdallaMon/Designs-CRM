"use client";

// Notifications FOUNDATION page — a wiring smoke-screen, NOT the redesigned notifications UI.
// It proves the v2 data layer is wired end-to-end for this feature: permission-gated on
// notification.list, it fetches the self-scoped paginated list through useNotifications →
// the notifications.service (the SOLE API caller, pointed at /v2/notifications) and renders the
// §5c-normalized { items, total, page, pageSize } shape. A "mark all read" button proves the
// self-scoped action wiring (POST /actions/mark-read, no userId), gated on notification.mark_read
// and routed through runNotificationsMutation (CODE→Arabic toast). The real notifications UI is
// built later in the UX-redesign phase on top of this exact data layer. Single-language Arabic/RTL.

import { useCallback, useState } from "react";
import {
  Box,
  Button,
  Container,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { notificationsService } from "../notifications.service.js";
import { runNotificationsMutation } from "../notifications.mutations.js";
import { useNotifications } from "../hooks/useNotifications.js";

const P = PERMISSIONS.NOTIFICATION;

export function NotificationsPage() {
  const { hasPermission } = usePermission();
  const canList = hasPermission(P.LIST);
  const canMarkRead = hasPermission(P.MARK_READ);
  const [marking, setMarking] = useState(false);

  // Primary read proves the wiring + the §5c list shape ({ items, total, page, pageSize }).
  const listFn = useCallback((params) => notificationsService.list(params), []);
  const { items, total, isLoading, error, refetch } = useNotifications(listFn, {
    autoFetch: canList,
  });

  async function handleMarkAllRead() {
    // Self-scoped action — no userId is ever sent (§5c). Toast resolves the BE CODE → Arabic.
    const res = await runNotificationsMutation(() => notificationsService.markRead(), {
      setLoading: setMarking,
    });
    if (res) refetch();
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
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">الإشعارات</Typography>
        {canMarkRead && (
          <Button variant="outlined" onClick={handleMarkAllRead} disabled={marking}>
            تعليم الكل كمقروء
          </Button>
        )}
      </Box>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        أساس البيانات جاهز — تُبنى الواجهة الكاملة في مرحلة إعادة التصميم. (الإجمالي: {total})
      </Typography>

      <Paper variant="outlined">
        {isLoading && (
          <Box sx={{ p: 2 }}>
            <Typography color="text.secondary">جاري التحميل...</Typography>
          </Box>
        )}
        {error && (
          <Box sx={{ p: 2 }}>
            <Typography color="error">تعذّر جلب الإشعارات</Typography>
          </Box>
        )}
        {!isLoading && !error && items.length === 0 && (
          <Box sx={{ p: 2 }}>
            <Typography color="text.secondary">لا توجد إشعارات</Typography>
          </Box>
        )}
        {!isLoading && !error && items.length > 0 && (
          <List disablePadding>
            {items.map((n, i) => (
              <ListItem key={n?.id ?? i} divider>
                <ListItemText
                  primary={n?.title || n?.content || `إشعار #${n?.id ?? i}`}
                  secondary={n?.createdAt}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
}

export default NotificationsPage;

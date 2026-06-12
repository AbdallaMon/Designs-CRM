"use client";

// Notifications — the redesigned full list screen (UX plan §3.2). Built ENTIRELY on the Phase 0
// shared primitives (PageHeader / SectionCard / DataTablePage / UrlTabs / StatusChip + the five
// states). Presentational only: the data spine is FIXED — reads go through useNotifications →
// notificationsService (the sole API caller, /v2/notifications) and consume the §5c-normalized
// { items, total, page, pageSize } shape; the mark-all-read action posts an EMPTY body to
// /actions/mark-read via runNotificationsMutation (CODE→Arabic toast). Single-language Arabic/RTL.
//
// Screen shape:
//   PageHeader  — H1 "الإشعارات" + role chip + ONE primary CTA "تحديد الكل كمقروء" (gated on
//                 notification.mark_read; disabled-with-reason when there's nothing to mark).
//   UrlTabs     — "الكل" / "غير المقروءة", active tab in the URL (?tab=). The tab selects which
//                 service fn the hook calls (list vs listUnread) and resets to page 1.
//   DataTablePage — config-driven rows (config/notificationsColumns.js); rows deep-link to the
//                 source record (row.link). Loading skeleton / error+retry / empty are wired in.
//   Denied      — no notification.list → a calm full-screen PartialPermissionState (never a 403).

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Box, Button, Container } from "@mui/material";
import { MdDoneAll } from "react-icons/md";

import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useT } from "@/app/v2/lib/i18n";
import {
  PageHeader,
  SectionCard,
  DataTablePage,
  UrlTabs,
  PartialPermissionState,
} from "@/app/v2/shared/components";

import { notificationsService } from "../notifications.service.js";
import { runNotificationsMutation } from "../notifications.mutations.js";
import { useNotifications } from "../hooks/useNotifications.js";
import { notificationsMessages } from "../config/notificationsMessages.js";
import { buildNotificationsColumns } from "../config/notificationsColumns.js";

const P = PERMISSIONS.NOTIFICATION;

const TAB_ALL = "all";
const TAB_UNREAD = "unread";

export function NotificationsPage() {
  const { hasPermission } = usePermission();
  const { t } = useT();
  const canList = hasPermission(P.LIST);
  const canMarkRead = hasPermission(P.MARK_READ);

  const router = useRouter();
  const sp = useSearchParams();
  const activeTab = sp.get("tab") === TAB_UNREAD ? TAB_UNREAD : TAB_ALL;

  const [marking, setMarking] = useState(false);

  // The active tab picks the service fn — "الكل" → list, "غير المقروءة" → listUnread. Both
  // return the same §5c { items, total, page, pageSize } shape (the hook normalizes).
  const listFn = useCallback(
    (params) =>
      activeTab === TAB_UNREAD
        ? notificationsService.listUnread(params)
        : notificationsService.list(params),
    [activeTab],
  );

  const {
    items,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    isLoading,
    error,
    refetch,
  } = useNotifications(listFn, { autoFetch: canList });

  const columns = useMemo(() => buildNotificationsColumns(t), [t]);

  const tabs = useMemo(
    () => [
      { key: TAB_ALL, label: t("notifications.tab.all") },
      { key: TAB_UNREAD, label: t("notifications.tab.unread") },
    ],
    [t],
  );

  // Switching tab resets to page 1; UrlTabs already syncs ?tab= in the URL.
  const handleTabChange = useCallback(() => setPage(1), [setPage]);

  // Row click → deep-link to the source record (row.link). DataTablePage drives navigation
  // through onRowClick; rows without a link are not navigable.
  const handleRowClick = useCallback(
    (row) => {
      if (row?.link) router.push(row.link);
    },
    [router],
  );

  async function handleMarkAllRead() {
    // Self-scoped action — no userId is ever sent (§5c). The runner toasts the resolved CODE.
    const res = await runNotificationsMutation(() => notificationsService.markRead(), {
      setLoading: setMarking,
    });
    if (res) {
      setPage(1);
      refetch();
    }
  }

  // No list permission → a calm, full-screen explanation (never a bare 403 / redirect).
  if (!canList) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <PartialPermissionState
          denied
          title={t("notifications.denied.title")}
          message={t("notifications.denied.message")}
        />
      </Container>
    );
  }

  // "تحديد الكل كمقروء" — shown only with notification.mark_read; disabled (with a reason) when
  // there's nothing to mark so the CTA never dead-ends silently.
  const noneToMark = !isLoading && !error && items.length === 0;
  const primaryAction = canMarkRead
    ? {
        label: t("notifications.markAllRead"),
        icon: <MdDoneAll />,
        onClick: handleMarkAllRead,
        disabled: marking || noneToMark,
        reason: noneToMark ? t("notifications.markAllRead.noneReason") : undefined,
      }
    : undefined;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title={t("notifications.title")}
        subtitle={t("notifications.subtitle")}
        breadcrumbs={[
          { label: t("notifications.breadcrumbs.home"), href: "/v2/dashboard" },
          { label: t("notifications.breadcrumbs.notifications") },
        ]}
        primaryAction={primaryAction}
      />

      <SectionCard noPadding>
        <Box sx={{ px: 2.5, pt: 1.5 }}>
          <UrlTabs tabs={tabs} param="tab" activeKey={activeTab} onChange={handleTabChange} />
        </Box>
        <Box sx={{ p: 2.5, pt: 1 }}>
          <DataTablePage
            columns={columns}
            rows={items}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            loading={isLoading}
            error={error}
            onRetry={refetch}
            errorResolver={notificationsMessages}
            onRowClick={handleRowClick}
            rowsPerPageOptions={[9, 25, 50]}
            empty={{
              title: t("notifications.empty.title"),
              description:
                activeTab === TAB_UNREAD
                  ? t("notifications.empty.unread")
                  : t("notifications.empty.all"),
            }}
          />
        </Box>
      </SectionCard>
    </Container>
  );
}

export default NotificationsPage;

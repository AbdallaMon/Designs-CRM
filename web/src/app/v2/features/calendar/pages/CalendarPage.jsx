"use client";

// Authed staff calendar surface — the single permission-gated screen that replaces the legacy
// @admin/@staff/@super_sales calendar role-slots. The active tab lives in the URL (`?tab=`) so
// back/forward + deep links work; the tab set is filtered by the user's calendar.* permission
// codes. Behavior + appearance preserved from the legacy AdminCalendar/StaffCalendar, single-
// language Arabic/RTL.
//
// Tabs (all require calendar.view to view):
//   • ownBooking   — manage your own availability                       (write gated on calendar.manage)
//   • adminBooking — pick an admin + manage their availability          (write gated on calendar.manage)
//   • meetings     — meeting/call month-view (read-only)
// Google card (above the tabs) requires calendar.google.view; connect/disconnect on calendar.google.manage.

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Container, Tab, Tabs, Typography } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useT } from "@/app/v2/lib/i18n";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { CALENDAR_TAB_LABEL_KEYS, resolveBrowserTimezone } from "../config/calendarConstants.js";
import AdminBookingPanel from "../components/AdminBookingPanel.jsx";
import StaffAdminSelector from "../components/StaffAdminSelector.jsx";
import MeetingsMonthView from "../components/MeetingsMonthView.jsx";
import GoogleConnectCard from "../components/GoogleConnectCard.jsx";

const P = PERMISSIONS.CALENDAR;

export function CalendarPage() {
  const { hasPermission } = usePermission();
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const canView = hasPermission(P.VIEW);
  const canManage = hasPermission(P.MANAGE);
  const canViewGoogle = hasPermission(P.GOOGLE_VIEW);
  const canManageGoogle = hasPermission(P.GOOGLE_MANAGE);

  const tz = resolveBrowserTimezone();

  // Tab set (all gated on calendar.view). Order preserved from the legacy screens.
  const tabs = useMemo(() => {
    if (!canView) return [];
    return ["ownBooking", "adminBooking", "meetings"];
  }, [canView]);

  const requested = sp.get("tab");
  const active = tabs.includes(requested) ? requested : tabs[0];

  function selectTab(key) {
    const params = new URLSearchParams(sp.toString());
    params.set("tab", key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  if (!canView) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="text.secondary">{t("calendar.noAccess", "لا تملك صلاحية الوصول إلى التقويم")}</Typography>
      </Box>
    );
  }

  function renderActive() {
    switch (active) {
      case "ownBooking":
        return <AdminBookingPanel type="ADMIN" timezone={tz} canManage={canManage} title={t("calendar.ownBookingTitle", "تقويم الحجوزات الخاص بك")} />;
      case "adminBooking":
        return <StaffAdminSelector timezone={tz} canManage={canManage} />;
      case "meetings":
        return <MeetingsMonthView timezone={tz} canSelfFilter={canManage} />;
      default:
        return null;
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t("calendar.title", "التقويم")}
      </Typography>

      {canViewGoogle && <GoogleConnectCard canManageGoogle={canManageGoogle} />}

      <Tabs
        value={active}
        onChange={(_e, v) => selectTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        {tabs.map((key) => (
          <Tab key={key} value={key} label={t(CALENDAR_TAB_LABEL_KEYS[key])} />
        ))}
      </Tabs>

      <Box>{renderActive()}</Box>
    </Container>
  );
}

export default CalendarPage;

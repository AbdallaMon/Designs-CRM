"use client";

// Utilities admin page — a real, tabbed admin surface for the studio's cross-cutting helper
// data. Tab state lives in the URL (?tab=) for back/forward + deep-link parity (mirrors
// features/siteUtility/pages/SiteUtilityPage.jsx). Each tab is permission-gated and only
// rendered in the tab strip if the caller can access it, so the visible tab set matches the
// caller's permissions. Per-action gating lives inside each tab component.
//
// Tabs (and the BE requirePermissions codes that gate them):
//   • البيانات الثابتة (Fixed Data) — CRUD. List: UTILITY.FIXED_DATA_LIST; writes:
//       ADMIN_RESIDUAL.FIXED_DATA_MANAGE (the writes are a separate admin-residual module).
//   • سجل العمل (User Logs) — self work-log check + submit. UTILITY.USER_LOG_VIEW /
//       USER_LOG_SUBMIT (the utilities surface is self-scoped; not an admin viewer).
//   • الأدوار (Roles) — read-only list of the caller's roles. UTILITY.USER_ROLE_VIEW.
//
// Single-language Arabic RTL.

import { useCallback, useMemo } from "react";
import { Box, Container, Tab, Tabs, Typography } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import FixedDataManager from "../components/FixedDataManager.jsx";
import UserLogTab from "../components/UserLogTab.jsx";
import RolesTab from "../components/RolesTab.jsx";

const P = PERMISSIONS.UTILITY;

export function UtilitiesPage() {
  const { hasPermission, hasAnyPermission } = usePermission();

  // Build the visible tab set from permissions. A tab appears only if the caller can access
  // it; `show` is evaluated against the auth user's effective permissions.
  const tabs = useMemo(() => {
    const all = [
      {
        key: "fixed-data",
        label: "البيانات الثابتة",
        show: hasPermission(P.FIXED_DATA_LIST),
        render: () => <FixedDataManager />,
      },
      {
        key: "user-logs",
        label: "سجل العمل",
        show: hasAnyPermission([P.USER_LOG_VIEW, P.USER_LOG_SUBMIT]),
        render: () => <UserLogTab />,
      },
      {
        key: "roles",
        label: "الأدوار",
        show: hasPermission(P.USER_ROLE_VIEW),
        render: () => <RolesTab />,
      },
    ];
    return all.filter((t) => t.show);
  }, [hasPermission, hasAnyPermission]);

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const active = useMemo(() => {
    const t = sp.get("tab");
    if (tabs.some((x) => x.key === t)) return t;
    return tabs[0]?.key ?? null;
  }, [sp, tabs]);

  const onChange = useCallback(
    (_e, key) => {
      const params = new URLSearchParams(sp.toString());
      params.set("tab", key);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, sp],
  );

  if (tabs.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <Typography color="textSecondary">
          لا تملك صلاحية الوصول إلى الأدوات المساعدة
        </Typography>
      </Box>
    );
  }

  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        الأدوات المساعدة
      </Typography>

      <Tabs
        value={activeTab.key}
        onChange={onChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 1, borderBottom: 1, borderColor: "divider" }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.key} value={tab.key} label={tab.label} />
        ))}
      </Tabs>

      {tabs.map((tab) => (
        <Box key={tab.key} hidden={tab.key !== activeTab.key} role="tabpanel">
          {tab.key === activeTab.key && tab.render()}
        </Box>
      ))}
    </Container>
  );
}

export default UtilitiesPage;

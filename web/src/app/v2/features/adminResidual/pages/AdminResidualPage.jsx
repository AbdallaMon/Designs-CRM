"use client";

// admin-residual — قسم الإدارة. A tabbed admin screen over the SAFE, high-value residual
// surfaces of /v2/admin/*: Reports (🔒 frozen lead/staff report generators — we only call +
// download), Commissions (per-user list + manage), and Archive/Restore (per-id toggle over the
// allow-listed image-session reference models). Tab state lives in the URL (?tab=); the tab set
// is permission-gated per the backend's requirePermissions (usePermission). Deliberately OMITTED
// here: Fixed-Data CRUD (owned by the utilities feature), lead/client mutation workflows (owned
// by the leads feature), and Telegram (sensitive — no write UI). Single-language Arabic, RTL.

import { useMemo } from "react";
import {
  Box,
  Container,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import ReportsTab from "../components/ReportsTab.jsx";
import CommissionsTab from "../components/CommissionsTab.jsx";
import ArchiveRestoreTab from "../components/ArchiveRestoreTab.jsx";

const P = PERMISSIONS.ADMIN_RESIDUAL;

export function AdminResidualPage() {
  const { hasPermission } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Permission-gated tab set — each tab maps 1:1 to its backend permission code.
  const tabs = useMemo(() => {
    const list = [];
    if (hasPermission(P.REPORT_GENERATE)) list.push({ key: "reports", label: "التقارير" });
    if (hasPermission(P.COMMISSION_VIEW)) list.push({ key: "commissions", label: "العمولات" });
    if (hasPermission(P.MODEL_ARCHIVE)) list.push({ key: "archive", label: "الأرشيف" });
    return list;
  }, [hasPermission]);

  const canManageCommissions = hasPermission(P.COMMISSION_MANAGE);

  const requested = searchParams.get("tab");
  const active = tabs.some((t) => t.key === requested) ? requested : tabs[0]?.key;

  function goToTab(key) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  if (tabs.length === 0) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="text.secondary">لا تملك صلاحية الوصول إلى قسم الإدارة</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        قسم الإدارة
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        التقارير والعمولات وإدارة الأرشيف.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={active}
          onChange={(_e, key) => goToTab(key)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>
      </Box>

      {/* Lazy: only the active tab's component mounts (and only it fetches). */}
      {active === "reports" && <ReportsTab />}
      {active === "commissions" && <CommissionsTab canManage={canManageCommissions} />}
      {active === "archive" && <ArchiveRestoreTab />}
    </Container>
  );
}

export default AdminResidualPage;

"use client";

// Utilities REDESIGNED screen (UX plan §3.9) — the cross-cutting helper surfaces presented as
// permission-gated URL tabs (بحث / سجل اليوم / البيانات الثابتة) on the Phase-0 primitives:
// PageHeader + UrlTabs + SectionCard + the five state components. The model/pick-list readers
// (getModel/getModelIds/readModelLabel) stay exported helpers for OTHER features — no screen.
//
// Gating: every tab is filtered by the SAME usePermission predicate that gates its content, so
// the tab strip never offers a 403 surface. If the user holds NO utility.* surface code, a calm
// "denied" state shows instead of a crash. Single-language Arabic / RTL.

import { useMemo } from "react";
import { Box, Container } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import {
  PageHeader,
  UrlTabs,
  PartialPermissionState,
} from "@/app/v2/shared/components";
import { UTILITIES_TABS, UTILITIES_TAB_DEFS } from "../config/utilitiesSurfaces.js";
import { GlobalSearchPanel } from "../components/GlobalSearchPanel.jsx";
import { UserLogForm } from "../components/UserLogForm.jsx";
import { FixedDataList } from "../components/FixedDataList.jsx";

const P = PERMISSIONS.UTILITY;

export function UtilitiesPage() {
  const { hasPermission } = usePermission();

  const canSubmitLog = hasPermission(P.USER_LOG_SUBMIT);

  // Filter the tab set by the surface gate (same predicate that gates the panel content).
  const tabs = useMemo(
    () =>
      UTILITIES_TAB_DEFS.filter((t) => hasPermission(t.permission)).map((t) => ({
        key: t.key,
        label: t.label,
      })),
    [hasPermission],
  );

  if (tabs.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageHeader title="الأدوات المساعدة" breadcrumbs={[{ label: "الإدارة" }, { label: "أدوات" }]} />
        <PartialPermissionState
          denied
          title="الأدوات المساعدة غير متاحة لصلاحياتك"
          message="لا تملك صلاحية الوصول إلى أيٍّ من أدوات النظام المساعدة. تواصل مع المسؤول إن كنت تظن أنه ينبغي أن تصل إليها."
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="الأدوات المساعدة"
        subtitle="بحث شامل، سجل العمل اليومي، والبيانات الثابتة."
        breadcrumbs={[{ label: "الإدارة" }, { label: "أدوات" }]}
      />

      <UrlTabs tabs={tabs} param="tab">
        {(activeKey) => (
          <Box sx={{ mt: 1 }}>
            {activeKey === UTILITIES_TABS.SEARCH && <GlobalSearchPanel />}
            {activeKey === UTILITIES_TABS.USER_LOG && <UserLogForm canSubmit={canSubmitLog} />}
            {activeKey === UTILITIES_TABS.FIXED_DATA && <FixedDataList />}
          </Box>
        )}
      </UrlTabs>
    </Container>
  );
}

export default UtilitiesPage;

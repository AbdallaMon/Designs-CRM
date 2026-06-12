"use client";

import { useCallback, useMemo } from "react";
import { Box, Container, Tab, Tabs, Typography } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/app/v2/lib/i18n";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { UploadingProvider } from "@/app/v2/providers/UploadingProvider";
import PdfUtility from "../components/PdfUtility.jsx";
import ContractPaymentConditions from "../components/ContractPaymentConditions.jsx";
import ContractUtility from "../components/ContractUtility.jsx";

/**
 * Site-utility admin page. Two tabs (PDF utility + contract payment conditions) migrated
 * from the legacy SiteUtilityManager. Tab state lives in the URL (?tab=) for back/forward
 * + deep-link parity. Access is gated on SITE_UTILITY.PDF_CONFIG_VIEW; per-action gating lives in the
 * child components. Wrapped in UploadingProvider for the PDF field-card chunked upload
 * overlay. Single-language Arabic RTL.
 *
 * The "إعدادات عقد التصميم" (Contract utility) tab restores the legacy contract-boilerplate
 * editor (obligations + stage/special/level clause templates), now backed by the v2
 * /v2/site-utilities/contract-utility module. The tab is gated on
 * SITE_UTILITY.CONTRACT_UTILITY_VIEW; per-action gating lives in the child component.
 */
const TABS = [
  { key: "pdf", labelKey: "siteUtility.tab.pdf", view: PERMISSIONS.SITE_UTILITY.PDF_CONFIG_VIEW },
  {
    key: "conditions",
    labelKey: "siteUtility.tab.conditions",
    view: PERMISSIONS.SITE_UTILITY.PAYMENT_CONDITION_LIST,
  },
  {
    key: "contract",
    labelKey: "siteUtility.tab.contract",
    view: PERMISSIONS.SITE_UTILITY.CONTRACT_UTILITY_VIEW,
  },
];

export function SiteUtilityPage() {
  const { t } = useT();
  const { hasPermission } = usePermission();
  // The page is reachable with any one of the site-utility view codes; each tab is
  // individually gated below so a user only sees the surfaces they can read.
  const visibleTabs = useMemo(
    () => TABS.filter((t) => hasPermission(t.view)),
    [hasPermission],
  );
  const canView = visibleTabs.length > 0;

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const active = useMemo(() => {
    const t = sp.get("tab");
    return visibleTabs.some((x) => x.key === t)
      ? t
      : (visibleTabs[0]?.key ?? TABS[0].key);
  }, [sp, visibleTabs]);

  const onChange = useCallback(
    (_e, key) => {
      const params = new URLSearchParams(sp.toString());
      params.set("tab", key);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, sp],
  );

  if (!canView) {
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
          {t("siteUtility.page.denied")}
        </Typography>
      </Box>
    );
  }

  return (
    <UploadingProvider>
      <Container maxWidth="xl" sx={{ position: "relative", py: 4 }}>
        <Tabs value={active} onChange={onChange} centered>
          {visibleTabs.map((tab) => (
            <Tab key={tab.key} value={tab.key} label={t(tab.labelKey)} />
          ))}
        </Tabs>

        <Box hidden={active !== "pdf"} role="tabpanel">
          {active === "pdf" && <PdfUtility />}
        </Box>
        <Box hidden={active !== "conditions"} role="tabpanel">
          {active === "conditions" && <ContractPaymentConditions />}
        </Box>
        <Box hidden={active !== "contract"} role="tabpanel">
          {active === "contract" && <ContractUtility />}
        </Box>
      </Container>
    </UploadingProvider>
  );
}

export default SiteUtilityPage;

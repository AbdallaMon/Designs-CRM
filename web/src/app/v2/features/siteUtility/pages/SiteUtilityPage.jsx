"use client";

import { useCallback, useMemo } from "react";
import { Box, Container, Tab, Tabs, Typography } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { UploadingProvider } from "@/app/v2/providers/UploadingProvider";
import PdfUtility from "../components/PdfUtility.jsx";
import ContractPaymentConditions from "../components/ContractPaymentConditions.jsx";

/**
 * Site-utility admin page. Two tabs (PDF utility + contract payment conditions) migrated
 * from the legacy SiteUtilityManager. Tab state lives in the URL (?tab=) for back/forward
 * + deep-link parity. Access is gated on SITE_UTILITY.PDF_CONFIG_VIEW; per-action gating lives in the
 * child components. Wrapped in UploadingProvider for the PDF field-card chunked upload
 * overlay. Single-language Arabic RTL.
 *
 * Note: the legacy manager had a third "Contract utility" tab sourced from a separate,
 * unrelated feature (contracts/ContractUtilityPage) — out of scope for the site-utility
 * module migration and intentionally not included here.
 */
const TABS = [
  { key: "pdf", label: "إعدادات الـ PDF" },
  { key: "conditions", label: "شروط دفع العقود" },
];

export function SiteUtilityPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.SITE_UTILITY.PDF_CONFIG_VIEW);

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const active = useMemo(() => {
    const t = sp.get("tab");
    return TABS.some((x) => x.key === t) ? t : TABS[0].key;
  }, [sp]);

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
          لا تملك صلاحية الوصول إلى هذه الصفحة
        </Typography>
      </Box>
    );
  }

  return (
    <UploadingProvider>
      <Container maxWidth="xl" sx={{ position: "relative", py: 4 }}>
        <Tabs value={active} onChange={onChange} centered>
          {TABS.map((tab) => (
            <Tab key={tab.key} value={tab.key} label={tab.label} />
          ))}
        </Tabs>

        <Box hidden={active !== "pdf"} role="tabpanel">
          {active === "pdf" && <PdfUtility />}
        </Box>
        <Box hidden={active !== "conditions"} role="tabpanel">
          {active === "conditions" && <ContractPaymentConditions />}
        </Box>
      </Container>
    </UploadingProvider>
  );
}

export default SiteUtilityPage;

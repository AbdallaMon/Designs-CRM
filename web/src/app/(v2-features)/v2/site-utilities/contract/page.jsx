import { Suspense } from "react";
import { Container } from "@mui/material";
import { ContractUtility } from "@/app/v2/features/siteUtility";

// Deep-link route for the contract-utility editor (the legacy "إعدادات عقد التصميم"
// screen). The same editor also lives as a tab on /v2/site-utilities?tab=contract;
// this standalone shell gives it a stable URL. Gating lives in the component
// (SITE_UTILITY.CONTRACT_UTILITY_VIEW / _EDIT).
export default function Page() {
  return (
    <Suspense>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <ContractUtility />
      </Container>
    </Suspense>
  );
}

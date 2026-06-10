import { Suspense } from "react";
import { ContractPaymentsPage } from "@/app/v2/features/contracts";

// STATIC `payments` segment — shadows the sibling dynamic `contracts/[leadId]/page.jsx` for
// the literal /v2/contracts/payments path (Next.js prioritizes a static segment over a dynamic
// one). The dynamic per-lead route still resolves for real lead ids. Gated upstream by the nav
// permission CONTRACT.PAYMENT_LIST; the page itself re-checks the codes.
export default function Page() {
  return (
    <Suspense>
      <ContractPaymentsPage />
    </Suspense>
  );
}

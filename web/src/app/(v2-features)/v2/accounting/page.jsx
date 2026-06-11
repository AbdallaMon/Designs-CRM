import { Suspense } from "react";
import { AccountingPage } from "@/app/v2/features/accounting";

export default function Page() {
  return (
    <Suspense>
      <AccountingPage />
    </Suspense>
  );
}

import { Suspense } from "react";
import { PublicContractSignPage } from "@/app/v2/features/contracts";

export default function Page() {
  return (
    <Suspense>
      <PublicContractSignPage />
    </Suspense>
  );
}

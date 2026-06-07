import { Suspense } from "react";
import { LeadsPage } from "@/app/v2/features/leads";

export default function Page() {
  return (
    <Suspense>
      <LeadsPage />
    </Suspense>
  );
}

import { Suspense } from "react";
import { SiteUtilityPage } from "@/app/v2/features/siteUtility";

export default function Page() {
  return (
    <Suspense>
      <SiteUtilityPage />
    </Suspense>
  );
}

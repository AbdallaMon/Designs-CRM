import { Suspense } from "react";
import { DashboardPage } from "@/app/v2/features/dashboard";

export default function Page() {
  return (
    <Suspense>
      <DashboardPage />
    </Suspense>
  );
}

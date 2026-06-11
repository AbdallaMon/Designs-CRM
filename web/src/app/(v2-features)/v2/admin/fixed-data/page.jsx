import { Suspense } from "react";
import { AdminResidualPage } from "@/app/v2/features/adminResidual";

export default function Page() {
  return (
    <Suspense>
      <AdminResidualPage surface="fixed-data" />
    </Suspense>
  );
}

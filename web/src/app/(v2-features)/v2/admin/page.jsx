import { Suspense } from "react";
import { AdminResidualPage } from "@/app/v2/features/adminResidual";

// /v2/admin → defaults to the first admin surface (projects). AdminShell self-corrects to the
// first surface the user is actually allowed to see.
export default function Page() {
  return (
    <Suspense>
      <AdminResidualPage surface="projects" />
    </Suspense>
  );
}

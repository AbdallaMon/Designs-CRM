import { Suspense } from "react";
import { AdminReferenceDataPage } from "@/app/v2/features/imageSessions";

// SURFACE 1 — ADMIN reference-data CRUD (AUTHED; gate = IMAGE_SESSION.ADMIN_*).
export default function Page() {
  return (
    <Suspense>
      <AdminReferenceDataPage />
    </Suspense>
  );
}

import { Suspense } from "react";
import { PublicImageSessionPage } from "@/app/v2/features/imageSessions";

// SURFACE 3 — PUBLIC client image-selection (UNGATED; the per-session token IS the auth).
export default function Page() {
  return (
    <Suspense>
      <PublicImageSessionPage />
    </Suspense>
  );
}

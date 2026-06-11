import { Suspense } from "react";
import { LeadSessionsPage } from "@/app/v2/features/imageSessions";

// SURFACE 2 — SHARED lead-scoped session management (AUTHED; gate = IMAGE_SESSION.SESSION_*).
// Next 16: params is async.
export default async function Page({ params }) {
  const { leadId } = await params;
  return (
    <Suspense>
      <LeadSessionsPage clientLeadId={leadId} />
    </Suspense>
  );
}

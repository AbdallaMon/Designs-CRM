import { Suspense } from "react";
import { LeadContractsPage } from "@/app/v2/features/contracts";

// Per-lead authed contract management. Next 16: params is async.
export default async function Page({ params }) {
  const { leadId } = await params;
  return (
    <Suspense>
      <LeadContractsPage leadId={leadId} />
    </Suspense>
  );
}

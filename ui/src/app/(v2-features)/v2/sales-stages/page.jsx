// v2 sales-stages route shell (foundation). Sales stages are LEAD-SCOPED, so this thin panel
// reads the lead from `?leadId=` (Next 16: searchParams is async) and hands it to the client
// panel, which fetches that lead's sales stages via the v2 data layer, permission-gated. This
// proves the wiring; the full pipeline UI lands in the UX-redesign phase.
import { Suspense } from "react";
import { SalesStagesPanel } from "@/app/v2/features/salesStages";

export default async function Page({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const leadId = sp.leadId;
  return (
    <Suspense>
      <SalesStagesPanel leadId={leadId} />
    </Suspense>
  );
}

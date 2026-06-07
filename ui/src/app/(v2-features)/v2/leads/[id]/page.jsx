import { Suspense } from "react";
import { LeadDetailsPage } from "@/app/v2/features/leadsDetails";

// Next 16: params is async.
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <Suspense>
      <LeadDetailsPage leadId={id} />
    </Suspense>
  );
}

import { Suspense } from "react";
import { ContractDetailPage } from "@/app/v2/features/contracts";

// Standalone authed contract detail (stages / payments / drawings / special-items panels +
// lifecycle actions). Next 16: params is async.
export default async function Page({ params }) {
  const { contractId } = await params;
  return (
    <Suspense>
      <ContractDetailPage contractId={contractId} />
    </Suspense>
  );
}

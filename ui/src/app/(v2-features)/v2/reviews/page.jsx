// v2 reviews route shell (foundation). Studio-wide Google Business reviews integration —
// fetches locations via the v2 data layer and surfaces the OAuth-connect affordance,
// permission-gated. This proves the wiring; the full reviews UI lands in the UX-redesign phase.
import { Suspense } from "react";
import { ReviewsPanel } from "@/app/v2/features/reviews";

export default function Page() {
  return (
    <Suspense>
      <ReviewsPanel />
    </Suspense>
  );
}

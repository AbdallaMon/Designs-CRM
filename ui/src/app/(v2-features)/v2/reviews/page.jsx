// v2 reviews route shell. Studio-wide Google Business reviews integration — the redesigned
// READ-ONLY screen (UX plan §3.7): location picker → reviews cards, permission-gated on
// review.view / review.connect, with a graceful "الربط مع Google غير مُفعّل" state (the OAuth
// connect is frozen/non-functional). Single-language Arabic / RTL.
import { Suspense } from "react";
import { ReviewsScreen } from "@/app/v2/features/reviews";

export default function Page() {
  return (
    <Suspense>
      <ReviewsScreen />
    </Suspense>
  );
}

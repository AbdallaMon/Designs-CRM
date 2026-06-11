import { redirect } from "next/navigation";
import { buildForwardedQuery } from "@/app/v2/lib/forwardQuery";

// Cutover Step C — redirect shell. The legacy public booking funnel is replaced by the v2
// booking feature at /v2/booking. Forward any query params so funnel deep-links keep working.
export default async function Page({ searchParams }) {
  const qs = buildForwardedQuery(await searchParams);
  redirect(`/v2/booking${qs}`);
}

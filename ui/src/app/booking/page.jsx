import { redirect } from "next/navigation";

// Cutover Step C — redirect shell. The legacy public booking funnel is replaced by the v2
// booking feature at /v2/booking. Forward any query params so funnel deep-links keep working.
export default async function Page({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const qs = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((x) => [k, x]) : v != null ? [[k, v]] : [],
    ),
  ).toString();
  redirect(`/v2/booking${qs ? `?${qs}` : ""}`);
}

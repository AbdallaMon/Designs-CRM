import { redirect } from "next/navigation";

// Cutover Step C — redirect shell. Legacy `/dashboard` is retired in favor of the v2 shell
// at /v2/dashboard. Live backend services still emit `${OLDORIGIN}/dashboard?...` — notably
// the Google-Calendar OAuth callback (`?googleAuthSuccess=...&profileOpen=...`) — so this
// path must keep resolving. Forward all query through to the v2 dashboard.
// NOTE: the v2 dashboard does not yet surface the googleAuth* toast / auto-open profile;
// the landing is preserved, the toast wiring is a follow-up.
export default async function Page({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const qs = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((x) => [k, x]) : v != null ? [[k, v]] : [],
    ),
  ).toString();
  redirect(`/v2/dashboard${qs ? `?${qs}` : ""}`);
}

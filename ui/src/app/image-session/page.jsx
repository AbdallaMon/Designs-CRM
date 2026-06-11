import { redirect } from "next/navigation";

// Cutover Step C — redirect shell (legacy path kept alive for FROZEN-service links).
// server/services/main/image-session/imageSessionSevices.js + email/emailTemplates.js
// (FROZEN) email clients `${OLDORIGIN}/image-session?token=...`, so this path must resolve
// indefinitely. Forward all query (token, lng) to the v2 public image-selection page.
export default async function Page({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const qs = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((x) => [k, x]) : v != null ? [[k, v]] : [],
    ),
  ).toString();
  redirect(`/v2/client-image-session${qs ? `?${qs}` : ""}`);
}

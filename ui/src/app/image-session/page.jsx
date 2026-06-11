import { redirect } from "next/navigation";
import { buildForwardedQuery } from "@/app/v2/lib/forwardQuery";

// Cutover Step C — redirect shell (legacy path kept alive for FROZEN-service links).
// server/services/main/image-session/imageSessionSevices.js + email/emailTemplates.js
// (FROZEN) email clients `${OLDORIGIN}/image-session?token=...`, so this path must resolve
// indefinitely. Forward all query (token, lng) to the v2 public image-selection page.
export default async function Page({ searchParams }) {
  const qs = buildForwardedQuery(await searchParams);
  redirect(`/v2/client-image-session${qs}`);
}

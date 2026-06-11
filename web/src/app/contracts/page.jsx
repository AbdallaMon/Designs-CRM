import { redirect } from "next/navigation";
import { buildForwardedQuery } from "@/app/v2/lib/forwardQuery";

// Cutover Step C — redirect shell (legacy path kept alive for FROZEN-service links).
// server/services/main/contract/pdf-utilities.js (FROZEN) bakes
// `${OLDORIGIN}/contracts?token=...` into already-issued contract PDFs, so this path must
// resolve indefinitely. Forward all query (token, lng) to the v2 public e-sign page.
export default async function Page({ searchParams }) {
  const qs = buildForwardedQuery(await searchParams);
  redirect(`/v2/contracts-sign${qs}`);
}

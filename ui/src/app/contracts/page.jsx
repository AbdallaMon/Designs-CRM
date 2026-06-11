import { redirect } from "next/navigation";

// Cutover Step C — redirect shell (legacy path kept alive for FROZEN-service links).
// server/services/main/contract/pdf-utilities.js (FROZEN) bakes
// `${OLDORIGIN}/contracts?token=...` into already-issued contract PDFs, so this path must
// resolve indefinitely. Forward all query (token, lng) to the v2 public e-sign page.
export default async function Page({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const qs = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) =>
      Array.isArray(v) ? v.map((x) => [k, x]) : v != null ? [[k, v]] : [],
    ),
  ).toString();
  redirect(`/v2/contracts-sign${qs ? `?${qs}` : ""}`);
}

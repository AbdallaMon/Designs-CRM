"use client";
// Shared contract "session link" logic — the single source for generating and building a
// client-facing signing link. Previously these were closures inside ViewContract's
// ContractBasics; they are lifted here so BOTH the contract detail view and the contract
// card quick-action dialog hit the same `generate-pdf-token` action and build the same URL.
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

// Turn a PDF session token into the public client signing URL. Same shape as before —
// `${origin}/contracts?token=...` — do not change it (the client signing page reads it).
export function buildSessionUrl(token) {
  if (!token) return "";
  if (typeof window === "undefined") return ""; // guard SSR
  const { origin } = window.location;
  return `${origin}/contracts?token=${encodeURIComponent(token)}`;
}

export async function copyToClipboard(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.error("Clipboard error", e);
  }
}

// POST the generate-pdf-token action for one contract + language. Returns the raw response
// so callers can branch on `res.status === 200`. `setLoading` drives whichever toast/inline
// loader the caller owns (kept as a param so callers preserve their own loading UX).
export async function generateContractPdfToken({ contractId, lang, setLoading }) {
  return handleRequestSubmit(
    { lang },
    setLoading,
    `contracts/${contractId}/actions/generate-pdf-token`,
    false,
    "Generating",
    false,
    "POST"
  );
}

import { redirect } from "next/navigation";

// Cutover Step C — redirect shell. Live/frozen backend services email + Telegram staff
// `${OLDORIGIN}/dashboard/deals/{leadId}` "open lead" deep-links (pdf-utilities.js,
// email/emailTemplates.js — paths are FROZEN). A legacy "deal" is a v2 lead, so forward to
// the v2 lead detail. The v2 route is authed, so an unauthenticated click falls through to
// /login (correct).
export default async function Page({ params }) {
  const { id } = await params;
  redirect(`/v2/leads/${id}`);
}

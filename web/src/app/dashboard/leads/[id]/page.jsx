import { redirect } from "next/navigation";

// Cutover Step C — redirect shell. server/services/notification.js (FROZEN) builds in-app
// notification links from `newLeadLink` = `${OLDORIGIN}/dashboard/leads/{leadId}`
// (server/services/links.js). Those links are rendered live (router.push(row.link)) and
// embedded in emails, so this legacy path must keep resolving. A legacy lead maps 1:1 to the
// v2 lead detail. Authed route → an unauthenticated click falls through to /login (correct).
export default async function Page({ params }) {
  const { id } = await params;
  redirect(`/v2/leads/${id}`);
}

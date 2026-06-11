import { redirect } from "next/navigation";

// Cutover Step C — redirect shell. server/services/notification.js (FROZEN) builds in-app
// notification links from `userLink` = `${OLDORIGIN}/dashboard/users/{userId}`
// (server/services/links.js) — e.g. the "lead assigned to user #X" notices. Those links are
// rendered live (router.push(row.link)) and embedded in emails, so this legacy path must keep
// resolving. Forward to the v2 user detail. Authed route → unauthenticated click falls through
// to /login (correct).
export default async function Page({ params }) {
  const { id } = await params;
  redirect(`/v2/users/${id}`);
}

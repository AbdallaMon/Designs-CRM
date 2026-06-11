import { redirect } from "next/navigation";

// Cutover Step C — redirect shell. server/services/notification.js (FROZEN) builds in-app
// notification links from `taskLink` + "/" + taskId = `${OLDORIGIN}/dashboard/tasks/{taskId}`
// (server/services/links.js) — e.g. the "New Task created" / "Task updated" notices. Those
// links are rendered live (router.push(row.link)) and embedded in emails, so this legacy path
// must keep resolving. Forward to the v2 task detail. Authed route → unauthenticated click
// falls through to /login (correct).
export default async function Page({ params }) {
  const { id } = await params;
  redirect(`/v2/tasks/${id}`);
}

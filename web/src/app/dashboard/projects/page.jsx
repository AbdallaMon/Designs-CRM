import { redirect } from "next/navigation";

// Cutover Step C — redirect shell. server/services/notification.js (FROZEN) references the
// bare `projectLink` = `${OLDORIGIN}/dashboard/projects` (server/services/links.js). The
// id-bearing variant (`projectLink + "/" + projectId`) is handled by the sibling
// /dashboard/projects/[id] shell; this covers the bare base with no id. Forward to the v2
// projects list. Authed route → unauthenticated click falls through to /login (correct).
export default function Page() {
  redirect("/v2/projects");
}

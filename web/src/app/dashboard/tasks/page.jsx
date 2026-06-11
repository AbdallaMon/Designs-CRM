import { redirect } from "next/navigation";

// Cutover redirect shell. Legacy notifications (server/services/notification.js, FROZEN)
// emit a bare `/dashboard/tasks` (no id) which has no v2 route. Mirror the sibling
// /dashboard/projects bare shell and forward to the v2 tasks list. Authed route →
// unauthenticated click falls through to /login (correct).
export default function Page() {
  redirect("/v2/tasks");
}

import { redirect } from "next/navigation";

// Cutover Step C — redirect shell. server/services/main/utility/utility.js emits
// `${OLDORIGIN}/dashboard/notifications` in notification emails (path FROZEN). Forward to the
// v2 notifications page. Authed route → unauthenticated click falls through to /login.
export default function Page() {
  redirect("/v2/notifications");
}

import { redirect } from "next/navigation";

// Cutover Step C — redirect shell. server/services/main/shared/deliveryServices.js emits
// `${OLDORIGIN}/dashboard/projects/{projectId}` delivery deep-links (path FROZEN). Forward
// to the v2 project detail. Authed route → unauthenticated click falls through to /login.
export default async function Page({ params }) {
  const { id } = await params;
  redirect(`/v2/projects/${id}`);
}

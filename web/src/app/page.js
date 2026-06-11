import { redirect } from "next/navigation";

// Cutover Step A (entry flip): the app entry now points at the v2 shell. Visiting the bare
// domain root sends you into the new app via the /v2 landing fan-out — authenticated users are
// then routed on to THEIR default workspace's primary destination; unauthenticated users fall
// through the v2 AuthProvider's session check to /login.
// Reversible: the previous public marketing landing (ClientPage) lives in git history.
export default function Page() {
  redirect("/v2");
}

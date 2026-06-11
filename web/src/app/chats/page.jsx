import { redirect } from "next/navigation";
import { buildForwardedQuery } from "@/app/v2/lib/forwardQuery";

// Cutover Step C — redirect shell (legacy path kept alive for in-the-wild client links).
// Chat access links (`${origin}/chats?roomId=&token=`) were shared with clients via email /
// the share-link box, so this path must keep resolving. Forward all query (roomId, token)
// to the v2 public client-chat page.
export default async function Page({ searchParams }) {
  const qs = buildForwardedQuery(await searchParams);
  redirect(`/v2/client-chat${qs}`);
}

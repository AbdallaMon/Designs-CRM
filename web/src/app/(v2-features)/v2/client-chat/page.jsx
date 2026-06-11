import { Suspense } from "react";
import { ClientChatPage } from "@/app/v2/features/chat";

// PUBLIC client-chat surface (UNGATED; the per-room ?token= IS the auth). Replaces the
// legacy /chats public client page. Reads ?token= and ?roomId= from the query.
export default function Page() {
  return (
    <Suspense>
      <ClientChatPage />
    </Suspense>
  );
}

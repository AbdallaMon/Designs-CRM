import { Suspense } from "react";
import { ChatPage } from "@/app/v2/features/chat";

export default function Page() {
  return (
    <Suspense>
      <ChatPage />
    </Suspense>
  );
}

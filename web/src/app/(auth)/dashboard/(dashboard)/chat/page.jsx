import ChatPage from "@/features/chat/components/chat/ChatPage";
import { Suspense } from "react";

export default function page() {
  return (
    <Suspense fallback={<div>Loading Chat...</div>}>
      <ChatPage />
    </Suspense>
  );
}

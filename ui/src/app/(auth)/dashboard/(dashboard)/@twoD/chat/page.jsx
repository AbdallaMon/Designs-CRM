import ChatPage from "@/app/UiComponents/DataViewer/chat/ChatPage";
import { Suspense } from "react";

export default function page() {
  return (
    <Suspense fallback={<div>Loading Chat...</div>}>
      <ChatPage />
    </Suspense>
  );
}

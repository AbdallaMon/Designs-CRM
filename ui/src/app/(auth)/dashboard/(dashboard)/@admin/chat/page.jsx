import ChatPage from "@/app/UiComponents/DataViewer/chat/ChatPage";
import { connection } from "next/server";

export default async function page() {
  await connection();
  return (
    <Suspense fallback={<div>Loading Chat...</div>}>
      <ChatPage />;
    </Suspense>
  );
}

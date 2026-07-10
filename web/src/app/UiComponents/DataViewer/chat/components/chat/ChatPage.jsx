import React, { Suspense } from "react";
import { ChatContainer } from "@/app/UiComponents/DataViewer/chat/ChatContainer.jsx";
import SocketProvider from "@/app/providers/SocketProvider";

export default function ChatPage({ projectId = null, clientLeadId = null }) {
  return (
    <Suspense fallback={null}>
      <ChatContainer
        type="page"
        projectId={projectId}
        clientLeadId={clientLeadId}
      />
    </Suspense>
  );
}

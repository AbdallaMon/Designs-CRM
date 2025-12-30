"use client";

import React, { Suspense } from "react";
import { ChatContainer } from "../../ChatContainer";
import { usePathname } from "next/navigation";

export function ChatWidget({ projectId = null, clientLeadId = null }) {
  const pathname = usePathname();
  if (pathname === "/dashboard/chat") return null;
  return (
    <Suspense fallback={null}>
      <ChatContainer
        type="widget"
        projectId={projectId}
        clientLeadId={clientLeadId}
      />
    </Suspense>
  );
}

export default ChatWidget;

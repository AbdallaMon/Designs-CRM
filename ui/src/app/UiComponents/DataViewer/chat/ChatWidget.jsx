"use client";

import React, { useEffect } from "react";
import { ChatContainer } from "./ChatContainer";
import { usePathname } from "next/navigation";

export function ChatWidget({ projectId = null, clientLeadId = null }) {
  const pathname = usePathname();
  if (pathname === "/dashboard/chat") return;
  return (
    <ChatContainer
      type="widget"
      projectId={projectId}
      clientLeadId={clientLeadId}
    />
  );
}

export default ChatWidget;

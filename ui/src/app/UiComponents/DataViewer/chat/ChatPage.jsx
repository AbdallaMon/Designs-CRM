"use client";

import React from "react";
import { ChatContainer } from "./ChatContainer";

export default function ChatPage({ projectId = null, clientLeadId = null }) {
  return (
    <ChatContainer
      type="page"
      projectId={projectId}
      clientLeadId={clientLeadId}
    />
  );
}

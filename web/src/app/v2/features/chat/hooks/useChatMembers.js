"use client";

import { useCallback, useEffect, useState } from "react";
import chatService, { clientChatService } from "../chat.service.js";

export function useChatMembers(roomId, refetchKey, clientCtx = null) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = clientCtx?.token ?? null;

  const fetchMembers = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const res = token
        ? await clientChatService.listMembers(roomId, token)
        : await chatService.listMembers(roomId);
      const data = res?.data;
      setMembers(Array.isArray(data) ? data : (data?.items ?? []));
    } finally {
      setLoading(false);
    }
  }, [roomId, token]);

  useEffect(() => {
    if (roomId) fetchMembers();
  }, [roomId, fetchMembers, refetchKey]);

  return { members, loading, fetchMembers, setMembers };
}

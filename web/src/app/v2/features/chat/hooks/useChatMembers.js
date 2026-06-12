"use client";

import { useCallback, useEffect, useState } from "react";
import chatService from "../chat.service.js";

export function useChatMembers(roomId, refetchKey) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const res = await chatService.listMembers(roomId);
      const data = res?.data;
      setMembers(Array.isArray(data) ? data : (data?.items ?? []));
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (roomId) fetchMembers();
  }, [roomId, fetchMembers, refetchKey]);

  return { members, loading, fetchMembers, setMembers };
}

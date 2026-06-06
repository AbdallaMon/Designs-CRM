"use client";

import { useCallback, useEffect, useState } from "react";
import chatService from "../chat.service.js";

/**
 * Single-room detail. The detail response carries `capabilities.{canEdit,canDelete,
 * canManageMembers}` (shared-permissions §6) which the UI uses to gate actions.
 */
export function useChatRoom(roomId) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchChatRoom = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await chatService.getRoom(roomId);
      setRoom(res?.data ?? null);
    } catch (e) {
      setError(e?.message || "فشل تحميل المحادثة");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchChatRoom();
  }, [fetchChatRoom]);

  return { room, fetchChatRoom, loading, error };
}

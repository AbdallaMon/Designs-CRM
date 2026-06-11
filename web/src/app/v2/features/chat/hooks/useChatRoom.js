"use client";

import { useCallback, useEffect, useState } from "react";
import chatService, { clientChatService } from "../chat.service.js";

/**
 * Single-room detail. The detail response carries `capabilities.{canEdit,canDelete,
 * canManageMembers}` (shared-permissions §6) which the UI uses to gate actions.
 *
 * `clientCtx` (optional) — `{ token }` from the public client surface. When present the
 * room is read from /v2/client/chat (token-based) instead of the staff /v2/chat route.
 */
export function useChatRoom(roomId, clientCtx = null) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = clientCtx?.token ?? null;

  const fetchChatRoom = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      const res = token
        ? await clientChatService.getRoom(roomId, token)
        : await chatService.getRoom(roomId);
      setRoom(res?.data ?? null);
    } catch (e) {
      setError(e?.message || "فشل تحميل المحادثة");
    } finally {
      setLoading(false);
    }
  }, [roomId, token]);

  useEffect(() => {
    fetchChatRoom();
  }, [fetchChatRoom]);

  return { room, fetchChatRoom, loading, error };
}

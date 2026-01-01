"use client";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useEffect, useState } from "react";

export function useChatRoom(roomId, clientId) {
  const [chatRoom, setChatRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  async function fetchChatRoom() {
    if (!roomId) return;
    await getDataAndSet({
      url: clientId
        ? `client/chat/rooms/${roomId}?clientId=${clientId}&`
        : `shared/chat/rooms/${roomId}`,
      setData: setChatRoom,
      setLoading,
      setError,
    });
  }
  useEffect(() => {
    fetchChatRoom();
  }, [roomId]);
  return { room: chatRoom, fetchChatRoom, loading, error };
}

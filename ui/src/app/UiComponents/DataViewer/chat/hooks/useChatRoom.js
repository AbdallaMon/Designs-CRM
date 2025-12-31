"use client";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useEffect, useState } from "react";

export function useChatRoom(roomId) {
  const [chatRoom, setChatRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  async function fetchChatRoom() {
    if (!roomId) return;
    await getDataAndSet({
      url: `shared/chat/rooms/${roomId}`,
      setData: setChatRoom,
      setLoading,
    });
  }
  useEffect(() => {
    fetchChatRoom();
  }, [roomId]);
  return { room: chatRoom, fetchChatRoom, loading };
}

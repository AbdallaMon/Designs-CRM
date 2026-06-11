"use client";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";

export function useChatRoom(roomId, clientId) {
  const [chatRoom, setChatRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket } = useSocket();

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
  useEffect(() => {
    const interval = setInterval(() => {
      if (socket && clientId) {
        socket.emit("client:online", {
          clientId,
        });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [clientId, socket]);
  return { room: chatRoom, fetchChatRoom, loading, error };
}

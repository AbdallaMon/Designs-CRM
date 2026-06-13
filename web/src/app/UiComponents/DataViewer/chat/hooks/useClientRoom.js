import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useEffect, useState } from "react";

export async function useClientRoom(token, roomId) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchRoom() {
    await getDataAndSet({
      url: `client/chat/rooms/${roomId}?token=${token}&`,
      setLoading,
      setError,
    });
  }
  useEffect(() => {
    fetchRoom();
  }, [roomId, token]);
  return { room, setRoom, loading, error, fetchRoom };
}

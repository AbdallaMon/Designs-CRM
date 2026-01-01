import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { useCallback, useEffect, useState } from "react";

export function useChatMembers(roomId, clientId, showAddMembers) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    await getDataAndSet({
      url: clientId
        ? `client/chat/rooms/${roomId}/members?clientId=${clientId}&`
        : `shared/chat/rooms/${roomId}/members`,
      setLoading,
      setData: setMembers,
    });
  }, [roomId, clientId]);

  useEffect(() => {
    if (roomId) {
      fetchMembers();
    }
  }, [roomId, fetchMembers, showAddMembers]);
  return { members, loading, fetchMembers, setMembers };
}

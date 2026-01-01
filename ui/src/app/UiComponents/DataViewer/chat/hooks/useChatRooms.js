"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useSocket } from "./useSocket";
import { useAuth } from "@/app/providers/AuthProvider";
import { useSearchParams } from "next/navigation";
import { CHAT_LIMITS } from "../utils/chatConstants";
import { useScroll } from "@/app/helpers/hooks/useScroll";

export function useChatRooms({
  category = null,
  limit = CHAT_LIMITS.rooms,
  widgetOpen,
  clientLeadId = null,
} = {}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalRooms, setTotalRooms] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { setLoading: setToastLoading } = useToastContext();
  const [chatType, setChatType] = useState(null);
  const [searchKey, setSearchKey] = useState(null);
  const [refetchToggle, setRefetchToggle] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const { socket } = useSocket();
  const { user } = useAuth();
  const scrollContainerRef = useRef(null);
  const roomsEndRef = useRef(null);
  const pageRef = useRef(page);
  function onSearchChange(newSearchKey) {
    setSearchKey(newSearchKey);
    setInitialLoading(true);
  }
  function onChatTypeChange(newChatType) {
    setChatType(newChatType);
    setInitialLoading(true);
  }
  const fetchRooms = useCallback(async () => {
    let page = pageRef.current;
    if (loading) return;
    else setLoading(true);
    const append = loadingMore;
    const LIMIT = append ? limit : page === 0 ? limit : (page + 1) * limit;
    let currentPage = append ? page : 0;

    setError(null);
    try {
      let url = `shared/chat/rooms?`;
      if (category) url += `category=${category}&`;
      if (clientLeadId) url += `clientLeadId=${clientLeadId}&`;
      if (searchKey) url += `searchKey=${encodeURIComponent(searchKey)}&`;
      if (chatType) url += `chatType=${chatType}&`;
      const response = await getData({
        url,
        setLoading: () => {},
        page: currentPage,
        limit: LIMIT,
      });
      if (response?.status === 200) {
        setTotalPages(response.totalPages || 1);
        setTotalRooms(response.total || 0);
        setRooms((prev) =>
          append ? [...prev, ...(response.data || [])] : response.data || []
        );
        setUnreadCounts(response.unreadCounts || {});
        setTotalUnread(response.totalUnread || 0);
        const hasMore = page + 1 < (response.totalPages || 1);
        setHasMore(hasMore);
      } else {
        setError("Failed to fetch chat rooms");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoading(false);
    }
  }, [
    category,
    clientLeadId,
    limit,
    searchKey,
    chatType,
    loading,
    loadingMore,
  ]);
  function refreshRooms() {
    setRefetchToggle((prev) => !prev);
  }
  useEffect(() => {
    setInitialLoading(true);
  }, [clientLeadId, category]);
  useEffect(() => {
    if (!initialLoading) return;
    setRooms([]);
    setPage(0);
    fetchRooms();
  }, [clientLeadId, category, initialLoading]);

  useEffect(() => {
    if (loading || initialLoading || loadingMore) return;
    fetchRooms();
  }, [refetchToggle]);
  useEffect(() => {
    if (!hasMore) return;
    if (initialLoading) return;
    fetchRooms();
  }, [page]);

  // make effect to fetch rooms each  3 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (socket && user && user.id) {
        socket.emit("user:online", {
          userId: user.id,
        });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [socket, user]);
  useEffect(() => {
    const interval = setInterval(() => {
      refreshRooms();
    }, 120000);
    return () => clearInterval(interval);
  }, []);
  const loadMoreRooms = useCallback(() => {
    if (loadingMore || loading || initialLoading || !hasMore) return;
    const nextPage = page + 1;
    if (nextPage > totalPages) return;
    pageRef.current = nextPage;
    setLoadingMore(true);
    setPage(nextPage);
  }, [
    page,
    totalPages,
    fetchRooms,
    loadingMore,
    loading,
    hasMore,
    initialLoading,
  ]);

  useScroll(scrollContainerRef, loadMoreRooms, 80, "BOTTOM", widgetOpen);
  const createRoom = useCallback(
    async (roomData) => {
      const response = await handleRequestSubmit(
        roomData,
        setToastLoading,
        "shared/chat/rooms",
        false,
        "Creating chat room",
        false,
        "POST"
      );

      if (response?.status === 200) {
        refreshRooms();
        return response.data;
      }
      return null;
    },
    [setToastLoading]
  );
  const createLeadRoom = useCallback(
    async (roomData, onClose) => {
      const response = await handleRequestSubmit(
        roomData,
        setToastLoading,
        "shared/chat/rooms/lead-rooms",
        false,
        "Creating chat room",
        false,
        "POST"
      );

      if (response?.status === 200) {
        refreshRooms();
        if (onClose) onClose();
        return response;
      }
      return null;
    },
    [setToastLoading]
  );

  const updateRoom = useCallback(
    async (roomId, updates) => {
      const response = await handleRequestSubmit(
        updates,
        setToastLoading,
        `shared/chat/rooms/${roomId}`,
        false,
        "Updating chat room",
        false,
        "PUT"
      );

      if (response?.status === 200) {
        refreshRooms();
        return response.data;
      }
      return null;
    },
    [setToastLoading]
  );

  const deleteRoom = useCallback(
    async (roomId) => {
      const response = await handleRequestSubmit(
        { id: roomId },
        setToastLoading,
        `shared/chat/rooms/${roomId}`,
        false,
        "Deleting chat room",
        false,
        "DELETE"
      );
      if (response?.status === 200) {
        refreshRooms();

        return true;
      }
      return false;
    },
    [setToastLoading]
  );
  const leaveRoom = useCallback(
    async (roomId) => {
      const response = await handleRequestSubmit(
        { id: roomId },
        setToastLoading,
        `shared/chat/rooms/${roomId}/leave`,
        false,
        "Leaving chat room",
        false,
        "POST"
      );
      if (response?.status === 200) {
        refreshRooms();
        return true;
      }
      return false;
    },
    [setToastLoading]
  );

  return {
    rooms,
    loading,
    loadingMore,
    error,
    page,
    totalPages,
    loadMoreRooms,
    initialLoading,
    fetchRooms: refreshRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    onSearchChange,
    onChatTypeChange,
    chatType,
    searchKey,
    unreadCounts,
    setUnreadCounts,
    totalUnread,
    setTotalUnread,
    scrollContainerRef,
    roomsEndRef,
    leaveRoom,
    hasMore,
    createLeadRoom,
  };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useSocket } from "./useSocket";
import { useAuth } from "@/app/providers/AuthProvider";

export function useChatRooms({
  category = null,
  projectId = null,
  limit = 25,
} = {}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { setLoading: setToastLoading } = useToastContext();
  const [chatType, setChatType] = useState(null);
  const [searchKey, setSearchKey] = useState(null);
  const [refetchToggle, setRefetchToggle] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);
  const { socket } = useSocket();
  const { user } = useAuth();
  const scrollContainerRef = useRef(null);
  const roomsEndRef = useRef(null);
  function onSearchChange(newSearchKey) {
    setSearchKey(newSearchKey);
    setPage(0);
  }
  function onChatTypeChange(newChatType) {
    setChatType(newChatType);
    setPage(0);
  }
  const fetchRooms = useCallback(
    async (append = false) => {
      const nextPage = page;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        let url = `shared/chat/rooms?`;
        if (category) url += `category=${category}&`;
        if (projectId) url += `projectId=${projectId}&`;
        if (searchKey) url += `searchKey=${encodeURIComponent(searchKey)}&`;
        if (chatType) url += `chatType=${chatType}&`;

        const response = await getData({
          url,
          setLoading: () => {},
          page: nextPage,
          limit,
        });

        if (response?.status === 200) {
          setTotalPages(response.totalPages || 1);
          setPage(nextPage);
          setRooms((prev) =>
            append ? [...prev, ...(response.data || [])] : response.data || []
          );
          setUnreadCounts(response.unreadCounts || {});
          setTotalUnread(response.totalUnread || 0);
        } else {
          setError("Failed to fetch chat rooms");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [category, projectId, limit, searchKey, chatType]
  );

  useEffect(() => {
    fetchRooms(false);
  }, [fetchRooms, page, refetchToggle]);

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
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      setRefetchToggle((prev) => !prev);
    }, 120000);
    return () => clearInterval(interval);
  }, []);
  const loadMoreRooms = useCallback(() => {
    if (loadingMore) return;
    const nextPage = page + 1;
    if (nextPage > totalPages) return;
    setPage(nextPage);
  }, [page, totalPages, fetchRooms, loadingMore]);

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
        fetchRooms(false);
        return response.data;
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
        fetchRooms(false);
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
        fetchRooms(false);
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
    fetchRooms,
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
  };
}

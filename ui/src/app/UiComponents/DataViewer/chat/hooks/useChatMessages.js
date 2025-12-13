"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  emitDeleteMessage,
  emitEditMessage,
  sendNewMessage,
} from "../utils/socketIO";
import { useAuth } from "@/app/providers/AuthProvider";

export function useChatMessages(roomId, initialPage = 0) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const fetchMessages = useCallback(
    async (pageNum = 0) => {
      if (!roomId) return;

      const response = await getData({
        url: `shared/chat/${roomId}/messages?page=${pageNum}&limit=50&`,
        setLoading,
      });

      if (response?.status === 200) {
        const newMessages = response.data || [];
        if (pageNum === 0) {
          setMessages(newMessages.reverse());
        } else {
          setMessages((prev) => [...newMessages.reverse(), ...prev]);
        }
        setTotalMessages(response.total || 0);
        setHasMore((pageNum + 1) * 50 < (response.total || 0));

        if (messagesEndRef.current && pageNum === 0) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }
    },
    [roomId]
  );

  useEffect(() => {
    setMessages([]);
    setPage(0);
    setHasMore(true);
    fetchMessages(0);
  }, [roomId, fetchMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (messageData) => {
    if (!roomId) return null;

    // Create optimistic message object
    const optimisticMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      ...messageData,
      roomId,
      senderId: user.id,
      sender: user,
      createdAt: new Date().toISOString(),
      isEdited: false,
      isDeleted: false,
    };

    // Add message immediately to UI (optimistic update)
    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

    // Then emit to backend
    sendNewMessage({
      data: { ...messageData, roomId, user, userId: user.id },
    });

    return null;
  };

  const editMessage = async (messageId, content) => {
    emitEditMessage({ roomId, messageId, content, userId: user.id });
    return null;
  };

  const deleteMessage = async (messageId) => {
    emitDeleteMessage({ messageId, roomId, userId: user.id });
    return null;
  };

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMessages(nextPage);
  }, [page, fetchMessages]);

  // console.log(socket, "socket");
  // useEffect(() => {}, [socket]);
  return {
    messages,
    loading,
    hasMore,
    totalMessages,
    messagesEndRef,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore,
    scrollToBottom,
    setMessages,
  };
}

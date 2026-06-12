"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import chatService from "../chat.service.js";
import { chatEmit } from "../chat.socket.js";
import { useSocket } from "@/app/v2/providers/SocketProvider";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { useScroll } from "@/app/v2/hooks/useScroll";
import { CHAT_LIMITS } from "../config/chatConstants.js";

// BE GET /v2/chat/rooms/:roomId/messages returns
//   data: { data: [...messages], total, totalPages }
// so the array lives at res.data.data. Keep array/items fallbacks for safety.
function readMessages(res) {
  const data = res?.data ?? {};
  const items = Array.isArray(data) ? data : data.data ?? data.items ?? [];
  const total = data.total ?? res?.total ?? items.length ?? 0;
  const totalPages = data.totalPages ?? res?.totalPages ?? 0;
  return { items, total, totalPages };
}

/**
 * Messages with scroll-back (page+limit) pagination + realtime mutations via socket.
 * Migrated from the legacy useChatMessages; reads/writes go through chatService and
 * chatEmit (v2 socket) instead of legacy getData/socketIO.
 */
export function useChatMessages(roomId, initialPage = 0) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingJumpToMessage, setLoadingJumpToMessage] = useState(false);
  const [replyLoaded, setReplyLoaded] = useState(false);
  const [replayLoadingMessageId, setReplayLoadingMessageId] = useState(null);
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  const { user } = useAuth();
  const { socket } = useSocket();
  const scrollContainerRef = useRef(null);
  const pageRef = useRef(page);
  const messagesEndRef = useRef(null);
  const messagesStartRef = useRef(null);
  const restoreScrollRef = useRef(null);

  const LIMIT = CHAT_LIMITS.MESSAGES;

  const fetchMessages = useCallback(
    async (pageNum = 0, isLoadMore = false, forceLimit) => {
      if (!roomId || loadingMore || loading) return;

      if (isLoadMore && scrollContainerRef.current) {
        const el = scrollContainerRef.current;
        restoreScrollRef.current = {
          prevScrollHeight: el.scrollHeight,
          prevScrollTop: el.scrollTop,
        };
      } else {
        restoreScrollRef.current = null;
      }

      const setBusy = isLoadMore ? setLoadingMore : setLoading;
      setBusy(true);
      try {
        const res = await chatService.listMessages(roomId, {
          page: pageNum,
          limit: forceLimit || LIMIT,
        });
        const { items: newMessages, total } = readMessages(res);

        if (pageNum === 0) setMessages(newMessages);
        else setMessages((prev) => [...newMessages, ...prev]);

        setTotalMessages(total);
        setHasMore((pageNum + 1) * LIMIT < total);

        if (isLoadMore && restoreScrollRef.current && scrollContainerRef.current) {
          window.setTimeout(() => {
            const el = scrollContainerRef.current;
            const { prevScrollHeight, prevScrollTop } = restoreScrollRef.current;
            el.scrollTop = el.scrollHeight - prevScrollHeight + prevScrollTop;
            restoreScrollRef.current = null;
          }, 100);
        }
        return { messages: newMessages, page: pageNum };
      } finally {
        setBusy(false);
      }
    },
    [roomId, LIMIT], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => setInitialLoading(true), [roomId]);
  useEffect(() => {
    if (!initialLoading) return;
    setMessages([]);
    setPage(0);
    fetchMessages(0, false);
  }, [roomId, initialLoading]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hasMore || initialLoading || loadingJumpToMessage) return;
    fetchMessages(page, true);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: initialLoading ? "smooth" : "instant",
      block: "start",
    });
    setInitialLoading(false);
  };

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading || initialLoading || loadingJumpToMessage)
      return false;
    setPage((prev) => prev + 1);
    setLoadingMore(true);
  }, [hasMore, loadingMore, loading, initialLoading, loadingJumpToMessage]);

  useScroll(scrollContainerRef, loadMore, 80, "TOP");

  function checkIfMessageExistsAndJump(messageId) {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ block: "center" });
      return true;
    }
    return false;
  }

  async function onJumpToMessage(messageId) {
    if (loadingJumpToMessage) return;
    setLoadingJumpToMessage(true);
    try {
      if (checkIfMessageExistsAndJump(messageId)) return;
      const req = await chatService.getMessagePage(roomId, messageId, { limit: LIMIT });
      let lastReq;
      const messagePage = req?.data?.page ?? req?.page;
      if (messagePage != null) {
        for (let p = pageRef.current + 1; p <= messagePage; p++) {
          lastReq = await fetchMessages(p, true);
          if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
        }
        checkIfMessageExistsAndJump(messageId, lastReq?.messages);
        setPage(messagePage);
      }
    } finally {
      setLoadingJumpToMessage(false);
      setReplyLoaded(true);
      setReplayLoadingMessageId(messageId);
    }
  }

  // ── realtime emits (optimistic UI handled by socket events in the window) ──
  const sendMessage = async (messageData) => {
    if (!roomId) return null;
    chatEmit.sendMessage(socket, {
      data: { ...messageData, roomId, user, userId: user.id },
    });
    return null;
  };
  const editMessage = async (messageId, content) => {
    chatEmit.editMessage(socket, { roomId, messageId, content, userId: user.id });
    return null;
  };
  const deleteMessage = async (messageId) => {
    chatEmit.deleteMessage(socket, { messageId, roomId, userId: user.id });
    return null;
  };
  const deleteSelectedMessages = async (selectedMessages) => {
    for (const m of selectedMessages) await deleteMessage(m.id);
  };

  return {
    messages,
    loading,
    hasMore,
    totalMessages,
    scrollContainerRef,
    messagesStartRef,
    messagesEndRef,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore,
    scrollToBottom,
    setMessages,
    initialLoading,
    loadingMore,
    onJumpToMessage,
    loadingJumpToMessage,
    setReplyLoaded,
    replyLoaded,
    replayLoadingMessageId,
    setReplayLoadingMessageId,
    newMessagesCount,
    setNewMessagesCount,
    deleteSelectedMessages,
  };
}

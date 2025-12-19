"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { getData } from "@/app/helpers/functions/getData";
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { user } = useAuth();
  // ✅ attach this ref to your scrollable messages container (Box/Paper/etc)
  const scrollContainerRef = useRef(null);

  // keep your refs
  const messagesEndRef = useRef(null);
  const messagesStartRef = useRef(null);

  // used to keep scroll position after prepending older messages
  const restoreScrollRef = useRef(null);

  const LIMIT = 10;
  const TOP_THRESHOLD_PX = 80;

  const fetchMessages = useCallback(
    async (pageNum = 0, isLoadMore = false) => {
      if (!roomId) return;
      if (loadingMore) return;
      if (loading) return;

      // ✅ before load-more, remember current scroll state
      if (isLoadMore && scrollContainerRef.current) {
        const el = scrollContainerRef.current;
        restoreScrollRef.current = {
          prevScrollHeight: el.scrollHeight,
          prevScrollTop: el.scrollTop,
        };
      } else {
        restoreScrollRef.current = null;
      }

      const response = await getData({
        url: `shared/chat/${roomId}/messages?page=${pageNum}&limit=${LIMIT}&`,
        setLoading: isLoadMore ? setLoadingMore : setLoading,
      });

      if (response?.status === 200) {
        const newMessages = response.data || [];

        if (pageNum === 0) {
          setMessages(newMessages);
        } else {
          setMessages((prev) => {
            return [...newMessages, ...prev];
          });
        }

        setTotalMessages(response.total || 0);
        setHasMore((pageNum + 1) * LIMIT < (response.total || 0));

        // ✅ on first load, scroll to bottom
        if (messagesEndRef.current && pageNum === 0) {
          messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        }
      }
    },
    [roomId]
  );

  useEffect(() => {
    if (!initialLoading) return;
    setMessages([]);
    setPage(0);
    setHasMore(true);
    fetchMessages(0, false);
  }, [roomId, fetchMessages]);
  useEffect(() => {
    if (!hasMore) return;

    fetchMessages(page, true);
  }, [page]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setInitialLoading(false);
  };

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    if (loadingMore || loading || initialLoading) return;
    setPage((prev) => {
      const next = prev + 1;
      return next;
    });
    setLoadingMore(true);
  }, [hasMore, loadingMore, loading, initialLoading, fetchMessages]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let lastScrollTop = el.scrollTop;
    let touchStartY = null;

    const isNearTop = () => el.scrollTop <= TOP_THRESHOLD_PX;

    const onScroll = () => {
      const current = el.scrollTop;
      const goingUp = current < lastScrollTop;
      lastScrollTop = current;

      if (goingUp && isNearTop()) loadMore();
    };

    const onWheel = (e) => {
      // deltaY < 0 means user is trying to go UP
      if (e.deltaY < 0 && isNearTop()) loadMore();
    };

    const onTouchStart = (e) => {
      touchStartY = e.touches?.[0]?.clientY ?? null;
    };

    const onTouchMove = (e) => {
      if (touchStartY == null) return;
      const currentY = e.touches?.[0]?.clientY ?? touchStartY;
      const movingDown = currentY > touchStartY; // finger down => content up
      if (movingDown && isNearTop()) loadMore();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [loadMore]);

  const sendMessage = async (messageData) => {
    if (!roomId) return null;

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      ...messageData,
      roomId,
      senderId: user.id,
      sender: user,
      createdAt: new Date().toISOString(),
      isEdited: false,
      isDeleted: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

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

  return {
    messages,
    loading,
    hasMore,
    totalMessages,

    // ✅ refs
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

    loadingMore,
    initialLoading,
  };
}

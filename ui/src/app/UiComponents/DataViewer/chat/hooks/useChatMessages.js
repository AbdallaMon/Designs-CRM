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
import { CHAT_LIMITS } from "../utils/chatConstants";
import { useScroll } from "@/app/helpers/hooks/useScroll";

export function useChatMessages(roomId, initialPage = 0, clientId) {
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
  // ✅ attach this ref to your scrollable messages container (Box/Paper/etc)
  const scrollContainerRef = useRef(null);
  const pageRef = useRef(page);

  // keep your refs
  const messagesEndRef = useRef(null);
  const messagesStartRef = useRef(null);

  // used to keep scroll position after prepending older messages
  const restoreScrollRef = useRef(null);

  const LIMIT = CHAT_LIMITS.MESSAGES;

  const fetchMessages = useCallback(
    async (pageNum = 0, isLoadMore = false, forceLimit) => {
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
        url: clientId
          ? `client/chat/${roomId}/messages?page=${pageNum}&limit=${
              forceLimit || LIMIT
            }&clientId=${clientId}&`
          : `shared/chat/${roomId}/messages?page=${pageNum}&limit=${
              forceLimit || LIMIT
            }&`,
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
        const hasMore = (pageNum + 1) * LIMIT < (response.total || 0);

        setHasMore(hasMore);
        if (
          isLoadMore &&
          restoreScrollRef.current &&
          scrollContainerRef.current
        ) {
          window.setTimeout(() => {
            // restore previous scroll position
            const el = scrollContainerRef.current;
            const { prevScrollHeight, prevScrollTop } =
              restoreScrollRef.current;
            const newScrollHeight = el.scrollHeight;
            el.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;

            restoreScrollRef.current = null;
          }, 100);
        }
        return { messages: newMessages, page: pageNum };
      }
    },
    [roomId]
  );
  useEffect(() => {
    pageRef.current = page; // Keep ref in sync with state
  }, [page]);
  useEffect(() => {
    setInitialLoading(true);
  }, [roomId]);
  useEffect(() => {
    if (!initialLoading) return;
    setMessages([]);
    setPage(0);
    fetchMessages(0, false);
  }, [roomId, fetchMessages, initialLoading]);
  useEffect(() => {
    if (!hasMore) return;
    if (initialLoading) return;
    if (loadingJumpToMessage) return;
    fetchMessages(page, true);
  }, [page]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: initialLoading ? "smooth" : "instant",
      block: "start",
    });
    setInitialLoading(false);
  };

  const loadMore = useCallback(() => {
    if (!hasMore) return false;
    if (loadingMore || loading || initialLoading || loadingJumpToMessage)
      return false;
    setPage((prev) => prev + 1);
    setLoadingMore(true);
  }, [
    page,
    hasMore,
    loadingMore,
    loading,
    initialLoading,
    fetchMessages,
    loadingJumpToMessage,
  ]);

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
      // Try current page first
      if (checkIfMessageExistsAndJump(messageId)) {
        return;
      }

      const req = await getData({
        url: clientId
          ? `client/chat/${roomId}/messages/${messageId}/page?clientId=${clientId}&`
          : `shared/chat/${roomId}/messages/${messageId}/page`,
        setLoading: () => {},
        limit: LIMIT,
      });
      let lastReq;
      if (req?.status === 200) {
        // lets loop starting from current page till the messagePage loop and make a samll time out then we we finsih we jump
        const messagePage = req?.page;
        for (let p = pageRef.current + 1; p <= messagePage; p++) {
          lastReq = await fetchMessages(p, true);
          // scroll to top to load more smoothly
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
          }
        }
        checkIfMessageExistsAndJump(messageId, lastReq.messages);
        setPage(messagePage);
        return;
      }
    } finally {
      setLoadingJumpToMessage(false);
      setReplyLoaded(true);
      setReplayLoadingMessageId(messageId);
    }
  }

  const sendMessage = async (messageData) => {
    if (!roomId) return null;

    // setMessages((prev) => [...prev, optimisticMessage]);

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
    initialLoading,
    loadingMore,
    initialLoading,
    onJumpToMessage,
    loadingJumpToMessage,
    setReplyLoaded,
    replyLoaded,
    replayLoadingMessageId,
    setReplayLoadingMessageId,
    newMessagesCount,
    setNewMessagesCount,
  };
}

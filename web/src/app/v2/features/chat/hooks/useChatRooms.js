"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import chatService from "../chat.service.js";
import { runChatMutation } from "../chat.mutations.js";
import { useChatSocket, chatEmit } from "../chat.socket.js";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { useScroll } from "@/app/v2/hooks/useScroll";
import { CHAT_LIMITS } from "../config/chatConstants.js";
import { useT } from "@/app/v2/lib/i18n";

/** Read the rooms envelope. BE returns the array directly under res.data (or an
 *  {items,total} shape); derive totalPages from total/limit since the BE does not emit it. */
function readRoomsEnvelope(res, limit) {
  const data = res?.data ?? {};
  const items = Array.isArray(data) ? data : data.items ?? res?.data ?? [];
  const total = data.total ?? res?.total ?? items.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const totalUnread = data.totalUnread ?? res?.totalUnread ?? 0;
  return { items, total, totalPages, totalUnread };
}

export function useChatRooms({
  category = null,
  limit = CHAT_LIMITS.rooms,
  clientLeadId = null,
} = {}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [chatType, setChatType] = useState(null);
  const [searchKey, setSearchKey] = useState(null);
  const [refetchToggle, setRefetchToggle] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);

  const { t } = useT();
  const { user } = useAuth();
  const { socket } = useChatSocket();
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
    const currentPageState = pageRef.current;
    if (loading) return;
    setLoading(true);
    const append = loadingMore;
    const LIMIT = append ? limit : currentPageState === 0 ? limit : (currentPageState + 1) * limit;
    const currentPage = append ? currentPageState : 0;

    setError(null);
    try {
      const res = await chatService.listRooms({
        page: currentPage,
        limit: LIMIT,
        ...(category ? { category } : {}),
        ...(clientLeadId ? { clientLeadId } : {}),
        ...(searchKey ? { searchKey } : {}),
        ...(chatType ? { chatType } : {}),
      });
      const env = readRoomsEnvelope(res, LIMIT);
      setTotalPages(env.totalPages);
      setRooms((prev) => (append ? [...prev, ...env.items] : env.items));
      setTotalUnread(env.totalUnread);
      setHasMore(currentPageState + 1 < env.totalPages);
    } catch (err) {
      setError(err?.message || t("chat.error.loadRooms", "فشل تحميل المحادثات"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoading(false);
    }
  }, [category, clientLeadId, limit, searchKey, chatType, loading, loadingMore, t]);

  const refreshRooms = useCallback(() => setRefetchToggle((p) => !p), []);

  useEffect(() => setInitialLoading(true), [clientLeadId, category]);
  useEffect(() => {
    if (!initialLoading) return;
    setRooms([]);
    setPage(0);
    pageRef.current = 0;
    fetchRooms();
  }, [clientLeadId, category, initialLoading]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (loading || initialLoading || loadingMore) return;
    fetchRooms();
  }, [refetchToggle]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hasMore || initialLoading) return;
    fetchRooms();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // presence heartbeat + periodic refresh (legacy parity)
  useEffect(() => {
    const interval = setInterval(() => {
      if (socket && user?.id) chatEmit.online(socket, { userId: user.id });
    }, 60000);
    return () => clearInterval(interval);
  }, [socket, user]);
  useEffect(() => {
    const interval = setInterval(() => refreshRooms(), 120000);
    return () => clearInterval(interval);
  }, [refreshRooms]);

  const loadMoreRooms = useCallback(() => {
    if (loadingMore || loading || initialLoading || !hasMore) return;
    const nextPage = page + 1;
    if (nextPage > totalPages) return;
    pageRef.current = nextPage;
    setLoadingMore(true);
    setPage(nextPage);
  }, [page, totalPages, loadingMore, loading, hasMore, initialLoading]);

  useScroll(scrollContainerRef, loadMoreRooms, 80, "BOTTOM");

  // ── mutations (via chatService + toast) ─────────────────────────────────────
  const createRoom = useCallback(async (roomData) => {
    const res = await runChatMutation(() => chatService.createRoom(roomData), {
      loading: t("chat.toast.creatingRoom", "جاري إنشاء المحادثة..."),
    });
    if (res) refreshRooms();
    return res?.data ?? null;
  }, [refreshRooms, t]);

  const createLeadRoom = useCallback(async (roomData, onClose) => {
    const res = await runChatMutation(() => chatService.createLeadRoom(roomData), {
      loading: t("chat.toast.creatingRoom", "جاري إنشاء المحادثة..."),
    });
    if (res) {
      refreshRooms();
      onClose?.();
    }
    return res;
  }, [refreshRooms, t]);

  const updateRoom = useCallback(async (roomId, updates) => {
    const res = await runChatMutation(() => chatService.updateRoom(roomId, updates), {
      loading: t("chat.toast.updatingRoom", "جاري تحديث المحادثة..."),
    });
    if (res) refreshRooms();
    return res?.data ?? null;
  }, [refreshRooms, t]);

  const deleteRoom = useCallback(async (roomId) => {
    const res = await runChatMutation(() => chatService.deleteRoom(roomId), {
      loading: t("chat.toast.deletingRoom", "جاري حذف المحادثة..."),
    });
    if (res) refreshRooms();
    return Boolean(res);
  }, [refreshRooms, t]);

  const leaveRoom = useCallback(async (roomId, selfMemberId = null) => {
    // Leave = remove self via DELETE /rooms/:roomId/members/:memberId. The BE coerces
    // :memberId with z.coerce.number() (no "me" resolution), so we must pass the real
    // member id. Prefer the caller-supplied id; otherwise derive it from room detail
    // (room.selfMember.id) before leaving.
    let memberId = selfMemberId;
    if (memberId == null) {
      try {
        const detail = await chatService.getRoom(roomId);
        memberId = detail?.data?.selfMember?.id ?? null;
      } catch {
        memberId = null;
      }
    }
    if (memberId == null) return false;
    const res = await runChatMutation(
      () => chatService.removeMember(roomId, memberId),
      { loading: t("chat.toast.leavingRoom", "جاري مغادرة المحادثة...") },
    );
    if (res) refreshRooms();
    return Boolean(res);
  }, [refreshRooms, t]);

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
    createLeadRoom,
    updateRoom,
    deleteRoom,
    leaveRoom,
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
    hasMore,
  };
}

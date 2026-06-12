"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import chatService from "../chat.service.js";
import { useScroll } from "@/app/v2/hooks/useScroll";
import { CHAT_LIMITS } from "../config/chatConstants.js";

function readFiles(res) {
  const data = res?.data ?? {};
  // BE returns the file array under data (or data.files) + uniqueMonths; it does NOT
  // emit totalPages — the consumer derives pages from total/limit.
  const items = data.items ?? data.files ?? (Array.isArray(data) ? data : []);
  const total = data.total ?? res?.total ?? items.length ?? 0;
  const uniqueMonths = data.uniqueMonths ?? {};
  return { items, total, uniqueMonths };
}

/** Chat room files with infinite scroll + type filter. Target list contract is
 *  { items, total, page, pageSize } (also reads the legacy { files, uniqueMonths }). */
export function useChatFiles(roomId, { limit = CHAT_LIMITS.FILES, fileType = [] } = {}) {
  const [files, setFiles] = useState([]);
  const [uniqueMonths, setUniqueMonths] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [refetchToggle, setRefetchToggle] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(page);
  const scrollContainerRef = useRef(null);
  const filesEndRef = useRef(null);

  const fetchFiles = useCallback(async () => {
    if (!roomId || loading) return;
    const currentPageState = pageRef.current;
    setLoading(true);
    const append = loadingMore;
    const LIMIT = append ? limit : currentPageState === 0 ? limit : (currentPageState + 1) * limit;
    const currentPage = append ? currentPageState : 0;

    setError(null);
    try {
      const res = await chatService.listFiles(roomId, {
        page: currentPage,
        limit: LIMIT,
        sort: "newest",
        ...(fileType?.length ? { type: fileType } : {}),
      });
      const env = readFiles(res);
      setFiles((prev) => (append ? [...prev, ...env.items] : env.items));
      setUniqueMonths((prev) => ({ ...prev, ...env.uniqueMonths }));
      setTotalPages(Math.max(1, Math.ceil(env.total / LIMIT)));
      setTotal(env.total);
      setHasMore((currentPageState + 1) * LIMIT < env.total);
    } catch (err) {
      setError(err?.message || "فشل تحميل الملفات");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoading(false);
    }
  }, [roomId, limit, fileType, loading, loadingMore]);

  const resetAll = useCallback(() => {
    setFiles([]);
    setPage(0);
    pageRef.current = 0;
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => { if (initialLoading) resetAll(); }, [roomId, initialLoading]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setInitialLoading(true), [roomId, fileType]);
  useEffect(() => {
    if (loading || initialLoading || loadingMore) return;
    fetchFiles();
  }, [refetchToggle]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hasMore || initialLoading) return;
    fetchFiles();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (loadingMore || loading || initialLoading || !hasMore) return;
    const nextPage = page + 1;
    if (nextPage > totalPages) return;
    pageRef.current = nextPage;
    setLoadingMore(true);
    setPage(nextPage);
  }, [page, totalPages, loadingMore, loading, hasMore, initialLoading]);

  useScroll(scrollContainerRef, loadMore, 100, "BOTTOM");

  return {
    files,
    uniqueMonths,
    loading,
    loadingMore,
    page,
    initialLoading,
    totalPages,
    total,
    error,
    loadMore,
    refreshFiles: () => setRefetchToggle((p) => !p),
    hasMore,
    filesEndRef,
    scrollContainerRef,
  };
}

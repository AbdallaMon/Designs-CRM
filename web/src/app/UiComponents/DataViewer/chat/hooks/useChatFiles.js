"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getData } from "@/app/helpers/functions/getData";
import { CHAT_LIMITS } from "../utils/chatConstants";
import { useScroll } from "@/app/helpers/hooks/useScroll";

/**
 * Hook to fetch and manage chat room files with infinite scroll, search, and filtering
 */
export function useChatFiles(
  roomId,
  {
    limit = CHAT_LIMITS.FILES,
    sort = "newest",
    searchQuery = "",
    fileType = {},
    clientId = null,
  } = {}
) {
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
    if (!roomId) return;
    let page = pageRef.current;
    if (loading) return;
    else setLoading(true);
    const append = loadingMore;
    const LIMIT = append ? limit : page === 0 ? limit : (page + 1) * limit;
    let currentPage = append ? page : 0;

    setError(null);

    try {
      // Build query string
      let queryParams = ``;
      if (searchQuery?.trim()) {
        queryParams += `q=${encodeURIComponent(searchQuery.trim())}&`;
      }
      if (fileType?.length > 0) {
        queryParams += `type=${fileType}&`;
      }

      const response = await getData({
        url: clientId
          ? `client/chat/rooms/${roomId}/files?clientId=${clientId}&${queryParams}&uniqueMonths=${JSON.stringify(
              uniqueMonths
            )}&`
          : `shared/chat/rooms/${roomId}/files?${queryParams}&uniqueMonths=${JSON.stringify(
              uniqueMonths
            )}&`,
        setLoading: () => {},
        page: currentPage,
        limit: LIMIT,
        sort: sort,
      });

      if (response?.status === 200) {
        const newFiles = response.data || [];
        setFiles((prev) =>
          append ? [...prev, ...newFiles.files] : newFiles.files
        );
        setUniqueMonths((prev) => {
          return { ...prev, ...newFiles.uniqueMonths };
        });

        setTotalPages(response.totalPages || 1);
        setTotal(response.total || 0);
        const hasMore = (page + 1) * LIMIT < (response.total || 0);
        setHasMore(hasMore);
      } else {
        setError(response?.message || "Failed to fetch files");
      }
    } catch (err) {
      setError(err.message || "Error fetching files");
      console.error("Error fetching chat files:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoading(false);
    }
  }, [
    roomId,
    limit,
    sort,
    searchQuery,
    fileType,
    loading,
    loadingMore,
    uniqueMonths,
  ]);

  function refreshFiles() {
    setRefetchToggle((prev) => !prev);
  }
  function resetAll() {
    setFiles([]);
    setPage(0);
    fetchFiles();
  }
  useEffect(() => {
    if (!initialLoading) return;
    resetAll();
  }, [roomId, initialLoading]);
  useEffect(() => {
    setInitialLoading(true);
  }, [roomId, fileType]);
  useEffect(() => {
    if (loading || initialLoading || loadingMore) return;
    fetchFiles();
  }, [refetchToggle]);
  useEffect(() => {
    if (!hasMore) return;
    if (initialLoading) return;
    fetchFiles();
  }, [page]);
  const loadMoreFiles = useCallback(() => {
    if (loadingMore || loading || initialLoading || !hasMore) return;
    const nextPage = page + 1;
    if (nextPage > totalPages) return;
    pageRef.current = nextPage;
    setLoadingMore(true);
    setPage(nextPage);
  }, [
    page,
    totalPages,
    fetchFiles,
    loadingMore,
    loading,
    hasMore,
    initialLoading,
  ]);

  useScroll(scrollContainerRef, loadMoreFiles, 100, "BOTTOM");
  return {
    files,
    loading,
    loadingMore,
    page,
    initialLoading,
    totalPages,
    total,
    error,
    loadMore: loadMoreFiles,
    refreshFiles,
    hasMore,
    filesEndRef,
    scrollContainerRef,
    pageRef,
    files,
    uniqueMonths,
  };
}

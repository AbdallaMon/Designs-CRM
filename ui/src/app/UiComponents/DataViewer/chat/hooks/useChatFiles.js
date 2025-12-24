"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getData } from "@/app/helpers/functions/getData";

/**
 * Hook to fetch and manage chat room files with infinite scroll, search, and filtering
 */
export function useChatFiles(
  roomId,
  { limit = 5, sort = "newest", searchQuery = "", fileType = [] } = {}
) {
  const [files, setFiles] = useState([]);
  const [filesByMonth, setFilesByMonth] = useState({});
  const [sortedMonths, setSortedMonths] = useState([]);
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
  const BOTTOM_THRESHOLD_PX = 80;
  const fetchFiles = useCallback(async () => {
    if (!roomId) return;
    let page = pageRef.current;
    if (loading) return;
    else setLoading(true);
    const append = loadingMore;
    console.log(append, "append");
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
        url: `shared/chat/rooms/${roomId}/files?${queryParams}`,
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
        setFilesByMonth((prev) => {
          const updated = append
            ? { ...prev, ...newFiles.filesByMonth }
            : newFiles.filesByMonth;
          return updated;
        });
        setSortedMonths((prev) => {
          const months = append
            ? [...prev, ...newFiles.sortedMonths]
            : newFiles.sortedMonths;
          return months;
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
  }, [roomId, limit, sort, searchQuery, fileType]);

  function refreshFiles() {
    setRefetchToggle((prev) => !prev);
  }
  useEffect(() => {
    if (!initialLoading) return;
    setFiles([]);
    setPage(0);
    fetchFiles();
  }, [roomId, initialLoading]);
  useEffect(() => {
    setInitialLoading(true);
  }, [roomId]);
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

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // let lastScrollTop = el.scrollTop;
    let LastScrollBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
    let touchStartY = null;

    const isNearBottom = () => LastScrollBottom <= BOTTOM_THRESHOLD_PX;

    const onScroll = () => {
      const current = el.scrollTop;
      const goingBottom = current > LastScrollBottom;
      LastScrollBottom = el.scrollHeight - el.clientHeight - el.scrollTop;

      if (goingBottom && isNearBottom()) loadMoreFiles();
    };

    const onWheel = (e) => {
      // deltaY < 0 means user is trying to go UP
      if (e.deltaY < 0 && isNearBottom()) loadMoreFiles();
    };

    const onTouchStart = (e) => {
      touchStartY = e.touches?.[0]?.clientY ?? null;
    };

    const onTouchMove = (e) => {
      if (touchStartY == null) return;
      const currentY = e.touches?.[0]?.clientY ?? touchStartY;
      const movingDown = currentY < touchStartY; // finger up => content down
      if (movingDown && isNearBottom()) loadMoreFiles();
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
  }, [loadMoreFiles]);

  return {
    files,
    filesByMonth,
    sortedMonths,
    loading,
    loadingMore,
    page,
    totalPages,
    total,
    error,
    loadMoreFiles,
    refreshFiles,
    hasMore,
    filesEndRef,
    scrollContainerRef,
    pageRef,
  };
}

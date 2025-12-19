"use client";

import { useState, useEffect, useCallback } from "react";
import { getData } from "@/app/helpers/functions/getData";

/**
 * Hook to fetch and manage chat room files with infinite scroll, search, and filtering
 */
export function useChatFiles(
  roomId,
  { limit = 20, sort = "newest", searchQuery = "", fileType = [] } = {}
) {
  const [files, setFiles] = useState([]);
  const [filesByMonth, setFilesByMonth] = useState({});
  const [sortedMonths, setSortedMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  const fetchFiles = useCallback(
    async (pageNum = 1, append = false) => {
      if (!roomId) return;

      const loadingSetter = pageNum === 1 ? setLoading : setLoadingMore;
      loadingSetter(true);
      setError(null);

      try {
        // Build query string
        let queryParams = `page=${pageNum}&limit=${limit}&sort=${sort}&`;
        if (searchQuery?.trim()) {
          queryParams += `q=${encodeURIComponent(searchQuery.trim())}&`;
        }
        if (fileType?.length > 0) {
          queryParams += `type=${fileType}&`;
        }

        const response = await getData({
          url: `shared/chat/rooms/${roomId}/files?${queryParams}`,
          setLoading: () => {},
        });

        if (response?.status === 200) {
          const newFiles = response.data || [];
          setFiles((prev) =>
            append ? [...prev, ...newFiles.files] : newFiles.files
          );
          // setFilesByMonth((prev) => (append ? [...prev, ...newFiles.filesByMonth] : newFiles.filesByMonth));
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
          setPage(pageNum);
        } else {
          setError(response?.message || "Failed to fetch files");
        }
      } catch (err) {
        setError(err.message || "Error fetching files");
        console.error("Error fetching chat files:", err);
      } finally {
        loadingSetter(false);
      }
    },
    [roomId, limit, sort, searchQuery, fileType]
  );

  const loadMoreFiles = useCallback(() => {
    if (page < totalPages && !loadingMore) {
      fetchFiles(page + 1, true);
    }
  }, [page, totalPages, loadingMore, fetchFiles]);

  const refreshFiles = useCallback(() => {
    fetchFiles(1, false);
  }, [fetchFiles]);

  // Initial fetch
  useEffect(() => {
    if (roomId) {
      fetchFiles(1, false);
    }
  }, [roomId, fetchFiles]);

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
    hasMore: page < totalPages,
  };
}

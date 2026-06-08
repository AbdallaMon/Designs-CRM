"use client";

// List hook for the admin courses list. Owns pagination + filter state and calls the courses
// SERVICE (never apiFetch directly). Consumes the §5c list shape
// `data: { items, total, page, pageSize }`. The admin list dto does NOT emit capabilities.*,
// so admin row gating is permission-code-only (see courses.service.js header). Mirrors
// features/users/hooks/useUsersList.js.

import { useCallback, useEffect, useState } from "react";
import { coursesService } from "../courses.service.js";

const DEFAULT_PAGE_SIZE = 10;

export function useCoursesList({ autoFetch = true } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await coursesService.list({ page, limit: pageSize });
      const data = res?.data ?? {};
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total) || 0);
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setItems([]);
      setTotal(0);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    if (autoFetch) fetchCourses();
  }, [autoFetch, fetchCourses]);

  return {
    items,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    isLoading,
    error,
    refetch: fetchCourses,
  };
}

export default useCoursesList;

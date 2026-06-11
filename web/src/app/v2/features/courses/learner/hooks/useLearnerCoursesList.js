"use client";

// List hook for the staff learner catalogue. Owns pagination and calls the staffCourses SERVICE
// (never apiFetch directly). The list is a paginated envelope (CONTRACT CHANGE #7;
// total === items.length). Mirrors features/courses/hooks/useCoursesList.js.

import { useCallback, useEffect, useState } from "react";
import { staffCoursesService } from "../../staffCourses.service.js";

const DEFAULT_PAGE_SIZE = 12;

export function useLearnerCoursesList({ autoFetch = true } = {}) {
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
      const res = await staffCoursesService.list({ page, limit: pageSize });
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

  return { items, total, page, setPage, pageSize, setPageSize, isLoading, error, refetch: fetchCourses };
}

export default useLearnerCoursesList;

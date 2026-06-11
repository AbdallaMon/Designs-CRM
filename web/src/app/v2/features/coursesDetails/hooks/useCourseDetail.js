"use client";

// Detail hook for the admin course EDITOR. There is no single GET /courses/:id detail read on
// the admin surface; the course header is derived from the paginated list (find by id) plus the
// lessons read. We expose the course summary + a refetch. Lessons/tests/access tabs lazily fetch
// their own slices via useLazyResource. Mirrors features/usersDetails/hooks/useUserDetail.js.

import { useCallback, useEffect, useState } from "react";
import { coursesService } from "@/app/v2/features/courses/courses.service.js";

export function useCourseDetail(courseId, { autoFetch = true } = {}) {
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return null;
    setIsLoading(true);
    setError(null);
    try {
      // The admin list is the only course read; page through to find this id. Lists are small
      // (admin authoring); a generous limit avoids paging for the header lookup.
      const res = await coursesService.list({ page: 1, limit: 200 });
      const items = res?.data?.items ?? [];
      const found = items.find((c) => Number(c.id) === Number(courseId)) ?? null;
      setCourse(found);
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (autoFetch) fetchCourse();
  }, [autoFetch, fetchCourse]);

  return { course, setCourse, isLoading, error, refetch: fetchCourse };
}

export default useCourseDetail;

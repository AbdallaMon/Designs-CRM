"use client";

// List hook for the standalone tasks surface. Calls the projects-domain SERVICE
// (projectsService.listTasks → GET /v2/tasks). The BE narrows the rows by role/self
// (designers/staff see their own), so this single code path renders the same list each
// role saw before. Response shape is `data: { items }` (not numerically paginated). Each
// task carries backend-computed capabilities.*.

import { useCallback, useEffect, useState } from "react";
import { projectsService } from "../../projects/projects.service.js";

export function useTasksList({ autoFetch = true, initialExtra = {} } = {}) {
  const [items, setItems] = useState([]);
  const [extra, setExtra] = useState(initialExtra);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await projectsService.listTasks({ extra });
      const data = res?.data ?? {};
      setItems(Array.isArray(data.items) ? data.items : []);
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setItems([]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [extra]);

  useEffect(() => {
    if (autoFetch) fetchTasks();
  }, [autoFetch, fetchTasks]);

  return { items, setItems, extra, setExtra, isLoading, error, refetch: fetchTasks };
}

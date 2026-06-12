import { useState, useCallback } from "react";

export function useLoading(initialValue = false) {
  const [isLoading, setIsLoading] = useState(initialValue);

  // Memoized so consumers (e.g. useRequest's fetchData useCallback) get STABLE
  // references — otherwise fetchData changes every render, its effect re-fires,
  // and autoFetch screens spin into "Maximum update depth exceeded".
  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  return {
    isLoading,
    setIsLoading,
    startLoading,
    stopLoading,
  };
}

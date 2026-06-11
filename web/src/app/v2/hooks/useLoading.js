import { useCallback, useState } from "react";

export function useLoading(initialValue = false) {
  const [isLoading, setIsLoading] = useState(initialValue);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  return {
    isLoading,
    setIsLoading,
    startLoading,
    stopLoading,
  };
}

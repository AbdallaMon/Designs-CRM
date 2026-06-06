import { useState } from "react";

export function useLoading(initialValue = false) {
  const [isLoading, setIsLoading] = useState(initialValue);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return {
    isLoading,
    setIsLoading,
    startLoading,
    stopLoading,
  };
}

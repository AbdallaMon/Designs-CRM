"use client";

// Lazy reviews hook for a single location. Fetches only when both accountId (from the
// locations read) and a selected locationId are present — matching the BE which builds
// `${accountId}/${locationId}` for the Google mybusiness v4 reviews list. Calls the reviews
// SERVICE (never apiFetch directly). Consumes the envelope `data: <reviews array>` (raw Google
// shape, mapped defensively in config/reviewsLabels.js). Re-fetches whenever the selection
// changes; clears when no location is selected.

import { useCallback, useEffect, useState } from "react";
import { reviewsService } from "../reviews.service.js";

export function useLocationReviews({ accountId, locationId } = {}) {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const enabled = Boolean(accountId && locationId);

  const fetchReviews = useCallback(async () => {
    if (!enabled) {
      setReviews([]);
      setError(null);
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await reviewsService.getReviews({ accountId, locationId });
      // The reviews read returns the raw array directly under the envelope `data`.
      const data = res?.data;
      setReviews(Array.isArray(data) ? data : Array.isArray(data?.reviews) ? data.reviews : []);
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "REVIEW_INTEGRATION_ERROR");
      setReviews([]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, accountId, locationId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    isLoading,
    error,
    enabled,
    refetch: fetchReviews,
  };
}

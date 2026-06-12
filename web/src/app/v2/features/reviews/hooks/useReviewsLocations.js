"use client";

// List hook for the connected Google Business locations. Owns fetch state and calls the
// reviews SERVICE (never apiFetch directly), consuming the envelope `data: { accountId,
// locations }`. `accountId` is needed downstream to fetch a location's reviews
// (getReviews(accountId, locationId)). The integration is studio-wide with NO object scope —
// the REVIEW.VIEW code is the gate (checked by the page before autoFetch).
//
// Connection status is DERIVED: the frozen service returns undefined on failure (non-functional
// placeholder OAuth client today), so a successful fetch that yields no accountId/locations is
// treated as "not connected" rather than an error.

import { useCallback, useEffect, useState } from "react";
import { reviewsService } from "../reviews.service.js";

export function useReviewsLocations({ autoFetch = true } = {}) {
  const [accountId, setAccountId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // null = unknown (not fetched yet); true/false after the first successful/failed fetch.
  const [connected, setConnected] = useState(null);

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await reviewsService.getLocations();
      const data = res?.data ?? {};
      const acc = data.accountId ?? null;
      const locs = Array.isArray(data.locations) ? data.locations : [];
      setAccountId(acc);
      setLocations(locs);
      // The frozen service yields { accountId, locations } only when the OAuth client is
      // authorized; an empty/absent payload means the account is not connected.
      setConnected(Boolean(acc));
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "REVIEW_INTEGRATION_ERROR");
      setAccountId(null);
      setLocations([]);
      setConnected(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetchLocations();
  }, [autoFetch, fetchLocations]);

  return {
    accountId,
    locations,
    connected,
    isLoading,
    error,
    refetch: fetchLocations,
  };
}

"use client";

// Detail hook — loads ONE user's profile via the users SERVICE (never apiFetch directly).
// GET /:userId/profile is object-scope-checked on the BE (self OR admin-tier) and returns the
// safe profile + `capabilities.*` (computeProfileCapabilities → canEditProfile). The detail
// page derives its header + the Profile tab from this; the other (admin) tabs lazily fetch
// their own slices. Mirrors features/leadsDetails/hooks/useLeadDetail.js.

import { useCallback, useEffect, useState } from "react";
import { usersService } from "@/app/v2/features/users/users.service.js";

export function useUserDetail(userId, { autoFetch = true } = {}) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const res = await usersService.getProfile(userId);
      setProfile(res?.data ?? null);
      return res;
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (autoFetch) fetchProfile();
  }, [autoFetch, fetchProfile]);

  return { profile, setProfile, isLoading, error, refetch: fetchProfile };
}

"use client";

// useDashboardScope — owns the dashboard FILTER state (date range + admin-tier staffId) and
// derives the query string that re-scopes the 9 reads. The data layer is FIXED: every read is
// gated server-side on dashboard.view and SELF-SCOPED from the token; an admin-tier caller may
// additionally pass `staffId` (honored only for admins — non-privileged callers are forced to
// their own id by the BE). So the staffId control is only surfaced for admin-tier users.
//
// Admin-tier is the legacy `isAdmin` union mirrored from the BE usecase: ADMIN / SUPER_ADMIN /
// isSuperSales (display-only flags off auth/me — NOT a gate; the BE re-derives scope from the
// token). This hook is presentational glue only — it builds a query SUFFIX the widgets append.

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/app/v2/providers/AuthProvider";

const ADMIN_TIER_ROLES = ["ADMIN", "SUPER_ADMIN"];

export function isAdminTier(user) {
  if (!user) return false;
  const role = user.activeRole ?? user.role;
  return ADMIN_TIER_ROLES.includes(role) || Boolean(user.isSuperSales);
}

const EMPTY = { startDate: "", endDate: "", staffId: "" };

export function useDashboardScope() {
  const { user } = useAuth();
  const adminTier = isAdminTier(user);

  // `draft` = the controlled inputs; `applied` = the values actually driving the reads. We only
  // re-scope on explicit apply so typing a date doesn't fire 9 requests per keystroke.
  const [draft, setDraft] = useState(EMPTY);
  const [applied, setApplied] = useState(EMPTY);

  const setField = useCallback((field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const apply = useCallback(() => setApplied(draft), [draft]);

  const reset = useCallback(() => {
    setDraft(EMPTY);
    setApplied(EMPTY);
  }, []);

  // Query SUFFIX appended to each read's URL. staffId is sent ONLY for admin-tier (the BE
  // ignores it for everyone else, but we keep the wire clean and never send it otherwise).
  const query = useMemo(() => {
    const qs = new URLSearchParams();
    if (applied.startDate) qs.set("startDate", applied.startDate);
    if (applied.endDate) qs.set("endDate", applied.endDate);
    if (adminTier && applied.staffId) qs.set("staffId", String(applied.staffId).trim());
    const s = qs.toString();
    return s ? `?${s}` : "";
  }, [applied, adminTier]);

  const isDirty =
    draft.startDate !== applied.startDate ||
    draft.endDate !== applied.endDate ||
    draft.staffId !== applied.staffId;

  const hasFilters = Boolean(applied.startDate || applied.endDate || applied.staffId);

  return { adminTier, draft, setField, apply, reset, query, isDirty, hasFilters };
}

export default useDashboardScope;

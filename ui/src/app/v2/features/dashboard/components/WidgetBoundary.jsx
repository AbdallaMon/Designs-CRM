"use client";

// <WidgetBoundary> — the per-widget state machine for the dashboard (UX plan §3.1: skeleton
// while loading, plain-Arabic error+retry on failure, role-aware empty when the read returns
// nothing). Wraps a single widget's loading/error/empty/content so EVERY dashboard section
// behaves consistently and one failed aggregation never blanks the whole page.
// Single-language Arabic / RTL.
//
// Props:
//   loading   bool             — show the skeleton.
//   error     string|object?   — useRequest error → ErrorState (resolved via dashboardMessages).
//   onRetry   () => void        — refetch handler for ErrorState.
//   isEmpty   bool             — render the empty state instead of children.
//   empty     { title?, description?, icon?, action? } — empty-state copy (role-aware).
//   skeleton  node?            — custom skeleton (defaults to a cards skeleton).
//   children  node             — the widget body when data is present.

import { LoadingState, ErrorState, EmptyState } from "@/app/v2/shared/components";
import { dashboardMessages } from "../config/dashboardMessages.js";

export function WidgetBoundary({
  loading,
  error,
  onRetry,
  isEmpty,
  empty = {},
  skeleton,
  children,
}) {
  if (loading) {
    return skeleton ?? <LoadingState variant="cards" count={3} columns={3} height={110} />;
  }
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={onRetry}
        resolver={dashboardMessages}
        title={dashboardMessages.WIDGET_LOAD_FAILED}
      />
    );
  }
  if (isEmpty) {
    return (
      <EmptyState
        title={empty.title ?? "لا توجد بيانات"}
        description={empty.description}
        icon={empty.icon}
        action={empty.action}
      />
    );
  }
  return children;
}

export default WidgetBoundary;

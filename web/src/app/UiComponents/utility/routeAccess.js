// Pure route-access helpers extracted from RouteGuard.jsx (verbatim logic,
// no behavior change). No imports — safe to unit-test directly in node env.

// Segment after "/dashboard/" in a pathname ("" for the landing itself,
// e.g. "/dashboard/deals/9" -> "deals", "/dashboard" -> "").
export function firstSegment(pathname) {
  const parts = pathname.split("/").filter(Boolean); // ["dashboard","leads",...]
  return parts[1] ?? "";
}

// Cross-cutting routes reachable outside the sidebar (notification bell,
// chat widget, task/detail links) — allowed regardless of nav membership.
export const ALWAYS_ALLOWED_SEGMENTS = new Set(["notifications", "chat", "tasks"]);

// A path is allowed if it's the shared `/dashboard` landing (every role's
// landing lives there), a cross-cutting always-allowed segment, or its first
// path segment matches a top-level or sub-link href in the role's nav tabs.
export function isAllowed(pathname, tabs) {
  if (pathname === "/dashboard") return true;
  const seg = firstSegment(pathname);
  if (ALWAYS_ALLOWED_SEGMENTS.has(seg)) return true;
  const allowed = new Set();
  for (const t of tabs) {
    const s = firstSegment(t.href);
    if (s) allowed.add(s);
    for (const sub of t.subLinks ?? []) {
      const ss = firstSegment(sub.href);
      if (ss) allowed.add(ss);
    }
  }
  return allowed.has(seg);
}

"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useAuth } from "@/app/providers/AuthProvider";

// Segment after "/dashboard/" in a pathname ("" for the landing itself,
// e.g. "/dashboard/deals/9" -> "deals", "/dashboard" -> "").
function firstSegment(pathname) {
  const parts = pathname.split("/").filter(Boolean); // ["dashboard","leads",...]
  return parts[1] ?? "";
}

// Cross-cutting routes reachable outside the sidebar (notification bell,
// chat widget, task/detail links) — allowed regardless of nav membership.
const ALWAYS_ALLOWED_SEGMENTS = new Set(["notifications", "chat", "tasks"]);

// A path is allowed if it's the shared `/dashboard` landing (every role's
// landing lives there), a cross-cutting always-allowed segment, or its first
// path segment matches a top-level or sub-link href in the role's nav tabs.
function isAllowed(pathname, tabs) {
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

export default function RouteGuard({ children }) {
  const { navigationTabs = [], validatingAuth, isLoggedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const landing = navigationTabs[0]?.href || "/dashboard";
  const blocked =
    isLoggedIn && !validatingAuth && !isAllowed(pathname, navigationTabs);

  useEffect(() => {
    if (!blocked) return;
    const t = setTimeout(() => router.push(landing), 1200);
    return () => clearTimeout(t);
  }, [blocked, landing, router]);

  // Still validating or not logged in: let the existing layout logic handle
  // the login redirect — render children as-is (no guard opinion yet).
  if (validatingAuth || !isLoggedIn) return children;

  if (blocked) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
          ليس لديك صلاحية للوصول إلى هذه الصفحة
        </Typography>
        <Typography variant="body2" color="text.secondary">
          سيتم تحويلك إلى صفحتك الرئيسية…
        </Typography>
      </Box>
    );
  }

  return children;
}

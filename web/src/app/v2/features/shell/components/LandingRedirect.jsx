"use client";

// <LandingRedirect /> — the /v2 entry redirect. The post-login redirect, the domain-root redirect,
// and the authed-on-auth-route redirect all point at the bare /v2 index; THIS component sends each
// user on to the first destination they can actually reach.
//
// Resolution (mirrors AppSidebarShell's own landingHref logic so the brand link and the landing
// never drift):
//   1. build the permission-filtered grouped nav (buildVisibleNav(usePermission)),
//   2. take the FIRST visible destination href,
//   3. fall back to /v2/dashboard when nothing resolves.
//
// We wait for auth validation to finish before resolving — otherwise usePermission sees the
// empty user and everyone would bounce to the fallback. While resolving we show a centered
// LoadingState. A redirect-loop guard only fires router.replace when the target is NOT the bare
// /v2 itself (so landing on /v2 with /v2 as target shows the loader rather than re-replacing).

import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { buildVisibleNav } from "../nav.config";
import { resolveNavGroup, resolveNavItem } from "../navLabels";
import { LoadingState } from "@/app/v2/shared/components/states/LoadingState";

const FALLBACK_HREF = "/v2/dashboard";

export function LandingRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { validatingAuth } = useAuth();
  const perm = usePermission();
  const [redirected, setRedirected] = useState(false);

  // Landing target: the FIRST visible destination in the user's permission-filtered nav, else the
  // dashboard fallback. A plain admin-panel landing — no per-role cockpit fan-out.
  const target = useMemo(() => {
    const groups = buildVisibleNav(perm, resolveNavGroup, resolveNavItem);
    return groups[0]?.items?.[0]?.href ?? FALLBACK_HREF;
  }, [perm]);

  useEffect(() => {
    // Wait for the session check; only redirect once, and never to the bare /v2 (loop guard).
    if (validatingAuth || redirected) return;
    if (!target || target === pathname || target === "/v2") return;
    setRedirected(true);
    router.replace(target);
  }, [validatingAuth, redirected, target, pathname, router]);

  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 480, px: 2 }}>
        <LoadingState variant="cards" count={2} columns={2} height={96} />
      </Box>
    </Box>
  );
}

export default LandingRedirect;

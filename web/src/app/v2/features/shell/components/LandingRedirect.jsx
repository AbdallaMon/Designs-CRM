"use client";

// <LandingRedirect /> — the /v2 fan-out (UX plan Phase 2a). Instead of hard-coding every entry
// (post-login, domain root, authed-on-auth-route) at /v2/dashboard, those entries point at the
// bare /v2 index, and THIS component sends each user on to THEIR default workspace's primary
// destination.
//
// Resolution (mirrors AppShellV2's own landingHref logic so the rail highlight and the landing
// never drift):
//   1. build the permission-filtered workspace nav (buildWorkspaceNav(usePermission)),
//   2. pick the role's default workspace among the ACCESSIBLE ones (resolveDefaultWorkspace),
//   3. take that workspace's FIRST visible destination href,
//   4. fall back to /v2/dashboard when nothing resolves.
//
// We wait for auth validation to finish before resolving — otherwise usePermission sees the
// empty user and everyone would bounce to the fallback. While resolving we show a centered
// LoadingState. A redirect-loop guard only fires router.replace when the target is NOT the bare
// /v2 itself (so landing on /v2 with /v2 as target shows the loader rather than re-replacing).
// Single-language Arabic / RTL.

import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { buildWorkspaceNav } from "../nav.config";
import {
  resolveNavItem,
  resolveDefaultWorkspace,
  resolveDefaultDestination,
} from "../navLabels";
import { LoadingState } from "@/app/v2/shared/components/states/LoadingState";

const FALLBACK_HREF = "/v2/dashboard";

export function LandingRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, validatingAuth } = useAuth();
  const perm = usePermission();
  const [redirected, setRedirected] = useState(false);

  // Landing target (audit H1). Order of preference:
  //   1. the role's EXPLICIT landing destination (sales personas → the daily cockpit) — but only
  //      when that href is actually reachable in the user's permission-filtered nav,
  //   2. otherwise the role's default workspace's FIRST visible destination,
  //   3. otherwise the fallback (/v2/dashboard).
  const target = useMemo(() => {
    const workspaceNav = buildWorkspaceNav(perm, resolveNavItem);

    // 1. explicit per-role override, gated by reachability (never send a user to a 403).
    const explicit = resolveDefaultDestination(user);
    if (explicit) {
      const reachable = workspaceNav.some((w) =>
        w.items.some((it) => it.href === explicit),
      );
      if (reachable) return explicit;
    }

    // 2. resolved-workspace first destination.
    const accessibleKeys = workspaceNav.map((w) => w.workspace.key);
    const defKey = resolveDefaultWorkspace(user, accessibleKeys);
    const ws = workspaceNav.find((w) => w.workspace.key === defKey);
    return ws?.items?.[0]?.href ?? FALLBACK_HREF;
  }, [perm, user]);

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

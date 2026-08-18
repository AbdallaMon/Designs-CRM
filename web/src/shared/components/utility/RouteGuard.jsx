"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useAuth } from "@/app/providers/AuthProvider";
import { isAllowed } from "@/shared/components/utility/routeAccess.js";

export default function RouteGuard({ children }) {
  const { user, navigationTabs = [], validatingAuth, isLoggedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const landing = navigationTabs[0]?.href || "/dashboard";
  const blocked =
    isLoggedIn && !validatingAuth && !isAllowed(pathname, navigationTabs, user?.profile);

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
          You don't have permission to access this page
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You'll be redirected to your home page…
        </Typography>
      </Box>
    );
  }

  return children;
}

"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useAuth } from "@/app/providers/AuthProvider";
import { isAllowed } from "./routeAccess";

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

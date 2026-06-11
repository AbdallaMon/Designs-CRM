"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/v2/shared/hooks/useAuth";

/**
 * Wraps protected pages.
 *
 * While the session is being validated → renders nothing (no flash).
 * If not logged in after validation → redirects to /login.
 * If logged in → renders children normally.
 *
 * Usage:
 *   <AuthGuard>
 *     <DashboardPage />
 *   </AuthGuard>
 */
export default function AuthGuard({ children }) {
  const { isLoggedIn, validatingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!validatingAuth && !isLoggedIn) {
      router.push("/login");
    }
  }, [validatingAuth, isLoggedIn, router]);

  if (validatingAuth || !isLoggedIn) return null;

  return children;
}

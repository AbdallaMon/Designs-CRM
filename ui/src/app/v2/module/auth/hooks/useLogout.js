"use client";
import { useAuth } from "@/app/v2/shared/hooks/useAuth";

/**
 * Hook that exposes a `logout` function.
 * Calls the backend to invalidate the session, clears auth state,
 * and redirects to /login — all handled inside AuthProvider.logout().
 */
export function useLogout() {
  const { logout } = useAuth();
  return { logout };
}

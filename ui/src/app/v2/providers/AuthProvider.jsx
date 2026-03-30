"use client";
import {
  createContext,
  useEffect,
  useCallback,
  useState,
  useContext,
} from "react";
import { useRouter } from "next/navigation";
import apiFetch from "@/app/v2/lib/api/ApiFetch";
import { PROTECTED_PREFIXES } from "../lib/constant";

export const AuthContext = createContext(null);

const EMPTY_USER = { role: null, emailConfirmed: null, accountStatus: null };

/**
 * v2-native AuthProvider. Mount once at the root of any v2 layout.
 * Validates the session via GET auth/status on mount.
 *
 * Exposes intent-based actions (setAuthUser, logout) instead of raw setters
 * so callers cannot bypass the auth flow.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(EMPTY_USER);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [validatingAuth, setValidatingAuth] = useState(true);
  const router = useRouter();

  /** Called by useLogin after a successful login response. */
  const setAuthUser = useCallback((userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  }, []);

  /** Clears auth state and redirects to /login. */
  const logout = useCallback(async () => {
    await apiFetch.post("auth/logout");
    setUser(EMPTY_USER);
    setIsLoggedIn(false);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    // Redirect to /login whenever a 401 is received after a failed token refresh.
    apiFetch.onAuthFailure = () => {
      setUser(EMPTY_USER);
      setIsLoggedIn(false);
      const pathname = window.location.pathname;
      const isProtected = PROTECTED_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix),
      );
      if (isProtected) {
        router.push("/login");
      }
    };
  }, [router]);

  useEffect(() => {
    async function validateSession() {
      setValidatingAuth(true);
      try {
        const result = await apiFetch.get("auth/me");
        if (result.status !== 200) throw new Error("Unauthenticated");
        setUser(result.data.user);
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
        setUser(EMPTY_USER);
      } finally {
        setValidatingAuth(false);
      }
    }

    validateSession();
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        validatingAuth,
        setAuthUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

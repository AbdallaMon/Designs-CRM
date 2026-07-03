"use client";
import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/app/helpers/functions/apiClient";

export const AuthContext = createContext(null);
export default function AuthProvider({ children }) {
  const [user, setUser] = useState({
    role: null,
    emailConfirmed: null,
  });
  // Real permission codes emitted by /v2/auth/me — the single source of truth for gating
  // (the collapsed, role-agnostic feature pages gate on these, not on role).
  const [permissions, setPermissions] = useState([]);
  const [permissionsByModule, setPermissionsByModule] = useState({});
  // Per-role sidebar nav tabs emitted by /v2/auth/me (Task 6) — single source of
  // truth for the dashboard sidebar, mirrors `permissions`/`permissionsByModule`.
  const [navigationTabs, setNavigationTabs] = useState([]);
  // DB-relational profiles: the profiles the user holds + which is active. Switching
  // the current profile re-pulls /auth/me (refetchMe), which re-gates the whole app.
  const [profiles, setProfiles] = useState([]);
  const [currentProfileId, setCurrentProfileId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [validatingAuth, setValidatingAuth] = useState(true);

  const fetchMe = useCallback(async () => {
    setValidatingAuth(true);
    try {
      const response = await apiRequest("auth/me");
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const result = await response.json();
      const me = result?.data ?? result;
      let nextUser = me.user;

      // Preserve master's local role override (used by the role switcher in dev).
      if (
        typeof window !== "undefined" &&
        window.localStorage.getItem("role") &&
        window.localStorage.getItem("userId") &&
        nextUser?.id === parseInt(window.localStorage.getItem("userId"))
      ) {
        nextUser = { ...nextUser, role: window.localStorage.getItem("role") };
      }

      setUser(nextUser);
      setPermissions(nextUser?.permissions ?? []);
      setPermissionsByModule(nextUser?.permissionsByModule ?? {});
      setNavigationTabs(nextUser?.navigationTabs ?? []);
      setProfiles(nextUser?.profiles ?? []);
      setCurrentProfileId(nextUser?.currentProfileId ?? null);
      setIsLoggedIn(true);
    } catch (err) {
      setIsLoggedIn(false);
      setPermissions([]);
      setPermissionsByModule({});
      setNavigationTabs([]);
      setProfiles([]);
      setCurrentProfileId(null);
      setUser({
        role: null,
        emailConfirmed: null,
        accountStatus: null,
      });
    } finally {
      setValidatingAuth(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        permissionsByModule,
        navigationTabs,
        profiles,
        currentProfileId,
        isLoggedIn,
        setIsLoggedIn,
        validatingAuth,
        setValidatingAuth,
        setUser,
        refetchMe: fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};

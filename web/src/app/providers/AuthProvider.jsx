"use client";
import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/app/helpers/functions/apiClient";

export const AuthContext = createContext(null);
export default function AuthProvider({ children }) {
  const [user, setUser] = useState({ profile: null, emailConfirmed: null });
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
      const nextUser = me.user;

      // NOTE: the old localStorage `role` override was removed — it desynced
      // `user.profile` from the profile-derived `navigationTabs`/permissions and broke
      // route access. Profile switching now goes through /auth/profile/switch +
      // refetchMe (a real, server-side switch).

      setUser(nextUser);
      setPermissions(nextUser?.permissions ?? []);
      setPermissionsByModule(nextUser?.permissionsByModule ?? {});
      setNavigationTabs(nextUser?.navigationTabs ?? []);
      setProfiles(nextUser?.profiles ?? []);
      setCurrentProfileId(nextUser?.currentProfileId ?? null);
      setIsLoggedIn(true);
      return nextUser;
    } catch (err) {
      setIsLoggedIn(false);
      setPermissions([]);
      setPermissionsByModule({});
      setNavigationTabs([]);
      setProfiles([]);
      setCurrentProfileId(null);
      setUser({ profile: null, emailConfirmed: null, accountStatus: null });
      return null;
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

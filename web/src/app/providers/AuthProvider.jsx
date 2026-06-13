"use client";
import { createContext, useContext, useEffect, useState } from "react";
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [validatingAuth, setValidatingAuth] = useState(true);
  useEffect(() => {
    async function fetchData() {
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
        setPermissions(me.permissions ?? []);
        setPermissionsByModule(me.permissionsByModule ?? {});
        setIsLoggedIn(true);
      } catch (err) {
        setIsLoggedIn(false);
        setPermissions([]);
        setPermissionsByModule({});
        setUser({
          role: null,
          emailConfirmed: null,
          accountStatus: null,
        });
      } finally {
        setValidatingAuth(false);
      }
    }

    fetchData();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        permissionsByModule,
        isLoggedIn,
        setIsLoggedIn,
        validatingAuth,
        setValidatingAuth,
        setUser,
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
